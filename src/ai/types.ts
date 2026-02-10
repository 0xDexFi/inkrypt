// =============================================================================
// Inkrypt - AI Execution Types
// =============================================================================

import type { AgentName } from '../types/agents.js';

/**
 * Input for the Claude Agent SDK execution.
 */
export interface AgentExecutionInput {
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
 * Result from Claude Agent SDK execution.
 */
export interface AgentExecutionResult {
  agent: AgentName;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  turns: number;
  duration: number;
  toolCalls: ToolCallRecord[];
}

/**
 * Record of a tool call made by the AI agent.
 */
export interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  error?: string;
  duration: number;
  timestamp: string;
}

/**
 * Streaming message from the AI agent.
 */
export interface AgentMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'error';
  content: string;
  agent: AgentName;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * MCP server configuration for system testing tools.
 */
export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}
