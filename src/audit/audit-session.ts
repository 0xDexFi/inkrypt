// =============================================================================
// Inkrypt - Audit Session
// Main facade coordinating logger, metrics tracker, and concurrency control
// =============================================================================

import { Logger } from './logger.js';
import { MetricsTracker } from './metrics-tracker.js';
import { WorkflowLogger } from './workflow-logger.js';
import { initSessionDirectory, generateSessionPath } from './utils.js';
import type { AgentName } from '../types/agents.js';
import type { AgentMetrics } from '../temporal/shared.js';

/**
 * Central audit session managing all logging and metrics for a pipeline run.
 */
export class AuditSession {
  private readonly logger: Logger;
  private readonly metrics: MetricsTracker;
  private readonly workflowLogger: WorkflowLogger;
  private readonly sessionPath: string;

  constructor(
    private readonly sessionId: string,
    private readonly outputDir: string,
  ) {
    this.sessionPath = generateSessionPath(outputDir);
    initSessionDirectory(this.sessionPath);

    this.logger = new Logger(this.sessionPath);
    this.metrics = new MetricsTracker(this.sessionPath, sessionId);
    this.workflowLogger = new WorkflowLogger(this.sessionPath);
  }

  /**
   * Log agent execution start.
   */
  async logAgentStart(agent: AgentName): Promise<void> {
    this.logger.info(agent, 'Agent execution started');
    this.workflowLogger.logPhaseStart(agent);
    this.metrics.recordAgentStart(agent);
  }

  /**
   * Log agent execution completion with metrics.
   */
  async logAgentComplete(agent: AgentName, metrics: AgentMetrics): Promise<void> {
    this.logger.info(agent, `Agent completed in ${Math.round(metrics.duration / 1000)}s ($${metrics.cost.toFixed(2)})`);
    this.workflowLogger.logPhaseComplete(agent);
    this.metrics.recordAgentComplete(agent, metrics);
  }

  /**
   * Log agent execution error.
   */
  async logAgentError(agent: AgentName, error: Error): Promise<void> {
    this.logger.error(agent, `Agent failed: ${error.message}`);
    this.workflowLogger.logPhaseError(agent, error);
    this.metrics.recordAgentError(agent, error);
  }

  /**
   * Get the session output path.
   */
  getSessionPath(): string {
    return this.sessionPath;
  }

  /**
   * Write final session summary.
   */
  async writeSummary(allMetrics: AgentMetrics[]): Promise<void> {
    this.metrics.writeFinalSummary(allMetrics);
    this.workflowLogger.logWorkflowComplete(allMetrics);
  }
}
