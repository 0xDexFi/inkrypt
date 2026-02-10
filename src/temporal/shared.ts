// =============================================================================
// Inkrypt - Temporal Shared Types
// Type definitions shared between workflows, activities, and clients
// =============================================================================

import type { AgentName } from '../types/agents.js';

/**
 * Input to the pentest pipeline workflow.
 */
export interface PipelineInput {
  /** Target system IP or hostname */
  target: string;
  /** SSH username for authenticated testing */
  sshUser?: string;
  /** Path to SSH private key */
  sshKeyPath?: string;
  /** SSH password */
  sshPassword?: string;
  /** SSH port (default: 22) */
  sshPort?: number;
  /** Network scope CIDR for scanning */
  scope?: string;
  /** Path to YAML configuration file */
  configPath?: string;
  /** Output directory for audit logs */
  outputDir?: string;
  /** Fast iteration mode with minimal prompts */
  pipelineTesting?: boolean;
  /** Custom workflow ID */
  workflowId?: string;
}

/**
 * Metrics collected per agent execution.
 */
export interface AgentMetrics {
  agent: AgentName;
  duration: number;       // milliseconds
  cost: number;           // USD
  inputTokens: number;
  outputTokens: number;
  turns: number;
  attempts: number;
  success: boolean;
  error?: string;
}

/**
 * Overall pipeline state maintained by the workflow.
 */
export interface PipelineState {
  sessionId: string;
  target: string;
  currentPhase: string;
  currentAgent: AgentName | null;
  completedAgents: AgentName[];
  failedAgents: AgentName[];
  skippedAgents: AgentName[];
  metrics: AgentMetrics[];
  startTime: number;
  endTime?: number;
  totalCost: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  errors: string[];
}

/**
 * Progress query response.
 */
export interface PipelineProgress {
  sessionId: string;
  target: string;
  status: PipelineState['status'];
  currentPhase: string;
  currentAgent: AgentName | null;
  completedAgents: AgentName[];
  failedAgents: AgentName[];
  elapsedMs: number;
  totalCost: number;
  agentMetrics: AgentMetrics[];
  errors: string[];
}

/**
 * Activity input for individual agent execution.
 */
export interface AgentActivityInput {
  agent: AgentName;
  target: string;
  sessionId: string;
  sshUser?: string;
  sshKeyPath?: string;
  sshPassword?: string;
  sshPort?: number;
  scope?: string;
  configPath?: string;
  outputDir: string;
  pipelineTesting: boolean;
}

/**
 * Activity result from individual agent execution.
 */
export interface AgentActivityResult {
  agent: AgentName;
  success: boolean;
  metrics: AgentMetrics;
  deliverables: string[];
  error?: string;
}
