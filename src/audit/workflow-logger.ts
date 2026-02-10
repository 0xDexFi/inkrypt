// =============================================================================
// Inkrypt - Workflow Logger
// Phase-level logging and workflow completion summaries
// =============================================================================

import { appendFileSync } from 'fs';
import { join } from 'path';
import type { AgentName } from '../types/agents.js';
import type { AgentMetrics } from '../temporal/shared.js';

/**
 * Logs workflow-level events (phase transitions, completions, summaries).
 */
export class WorkflowLogger {
  private readonly logPath: string;

  constructor(sessionPath: string) {
    this.logPath = join(sessionPath, 'workflow.log');
  }

  logPhaseStart(agent: AgentName): void {
    this.write(`PHASE_START: ${agent}`);
  }

  logPhaseComplete(agent: AgentName): void {
    this.write(`PHASE_COMPLETE: ${agent}`);
  }

  logPhaseError(agent: AgentName, error: Error): void {
    this.write(`PHASE_ERROR: ${agent} - ${error.message}`);
  }

  logWorkflowComplete(metrics: AgentMetrics[]): void {
    this.write('WORKFLOW_COMPLETE');
    this.write(`  Total agents: ${metrics.length}`);
    this.write(`  Successful: ${metrics.filter((m) => m.success).length}`);
    this.write(`  Failed: ${metrics.filter((m) => !m.success).length}`);
    this.write(`  Total cost: $${metrics.reduce((s, m) => s + m.cost, 0).toFixed(2)}`);
    this.write(`  Total duration: ${Math.round(metrics.reduce((s, m) => s + m.duration, 0) / 1000)}s`);
  }

  private write(message: string): void {
    const timestamp = new Date().toISOString();
    try {
      appendFileSync(this.logPath, `[${timestamp}] ${message}\n`, 'utf-8');
    } catch {
      // Crash-safe
    }
  }
}
