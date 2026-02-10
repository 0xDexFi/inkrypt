// =============================================================================
// Inkrypt - File I/O Utilities
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Read a file safely, returning null if not found.
 */
export function readFileSafe(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write a file, creating parent directories if needed.
 */
export function writeFileSafe(filePath: string, content: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Append to a file, creating it if needed.
 */
export function appendFileSafe(filePath: string, content: string): void {
  const { appendFileSync } = require('fs');
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  appendFileSync(filePath, content, 'utf-8');
}

/**
 * Check if a file exists and is not empty.
 */
export function fileExistsWithContent(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.trim().length > 0;
  } catch {
    return false;
  }
}
