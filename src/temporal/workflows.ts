// =============================================================================
// Inkrypt - Temporal Workflows
// Main pentest pipeline workflow with 5-phase orchestration
// =============================================================================

import {
  proxyActivities,
  defineQuery,
  setHandler,
  sleep,
  ApplicationFailure,
} from '@temporalio/workflow';

import type { PipelineInput, PipelineState, PipelineProgress, AgentActivityInput, AgentActivityResult, AgentMetrics, AgentEvent } from './shared.js';
import type { AgentName } from '../types/agents.js';

// Proxy activities with appropriate timeouts
const activities = proxyActivities<typeof import('./activities.js')>({
  startToCloseTimeout: '45m',
  heartbeatTimeout: '30s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '10s',
    maximumInterval: '2m',
    backoffCoefficient: 2,
    nonRetryableErrorTypes: [
      'auth_error',
      'config_error',
      'permission_denied',
      'tool_not_found',
    ],
  },
});

// Query handler for progress inspection
export const getProgress = defineQuery<PipelineProgress>('getProgress');

/**
 * Main pentest pipeline workflow.
 *
 * Executes a 5-phase system penetration test:
 * 1. Pre-Reconnaissance - External tool scans (nmap, ssh-audit, nuclei)
 * 2. Reconnaissance - Attack surface mapping & technology detection
 * 3. Vulnerability Analysis - 5 parallel agents analyze different domains
 * 4. Exploitation - 5 parallel agents exploit findings (pipelined with phase 3)
 * 5. Reporting - Executive summary with reproducible proof-of-concepts
 */
