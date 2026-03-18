import { v4 as uuid } from 'uuid';
import { sign } from '../crypto/signing.js';

export interface SuccessCriterion {
  metric: string;
  operator: 'lte' | 'gte' | 'eq';
  threshold: number | string;
}

export interface TaskDefinition {
  goal: string;
  capability: string;
  inputs: Record<string, unknown>;
  decomposable: boolean;
  subTasks?: TaskDefinition[];
}

export interface IntentContract {
  id: string;
  requesterDID: string;
  task: TaskDefinition;
  budget: { ceilingUSDC: number; currency: 'USDC' };
  deadline: { durationMs: number; hardDeadline: string };
  successCriteria: SuccessCriterion[];
  verificationMode: 'lightweight' | 'standard' | 'high-trust';
  disputeResolution: 'automatic-slash' | 'verifier-quorum';
  privacy: 'public' | 'encrypted';
  signature: string;
  status: 'open' | 'matched' | 'in-progress' | 'completed' | 'failed' | 'disputed';
  createdAt: string;
}

export interface IntentContractInput {
  requesterDID: string;
  task: TaskDefinition;
  budget: { ceilingUSDC: number };
  deadlineMs: number;
  successCriteria: SuccessCriterion[];
  verificationMode: 'lightweight' | 'standard' | 'high-trust';
  disputeResolution?: 'automatic-slash' | 'verifier-quorum';
  privacy?: 'public' | 'encrypted';
}

export function createIntentContract(
  input: IntentContractInput,
  secretKey: Uint8Array
): IntentContract {
  const now = new Date();
  const contract: IntentContract = {
    id: `intent-${uuid().split('-')[0]}`,
    requesterDID: input.requesterDID,
    task: input.task,
    budget: { ceilingUSDC: input.budget.ceilingUSDC, currency: 'USDC' },
    deadline: {
      durationMs: input.deadlineMs,
      hardDeadline: new Date(now.getTime() + input.deadlineMs).toISOString(),
    },
    successCriteria: input.successCriteria,
    verificationMode: input.verificationMode,
    disputeResolution: input.disputeResolution ?? 'automatic-slash',
    privacy: input.privacy ?? 'public',
    signature: '',
    status: 'open',
    createdAt: now.toISOString(),
  };

  const message = JSON.stringify({ ...contract, signature: undefined });
  contract.signature = sign(message, secretKey);
  return contract;
}
