export interface ReputationVector {
  successRate: number;
  avgLatencyMs: number;
  costEfficiency: number;
  verificationScore: number;
  safetyCompliance: number;
  totalTasks: number;
  compositeScore: number;
}

const WEIGHTS = {
  successRate: 0.30,
  costEfficiency: 0.20,
  verificationScore: 0.20,
  safetyCompliance: 0.20,
  latency: 0.10,
};

export function computeComposite(rep: Omit<ReputationVector, 'compositeScore'>): number {
  const latencyScore = Math.max(0, 1 - rep.avgLatencyMs / 2000);
  return (
    WEIGHTS.successRate * rep.successRate +
    WEIGHTS.costEfficiency * rep.costEfficiency +
    WEIGHTS.verificationScore * rep.verificationScore +
    WEIGHTS.safetyCompliance * rep.safetyCompliance +
    WEIGHTS.latency * latencyScore
  );
}

export function createReputation(overrides: Partial<ReputationVector> = {}): ReputationVector {
  const base: Omit<ReputationVector, 'compositeScore'> = {
    successRate: overrides.successRate ?? 0.95,
    avgLatencyMs: overrides.avgLatencyMs ?? 200,
    costEfficiency: overrides.costEfficiency ?? 0.85,
    verificationScore: overrides.verificationScore ?? 0.90,
    safetyCompliance: overrides.safetyCompliance ?? 1.0,
    totalTasks: overrides.totalTasks ?? 0,
  };
  return { ...base, compositeScore: computeComposite(base) };
}

export function updateReputation(
  current: ReputationVector,
  taskResult: { success: boolean; latencyMs: number; costRatio: number; verified: boolean }
): ReputationVector {
  const n = current.totalTasks + 1;
  const updated = {
    successRate: ((current.successRate * current.totalTasks) + (taskResult.success ? 1 : 0)) / n,
    avgLatencyMs: ((current.avgLatencyMs * current.totalTasks) + taskResult.latencyMs) / n,
    costEfficiency: ((current.costEfficiency * current.totalTasks) + taskResult.costRatio) / n,
    verificationScore: ((current.verificationScore * current.totalTasks) + (taskResult.verified ? 1 : 0)) / n,
    safetyCompliance: current.safetyCompliance,
    totalTasks: n,
  };
  return { ...updated, compositeScore: computeComposite(updated) };
}
