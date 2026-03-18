import { createPassport, type AgentIdentity } from '../primitives/agent-passport.js';

export function createPriceOracle(): AgentIdentity {
  return createPassport({
    name: 'Price Oracle',
    role: 'worker',
    capabilities: [
      {
        namespace: 'price.feed',
        version: '3.0.0',
        inputSchema: { tokens: 'string[]', baseCurrency: 'string' },
        outputSchema: { prices: 'PriceMap', timestamp: 'string', confidence: 'number' },
        sideEffects: [],
      },
    ],
    pricing: { type: 'fixed', basePriceUSDC: 8 },
    trustLevel: 'high-trust',
    sla: { maxLatencyMs: 50, uptimePercent: 99.99, rollbackPolicy: 'full-refund' },
    reputation: { successRate: 0.99, avgLatencyMs: 32, costEfficiency: 0.95, verificationScore: 0.98, safetyCompliance: 1.0, totalTasks: 15782 },
    staking: { collateralUSDC: 5000, slashable: true },
  });
}
