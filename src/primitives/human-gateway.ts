export interface GatewayLogEntry {
  agentDID: string;
  url: string;
  timestamp: string;
  reason: string;
  metered: boolean;
}

export interface GatewayResponse {
  status: 'success' | 'rate-limited' | 'blocked';
  data?: Record<string, unknown>;
  logEntry: GatewayLogEntry;
}

export class HumanGateway {
  readonly id: string = 'gateway-001';
  readonly rateLimitPerMinute: number;
  private requestLog: GatewayLogEntry[] = [];
  private requestsThisMinute: number = 0;
  private minuteStart: number = Date.now();

  constructor(rateLimitPerMinute: number = 10) {
    this.rateLimitPerMinute = rateLimitPerMinute;
  }

  fetch(url: string, agentDID: string, reason: string): GatewayResponse {
    const now = Date.now();
    if (now - this.minuteStart > 60_000) {
      this.requestsThisMinute = 0;
      this.minuteStart = now;
    }

    const logEntry: GatewayLogEntry = {
      agentDID,
      url,
      timestamp: new Date().toISOString(),
      reason,
      metered: true,
    };
    this.requestLog.push(logEntry);

    if (this.requestsThisMinute >= this.rateLimitPerMinute) {
      return { status: 'rate-limited', logEntry };
    }

    this.requestsThisMinute++;

    // Mock response - in production this would actually fetch the URL
    const mockData = this.getMockData(url);
    return { status: 'success', data: mockData, logEntry };
  }

  private getMockData(url: string): Record<string, unknown> {
    if (url.includes('coingecko') || url.includes('price')) {
      return {
        ETH: { usd: 3245.67 },
        WBTC: { usd: 67891.23 },
        USDC: { usd: 1.00 },
        source: 'human-gateway-fallback',
        warning: 'Data from legacy web scraping - prefer agent-native endpoints',
      };
    }
    return { raw: 'Mock HTML content', parsed: true };
  }

  getLog(): GatewayLogEntry[] {
    return [...this.requestLog];
  }

  get totalRequests(): number {
    return this.requestLog.length;
  }
}
