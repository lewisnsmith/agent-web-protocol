import type { AgentPassport } from './agent-passport.js';

export interface DiscoveryQuery {
  capabilityNamespace?: string;
  minTrustLevel?: 'lightweight' | 'standard' | 'high-trust';
  maxLatencyMs?: number;
  maxPriceUSDC?: number;
  minReputationScore?: number;
  role?: 'requester' | 'worker' | 'broker';
}

const TRUST_ORDER: Record<string, number> = {
  'lightweight': 0,
  'standard': 1,
  'high-trust': 2,
};

export class AgentDNS {
  private agents: Map<string, AgentPassport> = new Map();

  register(passport: AgentPassport): void {
    this.agents.set(passport.did, passport);
  }

  resolve(did: string): AgentPassport | null {
    return this.agents.get(did) ?? null;
  }

  search(query: DiscoveryQuery): AgentPassport[] {
    const results: AgentPassport[] = [];

    for (const agent of this.agents.values()) {
      if (query.role && agent.role !== query.role) continue;

      if (query.capabilityNamespace) {
        const hasCapability = agent.capabilities.some(c => c.namespace === query.capabilityNamespace);
        if (!hasCapability) continue;
      }

      if (query.minTrustLevel) {
        if (TRUST_ORDER[agent.trustLevel] < TRUST_ORDER[query.minTrustLevel]) continue;
      }

      if (query.maxLatencyMs && agent.sla.maxLatencyMs > query.maxLatencyMs) continue;
      if (query.maxPriceUSDC && agent.pricing.basePriceUSDC > query.maxPriceUSDC) continue;
      if (query.minReputationScore && agent.reputation.compositeScore < query.minReputationScore) continue;

      results.push(agent);
    }

    return results.sort((a, b) => b.reputation.compositeScore - a.reputation.compositeScore);
  }

  listAll(): AgentPassport[] {
    return Array.from(this.agents.values());
  }

  get size(): number {
    return this.agents.size;
  }
}
