// =============================================================================
// Inkrypt - Audit Utilities
// Path generation, atomic writes, and directory initialization
// =============================================================================

import { mkdirSync, writeFileSync, renameSync, existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Generate session output path from base output directory.
 */
export function generateSessionPath(outputDir: string): string {
  return outputDir;
}

/**
 * Initialize session directory structure.
 */
export function initSessionDirectory(sessionPath: string): void {
  const dirs = [
    sessionPath,
    join(sessionPath, 'agent-logs'),
    join(sessionPath, 'tool-outputs'),
    join(sessionPath, 'vuln-queues'),
    join(sessionPath, 'exploit-results'),
    join(sessionPath, 'reports'),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Atomic write: write to temp file then rename.
 * Prevents partial writes from corrupting the target file.
 */
export function atomicWrite(filePath: string, content: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${filePath}.tmp.${process.pid}`;
  try {
    writeFileSync(tmpPath, content, 'utf-8');
    renameSync(tmpPath, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try {
      const { unlinkSync } = require('fs');
      unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup failures
    }
    throw err;
  }
}

/**
 * Generate a unique session ID.
 */
export function generateSessionId(target: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  const sanitized = target.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${sanitized}_${timestamp}_${random}`;
}
