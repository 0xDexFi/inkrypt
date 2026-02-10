// =============================================================================
// Inkrypt - Temporal Activities
// Each activity wraps an agent execution with heartbeats, error handling, and metrics
// =============================================================================

import { heartbeat } from '@temporalio/activity';
import { executeAgent } from '../ai/claude-executor.js';
import { AuditSession } from '../audit/audit-session.js';
import { validateDeliverables } from '../queue-validation.js';
import { GitManager } from '../utils/git-manager.js';
import { classifyError } from '../error-handling.js';
import { HEARTBEAT_INTERVAL_MS, MAX_ERROR_LENGTH } from '../constants.js';
import type { AgentActivityInput, AgentActivityResult, AgentMetrics } from './shared.js';
import type { AgentName } from '../types/agents.js';

/**
 * Core agent execution activity.
 * Wraps Claude Agent SDK execution with:
 * - Heartbeat loop (2s interval)
 * - Git checkpoint/rollback
 * - Output validation
 * - Metrics collection
 * - Error classification
 */
async function executeAgentActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  const { agent, target, sessionId, outputDir } = input;
  const startTime = Date.now();
  const audit = new AuditSession(sessionId, outputDir);
  const git = new GitManager(outputDir);

  // Start heartbeat loop
  const heartbeatHandle = setInterval(() => {
    heartbeat({ agent, elapsed: Date.now() - startTime });
  }, HEARTBEAT_INTERVAL_MS);

  try {
    await audit.logAgentStart(agent);

    // Create git checkpoint before execution
    await git.createCheckpoint(agent);

    // Execute the AI agent
    const result = await executeAgent({
      agent,
      target,
      sessionId,
      sshUser: input.sshUser,
      sshKeyPath: input.sshKeyPath,
      sshPassword: input.sshPassword,
      sshPort: input.sshPort,
      scope: input.scope,
      configPath: input.configPath,
      outputDir,
      pipelineTesting: input.pipelineTesting,
    });

    // Validate deliverables
    const deliverables = await validateDeliverables(agent, outputDir);

    // Commit git checkpoint on success
    await git.commitCheckpoint(agent);

    const metrics: AgentMetrics = {
      agent,
      duration: Date.now() - startTime,
      cost: result.cost,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      turns: result.turns,
      attempts: 1,
      success: true,
    };

    await audit.logAgentComplete(agent, metrics);

    return {
      agent,
      success: true,
      metrics,
      deliverables,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const classified = classifyError(error);

    // Rollback git on failure
    await git.rollbackCheckpoint(agent).catch(() => {});

    const metrics: AgentMetrics = {
      agent,
      duration: Date.now() - startTime,
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      turns: 0,
      attempts: 1,
      success: false,
      error: error.message.slice(0, MAX_ERROR_LENGTH),
    };

    await audit.logAgentError(agent, error);

    // Rethrow with classification for Temporal retry logic
    if (classified.retryable) {
      throw error;
    }

    return {
      agent,
      success: false,
      metrics,
      deliverables: [],
      error: error.message.slice(0, MAX_ERROR_LENGTH),
    };
  } finally {
    clearInterval(heartbeatHandle);
  }
}

// =============================================================================
// Named activity exports for each agent
// Each agent gets its own activity function for Temporal registration
// =============================================================================

export async function preReconActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'pre-recon' });
}

export async function reconActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'recon' });
}

export async function sshVulnActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'ssh-vuln' });
}

export async function privescVulnActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'privesc-vuln' });
}

export async function networkVulnActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'network-vuln' });
}

export async function misconfigVulnActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'misconfig-vuln' });
}

export async function credentialVulnActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'credential-vuln' });
}

export async function sshExploitActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'ssh-exploit' });
}

export async function privescExploitActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'privesc-exploit' });
}

export async function networkExploitActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'network-exploit' });
}

export async function misconfigExploitActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'misconfig-exploit' });
}

export async function credentialExploitActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'credential-exploit' });
}

export async function reportActivity(input: AgentActivityInput): Promise<AgentActivityResult> {
  return executeAgentActivity({ ...input, agent: 'report' });
}

/**
 * Pre-reconnaissance external tool scanning activity.
 * Runs nmap, ssh-audit, nuclei, subfinder before AI agents.
 */
export async function preReconToolScanActivity(input: {
  target: string;
  scope?: string;
  outputDir: string;
  sshPort?: number;
}): Promise<{
  nmapResults: string;
  sshAuditResults: string;
  nucleiResults: string;
  subfinderResults: string;
  masscanResults: string;
  testsslResults: string;
  lynisResults: string;
  searchsploitResults: string;
}> {
  const { runPreReconTools } = await import('../phases/pre-recon.js');

  const heartbeatHandle = setInterval(() => {
    heartbeat({ phase: 'pre-recon-tools' });
  }, HEARTBEAT_INTERVAL_MS);

  try {
    return await runPreReconTools(input.target, input.outputDir, input.scope, input.sshPort);
  } finally {
    clearInterval(heartbeatHandle);
  }
}

/**
 * Report assembly activity.
 * Assembles final pentest report from all agent outputs.
 */
export async function assembleReportActivity(input: {
  sessionId: string;
  target: string;
  outputDir: string;
  metrics: AgentMetrics[];
}): Promise<{ reportPath: string }> {
  const { assembleReport } = await import('../phases/reporting.js');

  const heartbeatHandle = setInterval(() => {
    heartbeat({ phase: 'report-assembly' });
  }, HEARTBEAT_INTERVAL_MS);

  try {
    const reportPath = await assembleReport(
      input.sessionId,
      input.target,
      input.outputDir,
      input.metrics,
    );
    return { reportPath };
  } finally {
    clearInterval(heartbeatHandle);
  }
}

/**
 * All activities exported for Temporal worker registration.
 */
export const allActivities = {
  preReconActivity,
  reconActivity,
  sshVulnActivity,
  privescVulnActivity,
  networkVulnActivity,
  misconfigVulnActivity,
  credentialVulnActivity,
  sshExploitActivity,
  privescExploitActivity,
  networkExploitActivity,
  misconfigExploitActivity,
  credentialExploitActivity,
  reportActivity,
  preReconToolScanActivity,
  assembleReportActivity,
};
