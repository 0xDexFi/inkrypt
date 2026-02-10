// =============================================================================
// Inkrypt - Message Handlers
// Handles streaming messages from AI agent execution
// =============================================================================

import chalk from 'chalk';
import type { AgentName } from '../types/agents.js';
import type { AgentMessage } from './types.js';

/**
 * Agent color mapping for terminal output.
 */
const AGENT_COLORS: Record<string, (text: string) => string> = {
  'pre-recon': chalk.blue,
  'recon': chalk.cyan,
  'ssh': chalk.red,
  'privesc': chalk.magenta,
  'network': chalk.yellow,
  'misconfig': chalk.green,
  'credential': chalk.hex('#FF8C00'),
  'report': chalk.white,
};

/**
 * Get the color function for an agent.
 */
function getAgentColor(agent: AgentName): (text: string) => string {
  for (const [key, color] of Object.entries(AGENT_COLORS)) {
    if (agent.includes(key)) return color;
  }
  return chalk.white;
}

/**
 * Handle a streaming text message from an agent.
 */
export function handleTextMessage(agent: AgentName, content: string): void {
  const color = getAgentColor(agent);
  const prefix = color(`[${agent}]`);

  // Truncate very long messages for terminal display
  const maxLen = 500;
  const display = content.length > maxLen
    ? content.slice(0, maxLen) + '...'
    : content;

  for (const line of display.split('\n')) {
    if (line.trim()) {
      console.log(`${prefix} ${line}`);
    }
  }
}

/**
 * Handle a tool use message from an agent.
 */
export function handleToolUseMessage(
  agent: AgentName,
  tool: string,
  input: Record<string, unknown>,
): void {
  const color = getAgentColor(agent);
  const prefix = color(`[${agent}]`);

  // Format tool call for display
  const inputPreview = formatToolInput(tool, input);
  console.log(`${prefix} ${chalk.dim('TOOL:')} ${chalk.bold(tool)} ${inputPreview}`);
}

/**
 * Handle a tool result message.
 */
export function handleToolResultMessage(
  agent: AgentName,
  tool: string,
  output: string,
  isError: boolean,
): void {
  const color = getAgentColor(agent);
  const prefix = color(`[${agent}]`);

  if (isError) {
    console.log(`${prefix} ${chalk.red('TOOL ERROR:')} ${tool}: ${output.slice(0, 200)}`);
  }
}

/**
 * Format tool input for display, hiding sensitive data.
 */
function formatToolInput(tool: string, input: Record<string, unknown>): string {
  // Redact sensitive fields
  const redacted = { ...input };
  const sensitiveKeys = ['password', 'pass', 'secret', 'key', 'token', 'credential'];

  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      redacted[key] = '***REDACTED***';
    }
  }

  // For bash commands, show the command itself
  if (tool === 'bash' && typeof redacted['command'] === 'string') {
    const cmd = redacted['command'] as string;
    return chalk.dim(cmd.length > 100 ? cmd.slice(0, 100) + '...' : cmd);
  }

  const json = JSON.stringify(redacted);
  return chalk.dim(json.length > 150 ? json.slice(0, 150) + '...' : json);
}

/**
 * Build a structured agent message.
 */
export function buildAgentMessage(
  type: AgentMessage['type'],
  agent: AgentName,
  content: string,
  metadata?: Record<string, unknown>,
): AgentMessage {
  return {
    type,
    content,
    agent,
    timestamp: new Date().toISOString(),
    metadata,
  };
}
