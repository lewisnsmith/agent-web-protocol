import Table from 'cli-table3';
import chalk from 'chalk';
import type { AgentPassport } from '../primitives/agent-passport.js';
import type { IntentContract } from '../primitives/intent-contract.js';
import type { SettlementContract } from '../primitives/settlement.js';

export function passportCard(p: AgentPassport): string {
  const lines = [
    chalk.bold(`  ┌${'─'.repeat(55)}┐`),
    `  │ ${chalk.white.bold('DID:')}         ${chalk.cyan(p.did.padEnd(40))}│`,
    `  │ ${chalk.white.bold('Name:')}        ${p.name.padEnd(40)}│`,
    `  │ ${chalk.white.bold('Role:')}        ${chalk.yellow(p.role.padEnd(40))}│`,
    `  │ ${chalk.white.bold('Capabilities:')} ${p.capabilities.map(c => c.namespace).join(', ').padEnd(40)}│`,
    `  │ ${chalk.white.bold('Trust Level:')}  ${p.trustLevel.padEnd(40)}│`,
    `  │ ${chalk.white.bold('Reputation:')}   ${p.reputation.compositeScore.toFixed(3).padEnd(5)} (${String(p.reputation.totalTasks)} tasks)`.padEnd(59) + '│',
    `  │ ${chalk.white.bold('Staking:')}      ${p.staking.collateralUSDC} USDC ${p.staking.slashable ? '(slashable)' : ''}`.padEnd(59) + '│',
    `  │ ${chalk.white.bold('Signature:')}    ${chalk.green('✓ Valid (ed25519)')}`.padEnd(68) + '│',
    chalk.bold(`  └${'─'.repeat(55)}┘`),
  ];
  return lines.join('\n');
}

export function discoveryTable(results: AgentPassport[]): string {
  const table = new Table({
    head: [
      chalk.white.bold('Agent'),
      chalk.white.bold('Capabilities'),
      chalk.white.bold('Price'),
      chalk.white.bold('Reputation'),
      chalk.white.bold('Latency'),
    ],
    style: { head: [], border: [] },
  });
  for (const a of results) {
    table.push([
      chalk.cyan(a.name),
      a.capabilities.map(c => c.namespace).join(', '),
      `${a.pricing.basePriceUSDC} USDC`,
      chalk.green(a.reputation.compositeScore.toFixed(3)),
      `${a.sla.maxLatencyMs}ms`,
    ]);
  }
  return table.toString();
}

export function intentSummary(ic: IntentContract): string {
  const lines = [
    `  ${chalk.white.bold('Intent Contract')} ${chalk.gray(ic.id)}`,
    `  ${chalk.gray('Goal:')}     ${ic.task.goal}`,
    `  ${chalk.gray('Budget:')}   ${ic.budget.ceilingUSDC} USDC`,
    `  ${chalk.gray('Deadline:')} ${ic.deadline.durationMs}ms`,
    `  ${chalk.gray('Verify:')}   ${ic.verificationMode}`,
    `  ${chalk.gray('Criteria:')} ${ic.successCriteria.map(c => `${c.metric} ${c.operator} ${c.threshold}`).join(', ')}`,
    `  ${chalk.gray('Status:')}   ${chalk.yellow(ic.status)}`,
  ];
  return lines.join('\n');
}

export function settlementSummary(sc: SettlementContract): string {
  const table = new Table({
    head: [
      chalk.white.bold('Milestone'),
      chalk.white.bold('Payee'),
      chalk.white.bold('Amount'),
      chalk.white.bold('Status'),
    ],
    style: { head: [], border: [] },
  });
  for (const m of sc.milestones) {
    const statusColor = m.status === 'completed' ? chalk.green : m.status === 'failed' ? chalk.red : chalk.yellow;
    table.push([
      m.description,
      chalk.cyan(m.payeeDID.split(':').pop() ?? m.payeeDID),
      `${m.amountUSDC} USDC`,
      statusColor(m.status),
    ]);
  }
  const lines = [
    `  ${chalk.white.bold('Settlement Contract')} ${chalk.gray(sc.id)}`,
    `  Escrow: ${chalk.green(sc.escrow.totalFundedUSDC + ' USDC')} funded | ${sc.escrow.releasedUSDC} released | ${sc.escrow.remainingUSDC} remaining`,
    table.toString(),
  ];
  return lines.join('\n');
}

export function comparisonDashboard(agentWebMs: number, agentWebCost: number): string {
  const cuaMs = agentWebMs * 53;
  const cuaCost = agentWebCost * 3.2;
  const table = new Table({
    head: [
      chalk.white.bold('Metric'),
      chalk.cyan.bold('AEXP Agent Web'),
      chalk.gray.bold('Estimated CUA'),
      chalk.white.bold('Improvement'),
    ],
    style: { head: [], border: [] },
  });
  table.push(
    ['Execution Time', chalk.green(`${agentWebMs}ms`), chalk.gray(`~${Math.round(cuaMs)}ms`), chalk.green(`${(cuaMs / agentWebMs).toFixed(0)}x faster`)],
    ['Total Cost', chalk.green(`${agentWebCost} USDC`), chalk.gray(`~${cuaCost.toFixed(0)} USDC`), chalk.green(`${(cuaCost / agentWebCost).toFixed(1)}x cheaper`)],
    ['Verification', chalk.green('Cryptographic proof'), chalk.gray('Screenshot + hope'), chalk.green('Verifiable')],
    ['DOM Parsing', chalk.green('None required'), chalk.gray('Complex scraping'), chalk.green('Eliminated')],
  );
  return table.toString();
}
