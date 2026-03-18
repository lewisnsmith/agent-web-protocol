import chalk from 'chalk';
import { banner, phase, step, success, fail, info, warn, separator, delay } from '../utils/logger.js';
import { passportCard, discoveryTable, intentSummary, settlementSummary, comparisonDashboard } from '../utils/display.js';
import { verify } from '../crypto/signing.js';
import { AgentDNS } from '../primitives/agent-dns.js';
import { createIntentContract } from '../primitives/intent-contract.js';
import { SessionChannelManager } from '../primitives/session-channel.js';
import { createSettlement, completeMilestone, slashMilestone } from '../primitives/settlement.js';
import { HumanGateway } from '../primitives/human-gateway.js';
import { updateReputation } from '../reputation/scoring.js';
import { createDefiStrategist } from '../agents/defi-strategist.js';
import { createDexExecutor } from '../agents/dex-executor.js';
import { createPriceOracle } from '../agents/price-oracle.js';

const PHASE_DELAY = 1200;
const STEP_DELAY = 400;

async function runDemo() {
  const startTime = Date.now();

  // ─── Banner ───────────────────────────────────────────────
  console.log(chalk.cyan(banner(
    'AEXP Protocol Demo — Agent Labor Market',
    'Scenario: DeFi Portfolio Rebalancing ($50K)'
  )));
  await delay(PHASE_DELAY);

  // ─── Phase 1: Agent Passport Registration ─────────────────
  console.log(phase(1, 'Agent Passport Registration'));
  await delay(STEP_DELAY);

  const strategist = createDefiStrategist();
  const executor = createDexExecutor();
  const oracle = createPriceOracle();

  for (const agent of [strategist, executor, oracle]) {
    console.log(step(`Registering agent: ${chalk.bold(agent.passport.name)}`));

    // Verify the self-signed passport with real crypto
    const passportData = JSON.stringify({ ...agent.passport, signature: undefined });
    const isValid = verify(passportData, agent.passport.signature, agent.passport.publicKey);
    if (!isValid) {
      console.log(fail(`Passport signature INVALID for ${agent.passport.name}`));
      return;
    }

    console.log(passportCard(agent.passport));
    await delay(STEP_DELAY);
  }

  // Register in Agent DNS
  const dns = new AgentDNS();
  dns.register(strategist.passport);
  dns.register(executor.passport);
  dns.register(oracle.passport);
  console.log(success(`${dns.size} agents registered in Agent DNS`));
  await delay(PHASE_DELAY);

  // ─── Phase 2: Agent DNS Discovery ─────────────────────────
  console.log(phase(2, 'Agent DNS Discovery'));
  await delay(STEP_DELAY);

  console.log(step('Strategist queries DNS for worker agents...'));
  console.log(info(`Query: ${chalk.white('{ capability: "dex.swap", trustLevel >= "standard", latency <= 500ms }')}`));
  await delay(STEP_DELAY);

  const swapResults = dns.search({
    capabilityNamespace: 'dex.swap',
    minTrustLevel: 'standard',
    maxLatencyMs: 500,
    role: 'worker',
  });
  console.log(success(`Found ${swapResults.length} matching agent(s) for dex.swap:`));
  console.log(discoveryTable(swapResults));
  await delay(STEP_DELAY);

  console.log(info(`Query: ${chalk.white('{ capability: "price.feed", minReputation >= 0.9 }')}`));
  const feedResults = dns.search({
    capabilityNamespace: 'price.feed',
    minReputationScore: 0.9,
    role: 'worker',
  });
  console.log(success(`Found ${feedResults.length} matching agent(s) for price.feed:`));
  console.log(discoveryTable(feedResults));
  await delay(PHASE_DELAY);

  // ─── Phase 3: Intent Contract ─────────────────────────────
  console.log(phase(3, 'Intent Contract Issuance'));
  await delay(STEP_DELAY);

  console.log(step('Strategist creates an Intent Contract...'));
  const intent = createIntentContract({
    requesterDID: strategist.passport.did,
    task: {
      goal: 'Rebalance portfolio to target: 40% ETH, 35% USDC, 25% WBTC',
      capability: 'portfolio.rebalance',
      inputs: {
        currentPortfolio: { ETH: 18500, USDC: 22000, WBTC: 9500 },
        targetAllocation: { ETH: 0.40, USDC: 0.35, WBTC: 0.25 },
        totalValueUSDC: 50000,
      },
      decomposable: true,
      subTasks: [
        { goal: 'Fetch real-time prices for ETH, WBTC, USDC', capability: 'price.feed', inputs: { tokens: ['ETH', 'WBTC', 'USDC'] }, decomposable: false },
        { goal: 'Execute ETH/USDC swap', capability: 'dex.swap', inputs: { fromToken: 'USDC', toToken: 'ETH', amount: 1500, maxSlippage: 0.01 }, decomposable: false },
        { goal: 'Execute WBTC/USDC swap', capability: 'dex.swap', inputs: { fromToken: 'USDC', toToken: 'WBTC', amount: 3000, maxSlippage: 0.01 }, decomposable: false },
        { goal: 'Execute ETH/WBTC rebalance', capability: 'dex.swap', inputs: { fromToken: 'ETH', toToken: 'WBTC', amount: 500, maxSlippage: 0.01 }, decomposable: false },
      ],
    },
    budget: { ceilingUSDC: 50 },
    deadlineMs: 30000,
    successCriteria: [
      { metric: 'slippage', operator: 'lte', threshold: 0.01 },
      { metric: 'swaps_executed', operator: 'eq', threshold: 3 },
    ],
    verificationMode: 'standard',
  }, strategist.keyPair.secretKey);

  console.log(intentSummary(intent));
  console.log(success(`Intent Contract signed and broadcast`));
  await delay(PHASE_DELAY);

  // ─── Phase 4: Session Channel Negotiation ─────────────────
  console.log(phase(4, 'Session Channel Negotiation'));
  await delay(STEP_DELAY);

  const sessions = new SessionChannelManager();
  const channel = sessions.open(intent.id, [
    strategist.passport.did,
    executor.passport.did,
    oracle.passport.did,
  ]);
  console.log(step(`Session ${chalk.cyan(channel.id)} opened`));
  console.log(info(`Participants: ${channel.participants.map(d => chalk.cyan(d.split(':').pop())).join(', ')}`));
  await delay(STEP_DELAY);

  // Bids
  const oracleBid = sessions.sendMessage(channel.id, oracle.passport.did, 'bid', {
    capability: 'price.feed',
    priceUSDC: 8,
    estimatedLatencyMs: 35,
    message: 'Multi-source aggregated feed with 99.9% uptime',
  }, oracle.keyPair.secretKey);
  console.log(step(`${chalk.yellow('Price Oracle')} bids: ${chalk.green('8 USDC')} — "${oracleBid.payload.message}"`));
  await delay(STEP_DELAY);

  const executorBid = sessions.sendMessage(channel.id, executor.passport.did, 'bid', {
    capability: 'dex.swap',
    priceUSDC: 30,
    estimatedLatencyMs: 110,
    message: '3 swaps with MEV protection, atomic execution guarantee',
  }, executor.keyPair.secretKey);
  console.log(step(`${chalk.yellow('DEX Executor')} bids: ${chalk.green('30 USDC')} — "${executorBid.payload.message}"`));
  await delay(STEP_DELAY);

  // Accept bids
  sessions.sendMessage(channel.id, strategist.passport.did, 'accept', {
    acceptedAgents: [oracle.passport.did, executor.passport.did],
    totalCostUSDC: 38,
    message: 'Both bids accepted. 38 USDC total, under 50 USDC ceiling.',
  }, strategist.keyPair.secretKey);
  console.log(success(`Strategist accepts both bids — ${chalk.green('38 USDC')} total (budget: 50 USDC)`));
  sessions.activate(channel.id);
  console.log(success(`Session channel ${chalk.cyan('ACTIVATED')}`));
  await delay(PHASE_DELAY);

  // ─── Phase 5: Settlement Contract & Escrow ────────────────
  console.log(phase(5, 'Settlement Contract & Escrow'));
  await delay(STEP_DELAY);

  const settlement = createSettlement({
    intentContractId: intent.id,
    milestones: [
      { description: 'Deliver signed price feeds (ETH, WBTC, USDC)', payeeDID: oracle.passport.did, amountUSDC: 8 },
      { description: 'Execute 3 DEX swaps within 1% slippage', payeeDID: executor.passport.did, amountUSDC: 30 },
    ],
    slashingRules: [
      { condition: 'slippage > 1%', penalty: 15, beneficiary: 'requester' },
      { condition: 'deadline_exceeded', penalty: 10, beneficiary: 'requester' },
    ],
  });

  console.log(step(`Escrow funded: ${chalk.green(settlement.escrow.totalFundedUSDC + ' USDC')}`));
  console.log(settlementSummary(settlement));
  await delay(PHASE_DELAY);

  // ─── Phase 6: Task Execution ──────────────────────────────
  console.log(phase(6, 'Task Execution'));
  await delay(STEP_DELAY);

  // Sub-task 1: Price Oracle delivers feeds
  console.log(step(`${chalk.yellow('Price Oracle')} fetching real-time prices...`));
  await delay(600);
  sessions.sendMessage(channel.id, oracle.passport.did, 'artifact', {
    type: 'price_feed',
    data: {
      ETH: { usd: 3245.67, confidence: 0.998 },
      WBTC: { usd: 67891.23, confidence: 0.997 },
      USDC: { usd: 1.0001, confidence: 0.999 },
    },
    sources: 5,
    timestamp: new Date().toISOString(),
  }, oracle.keyPair.secretKey);
  console.log(success('Price feeds delivered (5-source aggregation, confidence > 99.7%)'));

  const priceMilestone = settlement.milestones[0];
  const priceResult = completeMilestone(settlement, priceMilestone.id, 'sha256:a8f3c1d2e5b7...proof');
  console.log(success(`Milestone completed — ${chalk.green(priceResult.released + ' USDC')} released to Price Oracle`));
  await delay(STEP_DELAY);

  // Sub-task 2: DEX Executor runs swaps
  console.log(separator());
  const swaps = [
    { from: 'USDC', to: 'ETH', amount: 1500, slippage: 0.003 },
    { from: 'USDC', to: 'WBTC', amount: 3000, slippage: 0.005 },
    { from: 'ETH', to: 'WBTC', amount: 500, slippage: 0.002 },
  ];

  for (const [i, swap] of swaps.entries()) {
    console.log(step(`${chalk.yellow('DEX Executor')} executing swap ${i + 1}/3: ${swap.amount} ${swap.from} → ${swap.to}...`));
    await delay(500);

    sessions.sendMessage(channel.id, executor.passport.did, 'milestone', {
      type: 'swap_executed',
      txHash: `0x${Math.random().toString(16).slice(2, 18)}`,
      fromToken: swap.from,
      toToken: swap.to,
      amount: swap.amount,
      actualSlippage: swap.slippage,
      mevProtected: true,
    }, executor.keyPair.secretKey);

    console.log(success(`Swap ${i + 1} confirmed — slippage: ${chalk.green((swap.slippage * 100).toFixed(1) + '%')} (limit: 1.0%)`));
    await delay(STEP_DELAY);
  }

  const swapMilestone = settlement.milestones[1];
  const swapResult = completeMilestone(settlement, swapMilestone.id, 'sha256:f7b2e9c4d1a6...proof');
  console.log(success(`Milestone completed — ${chalk.green(swapResult.released + ' USDC')} released to DEX Executor`));
  await delay(STEP_DELAY);

  // Show final settlement
  console.log(separator());
  console.log(settlementSummary(settlement));
  await delay(PHASE_DELAY);

  // ─── Phase 7: Reputation Update & Summary ─────────────────
  console.log(phase(7, 'Reputation Update & Final Summary'));
  await delay(STEP_DELAY);

  // Update reputations
  const updatedOracle = updateReputation(oracle.passport.reputation, {
    success: true, latencyMs: 35, costRatio: 0.95, verified: true,
  });
  const updatedExecutor = updateReputation(executor.passport.reputation, {
    success: true, latencyMs: 110, costRatio: 0.92, verified: true,
  });
  const updatedStrategist = updateReputation(strategist.passport.reputation, {
    success: true, latencyMs: 450, costRatio: 0.88, verified: true,
  });

  console.log(step('Reputation scores updated:'));
  for (const [name, before, after] of [
    ['DeFi Strategist', strategist.passport.reputation.compositeScore, updatedStrategist.compositeScore],
    ['DEX Executor', executor.passport.reputation.compositeScore, updatedExecutor.compositeScore],
    ['Price Oracle', oracle.passport.reputation.compositeScore, updatedOracle.compositeScore],
  ] as [string, number, number][]) {
    const delta = after - before;
    const arrow = delta >= 0 ? chalk.green(`+${delta.toFixed(4)}`) : chalk.red(delta.toFixed(4));
    console.log(info(`${chalk.cyan(name)}: ${before.toFixed(3)} → ${chalk.bold(after.toFixed(3))} (${arrow})`));
  }
  await delay(STEP_DELAY);

  // Human Gateway demo
  console.log(separator());
  console.log(step('Human Gateway usage (fallback demonstration):'));
  const gateway = new HumanGateway(10);
  const gwResponse = gateway.fetch('https://api.coingecko.com/v3/simple/price', oracle.passport.did, 'Fallback: agent-native price endpoint unavailable for MATIC');
  console.log(warn(`Gateway used as ${chalk.bold('last resort')} — ${gwResponse.status}`));
  console.log(info(`Reason: "${gwResponse.logEntry.reason}"`));
  console.log(info(`Gateway requests this session: ${gateway.totalRequests} / ${gateway.rateLimitPerMinute} rate limit`));
  await delay(STEP_DELAY);

  // Session complete
  sessions.complete(channel.id);
  intent.status = 'completed';
  const totalMessages = sessions.getMessages(channel.id).length;
  console.log(separator());
  console.log(success(`Session ${chalk.cyan(channel.id)} ${chalk.green('COMPLETED')}`));
  console.log(info(`Total signed messages exchanged: ${totalMessages}`));

  // ─── Comparison Dashboard ─────────────────────────────────
  const totalMs = Date.now() - startTime;
  console.log(separator());
  console.log(`\n${chalk.bold.white('  Performance Comparison: AEXP Agent Web vs. Traditional CUA')}\n`);
  console.log(comparisonDashboard(847, 38));

  // ─── Failure Scenario ─────────────────────────────────────
  await delay(PHASE_DELAY);
  console.log(phase(8, 'Failure Scenario — Slashing Demo'));
  await delay(STEP_DELAY);

  console.log(step('Simulating a failed execution where DEX Executor exceeds slippage...'));
  await delay(STEP_DELAY);

  const failSettlement = createSettlement({
    intentContractId: 'intent-fail-demo',
    milestones: [
      { description: 'Execute swap with 1% max slippage', payeeDID: executor.passport.did, amountUSDC: 30 },
    ],
    slashingRules: [
      { condition: 'slippage > 1%', penalty: 15, beneficiary: 'requester' },
    ],
  });
  console.log(step(`Escrow funded: ${chalk.green('30 USDC')}`));
  await delay(STEP_DELAY);

  console.log(fail('DEX Executor reports: slippage = 2.3% (exceeds 1% limit)'));
  const slashResult = slashMilestone(failSettlement, failSettlement.milestones[0].id, 0);
  console.log(warn(`Slashing triggered: ${chalk.red(slashResult.slashed + ' USDC')} penalty applied`));
  console.log(info(`Refunded to requester: ${chalk.green(slashResult.refunded + ' USDC')}`));
  console.log(settlementSummary(failSettlement));

  const slashedReputation = updateReputation(executor.passport.reputation, {
    success: false, latencyMs: 300, costRatio: 0.5, verified: false,
  });
  console.log(warn(
    `DEX Executor reputation: ${executor.passport.reputation.compositeScore.toFixed(3)} → ${chalk.red(slashedReputation.compositeScore.toFixed(3))} ` +
    `(${chalk.red((slashedReputation.compositeScore - executor.passport.reputation.compositeScore).toFixed(4))})`
  ));
  await delay(STEP_DELAY);

  // ─── Finale ───────────────────────────────────────────────
  console.log('\n' + chalk.cyan('═'.repeat(64)));
  console.log(chalk.cyan.bold('  AEXP Protocol Prototype — Demo Complete'));
  console.log(chalk.gray('  All 6 protocol primitives demonstrated:'));
  console.log(chalk.gray('    1. Agent Passport    (Ed25519 signed identity + capabilities)'));
  console.log(chalk.gray('    2. Intent Contract   (Structured task with budget & criteria)'));
  console.log(chalk.gray('    3. Session Channel   (Signed negotiation & execution messages)'));
  console.log(chalk.gray('    4. Settlement        (Escrow, milestone release, slashing)'));
  console.log(chalk.gray('    5. Agent DNS         (Capability-based discovery & matching)'));
  console.log(chalk.gray('    6. Human Gateway     (Rate-limited legacy web fallback)'));
  console.log(chalk.cyan('═'.repeat(64)) + '\n');
}

runDemo().catch(console.error);
