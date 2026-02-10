// =============================================================================
// Inkrypt - Formatting Utilities
// String formatting, timestamps, and display helpers
// =============================================================================

/**
 * Format a timestamp for display.
 */
export function formatTimestamp(date?: Date): string {
  return (date ?? new Date()).toISOString();
}

/**
 * Format a short timestamp (HH:MM:SS).
 */
export function formatShortTimestamp(date?: Date): string {
  return (date ?? new Date()).toISOString().slice(11, 19);
}

/**
 * Format bytes to human-readable size.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Sanitize a string for use in filenames.
 */
export function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

/**
 * Truncate a string to max length with ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Indent each line of a multi-line string.
 */
export function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map((line) => pad + line).join('\n');
}
