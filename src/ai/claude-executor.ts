// =============================================================================
// Inkrypt - Claude Agent SDK Executor
// Core execution engine for AI agents with system testing capabilities
// =============================================================================

import { loadPromptTemplate } from '../prompts/prompt-manager.js';
import { loadConfig } from '../config-parser.js';
import { AuditLogger } from './audit-logger.js';
import { formatAgentOutput, isDockerEnvironment } from './output-formatters.js';
import { GitManager } from '../utils/git-manager.js';
import { Timer } from '../utils/metrics.js';
import { getPromptNameForAgent, getTerminalForAgent } from '../types/agents.js';
import type { AgentExecutionInput, AgentExecutionResult, ToolCallRecord } from './types.js';

/**
 * Execute an AI agent using the Claude Agent SDK.
 *
 * Each agent:
 * 1. Loads its specialized prompt template
 * 2. Renders variables (target, SSH credentials, config context)
 * 3. Sets up MCP servers for system tools
 * 4. Executes via Claude Agent SDK
 * 5. Tracks tool calls, cost, and metrics
 */
export async function executeAgent(input: AgentExecutionInput): Promise<AgentExecutionResult> {
  const timer = new Timer();
  const logger = new AuditLogger(input.sessionId, input.outputDir, input.agent);
  const toolCalls: ToolCallRecord[] = [];

  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let turns = 0;

  try {
    // Load prompt template
    const promptName = getPromptNameForAgent(input.agent);
    const prompt = await loadPromptTemplate(promptName, {
      target: input.target,
      sshUser: input.sshUser,
      sshPort: input.sshPort?.toString(),
      sshKeyPath: input.sshKeyPath,
      scope: input.scope,
      outputDir: input.outputDir,
      configContext: input.configPath ? await getConfigContext(input.configPath) : '',
      sshInstructions: buildSSHInstructions(input),
      terminalAgent: getTerminalForAgent(input.agent) ?? undefined,
    });

    await logger.logPrompt(prompt);

    // Determine MCP servers for this agent
    const mcpServers = buildMCPServers(input);

    // Execute via Claude Agent SDK
    // Using dynamic import to support different SDK configurations
    const { Claude } = await import('@anthropic-ai/claude-agent-sdk');

    const client = new Claude({
      apiKey: process.env['ANTHROPIC_API_KEY'],
      maxOutputTokens: parseInt(process.env['CLAUDE_CODE_MAX_OUTPUT_TOKENS'] ?? '64000', 10),
    });

    const result = await client.run({
      prompt,
      mcpServers,
      tools: getSystemTools(),
      maxTurns: 100,
      onMessage: async (message: any) => {
        turns++;

        if (message.type === 'tool_use') {
          const callTimer = new Timer();
          const record: ToolCallRecord = {
            tool: message.tool,
            input: message.input,
            timestamp: new Date().toISOString(),
            duration: 0,
          };

          await logger.logToolCall(message.tool, message.input);
          record.duration = callTimer.elapsed();
          toolCalls.push(record);
        }

        if (message.type === 'text') {
          await logger.logResponse(message.content);
        }

        // Track usage
        if (message.usage) {
          totalInputTokens += message.usage.input_tokens ?? 0;
          totalOutputTokens += message.usage.output_tokens ?? 0;
          totalCost += calculateCost(
            message.usage.input_tokens ?? 0,
            message.usage.output_tokens ?? 0,
          );
        }
      },
    });

    const duration = timer.elapsed();

    formatAgentOutput(input.agent, 'completed', duration, totalCost);

    return {
      agent: input.agent,
      cost: totalCost,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      turns,
      duration,
      toolCalls,
    };
  } catch (err) {
    const duration = timer.elapsed();
    const error = err instanceof Error ? err : new Error(String(err));

    await logger.logError(error);
    formatAgentOutput(input.agent, 'failed', duration, totalCost);

    throw error;
  }
}

/**
 * Build SSH connection instructions for the agent prompt.
 */
function buildSSHInstructions(input: AgentExecutionInput): string {
  const parts: string[] = [];

  if (!input.sshUser) {
    parts.push('No SSH credentials provided. Perform unauthenticated testing only.');
    parts.push(`Target: ${input.target}`);
    if (input.sshPort) parts.push(`SSH Port: ${input.sshPort}`);
    return parts.join('\n');
  }

  parts.push('SSH Connection Details:');
  parts.push(`  Host: ${input.target}`);
  parts.push(`  User: ${input.sshUser}`);
  parts.push(`  Port: ${input.sshPort ?? 22}`);

  if (input.sshKeyPath) {
    parts.push(`  Key: ${input.sshKeyPath}`);
    parts.push(`  Command: ssh -i ${input.sshKeyPath} -p ${input.sshPort ?? 22} ${input.sshUser}@${input.target}`);
  } else if (input.sshPassword) {
    parts.push('  Auth: Password-based (use sshpass or expect for automation)');
    parts.push(`  Command: sshpass -p '***' ssh -p ${input.sshPort ?? 22} ${input.sshUser}@${input.target}`);
  }

  return parts.join('\n');
}

/**
 * Load config and return formatted context for prompt injection.
 */
async function getConfigContext(configPath: string): Promise<string> {
  try {
    const config = await loadConfig(configPath);
    return JSON.stringify(config, null, 2);
  } catch {
    return '';
  }
}

/**
 * Build MCP server configurations for system testing tools.
 */
function buildMCPServers(input: AgentExecutionInput): any[] {
  // System testing doesn't use browser MCP servers like Shannon.
  // Instead, agents use bash tools directly for nmap, hydra, ssh-audit, etc.
  // MCP servers can be added here for specialized integrations.
  return [];
}

/**
 * Define system testing tools available to agents.
 */
function getSystemTools(): any[] {
  return [
    {
      name: 'bash',
      description: 'Execute bash commands on the testing system. Use for running security tools like nmap, hydra, ssh-audit, nuclei, john, nikto, and custom scripts.',
    },
    {
      name: 'read_file',
      description: 'Read file contents from the filesystem.',
    },
    {
      name: 'write_file',
      description: 'Write content to a file on the filesystem.',
    },
    {
      name: 'list_directory',
      description: 'List files and directories.',
    },
  ];
}

/**
 * Calculate cost based on Claude model pricing.
 * Uses Claude Sonnet 4.5 pricing as default.
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_1M = 3.0;   // $3 per 1M input tokens
  const OUTPUT_COST_PER_1M = 15.0;  // $15 per 1M output tokens

  return (
    (inputTokens / 1_000_000) * INPUT_COST_PER_1M +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M
  );
}
