// =============================================================================
// Inkrypt - AI Audit Logger
// Agent-level logging for tool calls, responses, and errors
// =============================================================================

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { AgentName } from '../types/agents.js';

/**
 * Append-only, crash-safe audit logger for individual agent executions.
 * Each agent gets its own log file within the session directory.
 */
export class AuditLogger {
  private readonly logPath: string;
  private readonly agentLogPath: string;

  constructor(
    private readonly sessionId: string,
    private readonly outputDir: string,
    private readonly agent: AgentName,
  ) {
    const logDir = join(outputDir, 'agent-logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    this.logPath = join(logDir, `${agent}.log`);
    this.agentLogPath = join(logDir, `${agent}-audit.jsonl`);
  }

  /**
   * Log the initial prompt sent to the agent.
   */
  async logPrompt(prompt: string): Promise<void> {
    this.appendLog('PROMPT', `Prompt loaded (${prompt.length} chars)`);
    this.appendAuditEvent({
      type: 'prompt',
      agent: this.agent,
      timestamp: new Date().toISOString(),
      promptLength: prompt.length,
    });
  }

  /**
   * Log a tool call made by the agent.
   */
  async logToolCall(tool: string, input: Record<string, unknown>): Promise<void> {
    const inputStr = JSON.stringify(input).slice(0, 500);
    this.appendLog('TOOL', `${tool}: ${inputStr}`);
    this.appendAuditEvent({
      type: 'tool_call',
      agent: this.agent,
      timestamp: new Date().toISOString(),
      tool,
      inputPreview: inputStr,
    });
  }

  /**
   * Log a text response from the agent.
   */
  async logResponse(content: string): Promise<void> {
    const preview = content.slice(0, 200);
    this.appendLog('RESPONSE', preview);
    this.appendAuditEvent({
      type: 'response',
      agent: this.agent,
      timestamp: new Date().toISOString(),
      contentLength: content.length,
      preview,
    });
  }

  /**
   * Log an error during agent execution.
   */
  async logError(error: Error): Promise<void> {
    this.appendLog('ERROR', `${error.name}: ${error.message}`);
    this.appendAuditEvent({
      type: 'error',
      agent: this.agent,
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.slice(0, 1000),
    });
  }

  /**
   * Append a human-readable log line.
   */
  private appendLog(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] [${this.agent}] ${message}\n`;
    try {
      appendFileSync(this.logPath, line, 'utf-8');
    } catch {
      // Crash-safe: don't throw on log failures
    }
  }

  /**
   * Append a structured JSONL audit event.
   */
  private appendAuditEvent(event: Record<string, unknown>): void {
    try {
      appendFileSync(this.agentLogPath, JSON.stringify(event) + '\n', 'utf-8');
    } catch {
      // Crash-safe: don't throw on log failures
    }
  }
}
