import { v4 as uuid } from 'uuid';

export interface EscrowState {
  totalFundedUSDC: number;
  releasedUSDC: number;
  remainingUSDC: number;
  refundedUSDC: number;
}

export interface Milestone {
  id: string;
  description: string;
  payeeDID: string;
  amountUSDC: number;
  status: 'pending' | 'completed' | 'failed';
  completedAt?: string;
  proofHash?: string;
}

export interface SlashingRule {
  condition: string;
  penalty: number;
  beneficiary: 'requester' | 'insurance-pool';
}

export interface SettlementContract {
  id: string;
  intentContractId: string;
  escrow: EscrowState;
  milestones: Milestone[];
  slashingRules: SlashingRule[];
  status: 'funded' | 'in-progress' | 'settled' | 'slashed' | 'refunded';
  createdAt: string;
}

export interface SettlementInput {
  intentContractId: string;
  milestones: { description: string; payeeDID: string; amountUSDC: number }[];
  slashingRules: SlashingRule[];
}

export function createSettlement(input: SettlementInput): SettlementContract {
  const total = input.milestones.reduce((sum, m) => sum + m.amountUSDC, 0);
  return {
    id: `settle-${uuid().split('-')[0]}`,
    intentContractId: input.intentContractId,
    escrow: {
      totalFundedUSDC: total,
      releasedUSDC: 0,
      remainingUSDC: total,
      refundedUSDC: 0,
    },
    milestones: input.milestones.map(m => ({
      id: `ms-${uuid().split('-')[0]}`,
      description: m.description,
      payeeDID: m.payeeDID,
      amountUSDC: m.amountUSDC,
      status: 'pending' as const,
    })),
    slashingRules: input.slashingRules,
    status: 'funded',
    createdAt: new Date().toISOString(),
  };
}

export function completeMilestone(
  settlement: SettlementContract,
  milestoneId: string,
  proofHash: string
): { success: boolean; released: number } {
  const milestone = settlement.milestones.find(m => m.id === milestoneId);
  if (!milestone || milestone.status !== 'pending') {
    return { success: false, released: 0 };
  }

  milestone.status = 'completed';
  milestone.completedAt = new Date().toISOString();
  milestone.proofHash = proofHash;
  settlement.escrow.releasedUSDC += milestone.amountUSDC;
  settlement.escrow.remainingUSDC -= milestone.amountUSDC;
  settlement.status = 'in-progress';

  if (settlement.milestones.every(m => m.status === 'completed')) {
    settlement.status = 'settled';
  }

  return { success: true, released: milestone.amountUSDC };
}

export function slashMilestone(
  settlement: SettlementContract,
  milestoneId: string,
  ruleIndex: number
): { slashed: number; refunded: number } {
  const milestone = settlement.milestones.find(m => m.id === milestoneId);
  const rule = settlement.slashingRules[ruleIndex];
  if (!milestone || !rule) return { slashed: 0, refunded: 0 };

  milestone.status = 'failed';
  const slashAmount = Math.min(rule.penalty, milestone.amountUSDC);
  const refunded = milestone.amountUSDC - slashAmount;

  settlement.escrow.remainingUSDC -= milestone.amountUSDC;
  settlement.escrow.refundedUSDC += refunded;
  settlement.status = 'slashed';

  return { slashed: slashAmount, refunded };
}
