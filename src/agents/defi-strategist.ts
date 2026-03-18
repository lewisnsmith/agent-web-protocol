import { createPassport, type AgentIdentity } from '../primitives/agent-passport.js';

export function createDefiStrategist(): AgentIdentity {
  return createPassport({
    name: 'DeFi Strategist',
    role: 'requester',
    capabilities: [
      {
        namespace: 'portfolio.rebalance',
        version: '1.0.0',
        inputSchema: { portfolio: 'PortfolioState', targetAllocation: 'AllocationMap' },
        outputSchema: { executedTrades: 'Trade[]', finalState: 'PortfolioState' },
        sideEffects: ['executes_onchain_transactions'],
      },
    ],
    pricing: { type: 'fixed', basePriceUSDC: 0 },
    trustLevel: 'standard',
    sla: { maxLatencyMs: 5000, uptimePercent: 99.5, rollbackPolicy: 'full-refund' },
    reputation: { successRate: 0.96, avgLatencyMs: 450, costEfficiency: 0.88, verificationScore: 0.94, safetyCompliance: 1.0, totalTasks: 127 },
    staking: { collateralUSDC: 500, slashable: true },
  });
}