export async function pentestPipelineWorkflow(input: PipelineInput): Promise<PipelineState> {
  const sessionId = input.workflowId ?? `inkrypt-${Date.now().toString(36)}`;
  const outputDir = input.outputDir ?? `./audit-logs/${input.target}_${sessionId}`;

  // Initialize pipeline state
  const state: PipelineState = {
    sessionId,
    target: input.target,
    currentPhase: 'Initializing',
    currentAgent: null,
    activeAgents: [],
    completedAgents: [],
    failedAgents: [],
    skippedAgents: [],
    agentEvents: [],
    metrics: [],
    startTime: Date.now(),
    totalCost: 0,
    status: 'running',
    errors: [],
  };

  // Register progress query handler
  setHandler(getProgress, (): PipelineProgress => ({
    sessionId: state.sessionId,
    target: state.target,
    status: state.status,
    currentPhase: state.currentPhase,
    currentAgent: state.currentAgent,
    activeAgents: [...state.activeAgents],
    completedAgents: [...state.completedAgents],
    failedAgents: [...state.failedAgents],
    skippedAgents: [...state.skippedAgents],
    agentEvents: [...state.agentEvents],
    elapsedMs: Date.now() - state.startTime,
    totalCost: state.totalCost,
    agentMetrics: [...state.metrics],
    errors: [...state.errors],
  }));

  // Build common activity input
  const baseInput: Omit<AgentActivityInput, 'agent'> = {
    target: input.target,
    sessionId,
    sshUser: input.sshUser,
    sshKeyPath: input.sshKeyPath,
    sshPassword: input.sshPassword,
    sshPort: input.sshPort,
    scope: input.scope,
    configPath: input.configPath,
    outputDir,
    pipelineTesting: input.pipelineTesting ?? false,
  };

  try {
    // =========================================================================
    // Phase 1: Pre-Reconnaissance (External Tool Scans)
    // =========================================================================
    state.currentPhase = 'Pre-Reconnaissance';
    state.currentAgent = 'pre-recon';
    pushEvent(state, 'pre-recon', 'started');

    // Run external tool scans first
    const toolResults = await activities.preReconToolScanActivity({
      target: input.target,
      scope: input.scope,
      outputDir,
      sshPort: input.sshPort,
    });

    // Then run AI pre-recon agent
    const preReconResult = await activities.preReconActivity({
      ...baseInput,
      agent: 'pre-recon',
    });
    recordResult(state, preReconResult);
    pushCompletionEvent(state, preReconResult);

    // =========================================================================
    // Phase 2: Reconnaissance
    // =========================================================================
    state.currentPhase = 'Reconnaissance';
    state.currentAgent = 'recon';
    pushEvent(state, 'recon', 'started');

    const reconResult = await activities.reconActivity({
      ...baseInput,
      agent: 'recon',
    });
    recordResult(state, reconResult);
    pushCompletionEvent(state, reconResult);

    // =========================================================================
    // Phase 3 & 4: Vulnerability Analysis + Exploitation (Pipelined)
    // =========================================================================
    state.currentPhase = 'Vulnerability Analysis & Exploitation';

    // Pipelined execution: each exploit starts as soon as its vuln analysis finishes
    const pipelinedPromises = [
      runVulnExploitPipeline('ssh', state, baseInput),
      runVulnExploitPipeline('privesc', state, baseInput),
      runVulnExploitPipeline('network', state, baseInput),
      runVulnExploitPipeline('misconfig', state, baseInput),
      runVulnExploitPipeline('credential', state, baseInput),
      runVulnExploitPipeline('rdp', state, baseInput),
      runVulnExploitPipeline('vnc', state, baseInput),
    ];

    const pipelinedResults = await Promise.allSettled(pipelinedPromises);

    // Record any pipeline failures
    for (const result of pipelinedResults) {
      if (result.status === 'rejected') {
        state.errors.push(`Pipeline error: ${result.reason}`);
      }
    }

    // =========================================================================
    // Phase 5: Reporting
    // =========================================================================
    state.currentPhase = 'Reporting';
    state.currentAgent = 'report';
    pushEvent(state, 'report', 'started');

    const reportResult = await activities.reportActivity({
      ...baseInput,
      agent: 'report',
    });
    recordResult(state, reportResult);
    pushCompletionEvent(state, reportResult);

    // Assemble final report
    await activities.assembleReportActivity({
      sessionId,
      target: input.target,
      outputDir,
      metrics: state.metrics,
    });

    // =========================================================================
    // Complete
    // =========================================================================
    state.status = state.failedAgents.length > 0 ? 'completed' : 'completed';
    state.endTime = Date.now();
    state.currentPhase = 'Complete';
    state.currentAgent = null;

    return state;
  } catch (err) {
    state.status = 'failed';
    state.endTime = Date.now();
    state.errors.push(err instanceof Error ? err.message : String(err));
    throw ApplicationFailure.nonRetryable(
      `Pipeline failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Run a vulnerability analysis → exploitation pipeline for a single domain.
 * The exploit agent starts immediately after its vuln agent finishes.
 */
async function runVulnExploitPipeline(
  domain: string,
  state: PipelineState,
  baseInput: Omit<AgentActivityInput, 'agent'>,
): Promise<void> {
  const vulnAgent = `${domain}-vuln` as AgentName;
  const exploitAgent = `${domain}-exploit` as AgentName;

  // Run vulnerability analysis
  state.currentAgent = vulnAgent;
  pushEvent(state, vulnAgent, 'started');
  const vulnActivityFn = getActivityFunction(vulnAgent);
  const vulnResult = await vulnActivityFn({
    ...baseInput,
    agent: vulnAgent,
  });
  recordResult(state, vulnResult);
  pushCompletionEvent(state, vulnResult);

  // Skip exploitation if vuln analysis failed or found nothing
  if (!vulnResult.success || vulnResult.deliverables.length === 0) {
    state.skippedAgents.push(exploitAgent);
    pushEvent(state, exploitAgent, 'skipped');
    return;
  }

  // Run exploitation
  state.currentAgent = exploitAgent;
  pushEvent(state, exploitAgent, 'started');
  const exploitActivityFn = getActivityFunction(exploitAgent);
  const exploitResult = await exploitActivityFn({
    ...baseInput,
    agent: exploitAgent,
  });
  recordResult(state, exploitResult);
  pushCompletionEvent(state, exploitResult);
}

/**
 * Get the correct activity function for an agent.
 */
function getActivityFunction(agent: AgentName) {
  const mapping: Record<AgentName, (input: AgentActivityInput) => Promise<AgentActivityResult>> = {
    'pre-recon': activities.preReconActivity,
    'recon': activities.reconActivity,
    'ssh-vuln': activities.sshVulnActivity,
    'privesc-vuln': activities.privescVulnActivity,
    'network-vuln': activities.networkVulnActivity,
    'misconfig-vuln': activities.misconfigVulnActivity,
    'credential-vuln': activities.credentialVulnActivity,
    'ssh-exploit': activities.sshExploitActivity,
    'privesc-exploit': activities.privescExploitActivity,
    'network-exploit': activities.networkExploitActivity,
    'misconfig-exploit': activities.misconfigExploitActivity,
    'credential-exploit': activities.credentialExploitActivity,
    'rdp-vuln': activities.rdpVulnActivity,
    'rdp-exploit': activities.rdpExploitActivity,
    'vnc-vuln': activities.vncVulnActivity,
    'vnc-exploit': activities.vncExploitActivity,
    'report': activities.reportActivity,
  };
  return mapping[agent]!;
}

/**
 * Record an agent result into pipeline state.
 */
function recordResult(state: PipelineState, result: AgentActivityResult): void {
  state.metrics.push(result.metrics);
  state.totalCost += result.metrics.cost;

  if (result.success) {
    state.completedAgents.push(result.agent);
  } else {
    state.failedAgents.push(result.agent);
    if (result.error) {
      state.errors.push(`[${result.agent}] ${result.error}`);
    }
  }
}

/**
 * Push an agent lifecycle event and update activeAgents tracking.
 */
function pushEvent(state: PipelineState, agent: AgentName, event: AgentEvent['event']): void {
  const agentEvent: AgentEvent = { agent, event, timestamp: Date.now() };
  state.agentEvents.push(agentEvent);

  if (event === 'started') {
    state.activeAgents.push(agent);
  } else {
    state.activeAgents = state.activeAgents.filter((a) => a !== agent);
  }
}

/**
 * Push a completed or failed event based on an activity result.
 */
function pushCompletionEvent(state: PipelineState, result: AgentActivityResult): void {
  const event: AgentEvent['event'] = result.success ? 'completed' : 'failed';
  const agentEvent: AgentEvent = {
    agent: result.agent,
    event,
    timestamp: Date.now(),
    duration: result.metrics.duration,
    cost: result.metrics.cost,
  };
  state.agentEvents.push(agentEvent);
  state.activeAgents = state.activeAgents.filter((a) => a !== result.agent);
}
