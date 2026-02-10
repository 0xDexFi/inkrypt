// =============================================================================
// Inkrypt - Output Formatters
// Formats agent output for terminal display
// =============================================================================

import chalk from 'chalk';
import type { AgentName } from '../types/agents.js';

/**
 * Check if running inside Docker container.
 */
export function isDockerEnvironment(): boolean {
  try {
    const { existsSync } = require('fs');
    return existsSync('/.dockerenv') || existsSync('/run/.containerenv');
  } catch {
    return false;
  }
}

/**
 * Format and display agent execution status.
 */
export function formatAgentOutput(
  agent: AgentName,
  status: 'started' | 'completed' | 'failed',
  duration?: number,
  cost?: number,
): void {
  const timestamp = new Date().toISOString().slice(11, 19);

  switch (status) {
    case 'started':
      console.log(
        `${chalk.gray(timestamp)} ${chalk.blue('START')} ${chalk.bold(agent)}`,
      );
      break;

    case 'completed': {
      const durationStr = duration ? formatDuration(duration) : '?';
      const costStr = cost ? `$${cost.toFixed(2)}` : '?';
      console.log(
        `${chalk.gray(timestamp)} ${chalk.green('DONE')}  ${chalk.bold(agent)} ` +
        `${chalk.dim(`(${durationStr}, ${costStr})`)}`,
      );
      break;
    }

    case 'failed':
      console.log(
        `${chalk.gray(timestamp)} ${chalk.red('FAIL')}  ${chalk.bold(agent)}`,
      );
      break;
  }
}

/**
 * Format milliseconds into human-readable duration.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m${seconds}s`;
}

/**
 * Format a phase header for terminal output.
 */
export function formatPhaseHeader(phase: string): void {
  console.log('');
  console.log(chalk.cyan.bold(`  Phase: ${phase}`));
  console.log(chalk.cyan('  ' + '='.repeat(phase.length + 7)));
  console.log('');
}

/**
 * Format a pipeline summary.
 */
export function formatPipelineSummary(
  completed: number,
  failed: number,
  totalCost: number,
  totalDuration: number,
): void {
  console.log('');
  console.log(chalk.bold('  Pipeline Summary'));
  console.log(chalk.gray('  ================'));
  console.log(`  Completed: ${chalk.green(completed.toString())}`);
  console.log(`  Failed:    ${chalk.red(failed.toString())}`);
  console.log(`  Cost:      ${chalk.yellow('$' + totalCost.toFixed(2))}`);
  console.log(`  Duration:  ${chalk.blue(formatDuration(totalDuration))}`);
  console.log('');
}
