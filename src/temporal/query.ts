// =============================================================================
// Inkrypt - Temporal Query Tool
// Inspect running workflow progress
// =============================================================================

import { Connection, Client } from '@temporalio/client';
import { getProgress } from './workflows.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  const workflowId = process.argv[2];

  if (!workflowId) {
    console.error('Usage: inkrypt query <workflow-id>');
    process.exit(1);
  }

  const temporalAddress = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
  const connection = await Connection.connect({ address: temporalAddress });
  const client = new Client({ connection });

  try {
    const handle = client.workflow.getHandle(workflowId);
    const progress = await handle.query(getProgress);

    const elapsed = Math.round(progress.elapsedMs / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    console.log('');
    console.log(chalk.cyan.bold('  Inkrypt Pipeline Progress'));
    console.log(chalk.gray('  ========================'));
    console.log('');
    console.log(`  ${chalk.bold('Session:')}    ${progress.sessionId}`);
    console.log(`  ${chalk.bold('Target:')}     ${progress.target}`);
    console.log(`  ${chalk.bold('Status:')}     ${formatStatus(progress.status)}`);
    console.log(`  ${chalk.bold('Phase:')}      ${progress.currentPhase}`);
    console.log(`  ${chalk.bold('Agent:')}      ${progress.currentAgent ?? 'none'}`);
    console.log(`  ${chalk.bold('Elapsed:')}    ${minutes}m ${seconds}s`);
    console.log(`  ${chalk.bold('Cost:')}       $${progress.totalCost.toFixed(2)}`);
    console.log('');

    // Completed agents
    if (progress.completedAgents.length > 0) {
      console.log(chalk.green.bold('  Completed Agents:'));
      progress.completedAgents.forEach((a) => {
        const metric = progress.agentMetrics.find((m) => m.agent === a);
        const duration = metric ? `${Math.round(metric.duration / 1000)}s` : '?';
        const cost = metric ? `$${metric.cost.toFixed(2)}` : '?';
        console.log(`    ${chalk.green('+')} ${a} (${duration}, ${cost})`);
      });
      console.log('');
    }

    // Failed agents
    if (progress.failedAgents.length > 0) {
      console.log(chalk.red.bold('  Failed Agents:'));
      progress.failedAgents.forEach((a) => {
        console.log(`    ${chalk.red('x')} ${a}`);
      });
      console.log('');
    }

    // Errors
    if (progress.errors.length > 0) {
      console.log(chalk.red.bold('  Errors:'));
      progress.errors.forEach((e) => {
        console.log(`    ${chalk.red('-')} ${e}`);
      });
      console.log('');
    }
  } catch (err) {
    console.error(`Failed to query workflow ${workflowId}:`, err);
    process.exit(1);
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'running': return chalk.yellow(status);
    case 'completed': return chalk.green(status);
    case 'failed': return chalk.red(status);
    case 'cancelled': return chalk.gray(status);
    default: return status;
  }
}

main().catch((err) => {
  console.error('[Inkrypt Query] Fatal error:', err);
  process.exit(1);
});
