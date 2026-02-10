// =============================================================================
// Inkrypt - Audit Logger
// Append-only, crash-safe file logger
// =============================================================================

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { AgentName } from '../types/agents.js';

/**
 * Append-only logger with crash-safe guarantees.
 * All writes are immediately flushed to disk.
 */
export class Logger {
  private readonly logPath: string;

  constructor(sessionPath: string) {
    this.logPath = join(sessionPath, 'session.log');
  }

  info(agent: AgentName | string, message: string): void {
    this.write('INFO', agent, message);
  }

  warn(agent: AgentName | string, message: string): void {
    this.write('WARN', agent, message);
  }

  error(agent: AgentName | string, message: string): void {
    this.write('ERROR', agent, message);
  }

  debug(agent: AgentName | string, message: string): void {
    this.write('DEBUG', agent, message);
  }

  private write(level: string, agent: string, message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.padEnd(5)}] [${agent}] ${message}\n`;
    try {
      appendFileSync(this.logPath, line, 'utf-8');
    } catch {
      // Never throw on log failures - crash-safe guarantee
    }
  }
}
