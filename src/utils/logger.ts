import chalk from 'chalk';

export function banner(title: string, subtitle: string): string {
  const width = 64;
  const top = '╔' + '═'.repeat(width) + '╗';
  const bot = '╚' + '═'.repeat(width) + '╝';
  const pad = (s: string) => {
    const left = Math.floor((width - s.length) / 2);
    const right = width - s.length - left;
    return '║' + ' '.repeat(left) + s + ' '.repeat(right) + '║';
  };
  return [top, pad(title), pad(subtitle), bot].join('\n');
}

export function phase(num: number, title: string): string {
  const bar = '━'.repeat(50);
  return `\n${chalk.cyan(bar)}\n${chalk.cyan.bold(`  PHASE ${num}: ${title}`)}\n${chalk.cyan(bar)}`;
}

export function step(msg: string): string {
  return chalk.gray('  → ') + msg;
}

export function success(msg: string): string {
  return chalk.green('  ✓ ') + msg;
}

export function fail(msg: string): string {
  return chalk.red('  ✗ ') + msg;
}

export function info(msg: string): string {
  return chalk.blue('  ℹ ') + msg;
}

export function warn(msg: string): string {
  return chalk.yellow('  ⚠ ') + msg;
}

export function separator(): string {
  return chalk.gray('  ' + '─'.repeat(58));
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
