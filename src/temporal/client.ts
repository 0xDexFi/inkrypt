// =============================================================================
// Inkrypt - Temporal Client
// Submits pentest pipeline workflows to Temporal server
// =============================================================================

import { Connection, Client } from '@temporalio/client';
import { pentestPipelineWorkflow } from './workflows.js';
import type { PipelineInput } from './shared.js';
import { showSplashScreen } from '../splash-screen.js';
import { startDashboard, type DashboardHandle } from '../cli/dashboard.js';
import dotenv from 'dotenv';

dotenv.config();

const TASK_QUEUE = 'inkrypt-pipeline';

function parseArgs(argv: string[]): PipelineInput {
  const args = argv.slice(2);

  if (args.length === 0) {
    console.error('No target specified.');
    console.error('');
    console.error('Use the CLI wrapper for interactive mode:');
    console.error('  ./inkrypt');
    console.error('');
    console.error('Or pass arguments directly:');
    console.error('  ./inkrypt start TARGET=<ip> [SSH_USER=<user>] [SSH_KEY=<path>]');
    process.exit(1);
  }

  const input: PipelineInput = {
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

  await showSplashScreen();

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

  // Brief pause to let the user see the splash screen before dashboard takes over
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Launch live dashboard — waits for workflow completion or Ctrl+C
  try {
    const result = await startDashboard(handle as unknown as DashboardHandle, input);

    if (result) {
      const exitCode = result.failedAgents.length > 0 ? 1 : 0;
      process.exit(exitCode);
    }
  } catch (err) {
    console.error('\n[Inkrypt] Pipeline failed:', err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Inkrypt] Fatal error:', err);
  process.exit(1);
});
