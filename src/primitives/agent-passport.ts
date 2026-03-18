import { v4 as uuid } from 'uuid';
import { generateKeyPair, sign, type KeyPair } from '../crypto/signing.js';
import { createReputation, type ReputationVector } from '../reputation/scoring.js';

export interface Capability {
  namespace: string;
  version: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  sideEffects: string[];
}

export interface PricingModel {
  type: 'fixed' | 'per-step' | 'auction' | 'success-based';
  basePriceUSDC: number;
  successBonus?: number;
}

export interface SLA {
  maxLatencyMs: number;
  uptimePercent: number;
  rollbackPolicy: 'full-refund' | 'partial-refund' | 'none';
}

export interface AgentPassport {
  did: string;
  name: string;
  role: 'requester' | 'worker' | 'broker';
  capabilities: Capability[];
  pricing: PricingModel;
  trustLevel: 'lightweight' | 'standard' | 'high-trust';
  sla: SLA;
  reputation: ReputationVector;
  staking: { collateralUSDC: number; slashable: boolean };
  publicKey: string;
  signature: string;
  registeredAt: string;
}

export interface AgentPassportInput {
  name: string;
  role: 'requester' | 'worker' | 'broker';
  capabilities: Capability[];
  pricing: PricingModel;
  trustLevel: 'lightweight' | 'standard' | 'high-trust';
  sla: SLA;
  reputation?: Partial<ReputationVector>;
  staking: { collateralUSDC: number; slashable: boolean };
}

export interface AgentIdentity {
  passport: AgentPassport;
  keyPair: KeyPair;
}

export function createPassport(input: AgentPassportInput): AgentIdentity {
  const keyPair = generateKeyPair();
  const shortId = uuid().split('-')[0];
  const did = `did:aexp:${input.name.toLowerCase().replace(/\s+/g, '-')}-${shortId}`;
  const reputation = createReputation(input.reputation);

  const passportData: Omit<AgentPassport, 'signature'> = {
    did,
    name: input.name,
    role: input.role,
    capabilities: input.capabilities,
    pricing: input.pricing,
    trustLevel: input.trustLevel,
    sla: input.sla,
    reputation,
    staking: input.staking,
    publicKey: keyPair.publicKey,
    signature: '',
    registeredAt: new Date().toISOString(),
  };

  const message = JSON.stringify({ ...passportData, signature: undefined });
  const signature = sign(message, keyPair.secretKey);

  const passport: AgentPassport = { ...passportData, signature };
  return { passport, keyPair };
}
