// =============================================================================
// Inkrypt - Temporal Worker
// Connects to Temporal server and processes pipeline activities
// =============================================================================

import { Worker, bundleWorkflowCode } from '@temporalio/worker';
import { allActivities } from './activities.js';
import { MAX_CONCURRENT_ACTIVITIES } from '../constants.js';
import dotenv from 'dotenv';

dotenv.config();

const TASK_QUEUE = 'inkrypt-pipeline';

async function main(): Promise<void> {
  const temporalAddress = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';

  console.log(`[Inkrypt Worker] Connecting to Temporal at ${temporalAddress}`);
  console.log(`[Inkrypt Worker] Task queue: ${TASK_QUEUE}`);
  console.log(`[Inkrypt Worker] Max concurrent activities: ${MAX_CONCURRENT_ACTIVITIES}`);

  // Bundle workflow code for Temporal's V8 isolate
  const workflowBundle = await bundleWorkflowCode({
    workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
  });

  const worker = await Worker.create({
    workflowBundle,
    activities: allActivities,
    taskQueue: TASK_QUEUE,
    maxConcurrentActivityTaskExecutions: MAX_CONCURRENT_ACTIVITIES,
    connection: {
      address: temporalAddress,
    } as any,
  });

  console.log('[Inkrypt Worker] Worker started, polling for tasks...');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Inkrypt Worker] Shutting down gracefully...');
    worker.shutdown();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await worker.run();
  console.log('[Inkrypt Worker] Worker stopped');
}

main().catch((err) => {
  console.error('[Inkrypt Worker] Fatal error:', err);
  process.exit(1);
});
