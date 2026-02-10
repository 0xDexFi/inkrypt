// =============================================================================
// Inkrypt - Temporal Client
// Submits pentest pipeline workflows to Temporal server
// =============================================================================

import { Connection, Client } from '@temporalio/client';
import { pentestPipelineWorkflow, getProgress } from './workflows.js';
import type { PipelineInput } from './shared.js';
import { showSplashScreen } from '../splash-screen.js';
import dotenv from 'dotenv';

dotenv.config();

const TASK_QUEUE = 'inkrypt-pipeline';

function parseArgs(argv: string[]): PipelineInput & { wait?: boolean } {
  const args = argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: inkrypt <target> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --ssh-user <user>       SSH username');
    console.error('  --ssh-key <path>        SSH private key path');
    console.error('  --ssh-pass <password>   SSH password');
    console.error('  --ssh-port <port>       SSH port (default: 22)');
    console.error('  --scope <cidr>          Network scope CIDR');
    console.error('  --config <path>         YAML config file');
    console.error('  --output <path>         Output directory');
    console.error('  --workflow-id <id>      Custom workflow ID');
    console.error('  --pipeline-testing      Fast iteration mode');
    console.error('  --wait                  Wait and poll for completion');
    process.exit(1);
  }

  const input: PipelineInput & { wait?: boolean } = {
    target: args[0]!,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--ssh-user':
        input.sshUser = next;
        i++;
        break;
      case '--ssh-key':
        input.sshKeyPath = next;
        i++;
        break;
      case '--ssh-pass':
        input.sshPassword = next;
        i++;
        break;
      case '--ssh-port':
        input.sshPort = parseInt(next ?? '22', 10);
        i++;
        break;
      case '--scope':
        input.scope = next;
        i++;
        break;
      case '--config':
        input.configPath = next;
        i++;
        break;
      case '--output':
        input.outputDir = next;
        i++;
        break;
      case '--workflow-id':
        input.workflowId = next;
        i++;
        break;
      case '--pipeline-testing':
        input.pipelineTesting = true;
        break;
      case '--wait':
        input.wait = true;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return input;
}

async function main(): Promise<void> {
  const input = parseArgs(process.argv);
  const temporalAddress = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';

  showSplashScreen();

  console.log(`\n[Inkrypt] Target: ${input.target}`);
  if (input.sshUser) console.log(`[Inkrypt] SSH User: ${input.sshUser}`);
  if (input.sshPort) console.log(`[Inkrypt] SSH Port: ${input.sshPort}`);
  if (input.scope) console.log(`[Inkrypt] Scope: ${input.scope}`);
  if (input.configPath) console.log(`[Inkrypt] Config: ${input.configPath}`);
  console.log('');

  // Connect to Temporal
  const connection = await Connection.connect({ address: temporalAddress });
  const client = new Client({ connection });

  const workflowId = input.workflowId ?? `inkrypt-${input.target}-${Date.now().toString(36)}`;

  console.log(`[Inkrypt] Submitting workflow: ${workflowId}`);
  console.log(`[Inkrypt] Task queue: ${TASK_QUEUE}`);
  console.log('');

  // Start the workflow
  const handle = await client.workflow.start(pentestPipelineWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [{ ...input, workflowId }],
    workflowExecutionTimeout: '4h',
  });

  console.log(`[Inkrypt] Workflow started: ${workflowId}`);
  console.log(`[Inkrypt] Query progress: ./inkrypt query ID=${workflowId}`);
  console.log(`[Inkrypt] View logs: ./inkrypt logs ID=${workflowId}`);

  // Optionally wait for completion
  if (input.wait) {
    console.log('\n[Inkrypt] Waiting for completion...\n');

    const pollInterval = setInterval(async () => {
      try {
        const progress = await handle.query(getProgress);
        const elapsed = Math.round(progress.elapsedMs / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;

        console.log(
          `[${minutes}m${seconds}s] Phase: ${progress.currentPhase} | ` +
          `Agent: ${progress.currentAgent ?? 'none'} | ` +
          `Completed: ${progress.completedAgents.length}/13 | ` +
          `Cost: $${progress.totalCost.toFixed(2)}`,
        );
      } catch {
        // Query may fail during transitions
      }
    }, 15000);

    try {
      const result = await handle.result();
      clearInterval(pollInterval);

      console.log('\n[Inkrypt] Pipeline completed!');
      console.log(`[Inkrypt] Status: ${result.status}`);
      console.log(`[Inkrypt] Completed agents: ${result.completedAgents.length}`);
      console.log(`[Inkrypt] Failed agents: ${result.failedAgents.length}`);
      console.log(`[Inkrypt] Total cost: $${result.totalCost.toFixed(2)}`);
      console.log(`[Inkrypt] Duration: ${Math.round((result.endTime! - result.startTime) / 60000)}m`);

      if (result.errors.length > 0) {
        console.log('\n[Inkrypt] Errors:');
        result.errors.forEach((e) => console.log(`  - ${e}`));
      }
    } catch (err) {
      clearInterval(pollInterval);
      console.error('\n[Inkrypt] Pipeline failed:', err);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error('[Inkrypt] Fatal error:', err);
  process.exit(1);
});
