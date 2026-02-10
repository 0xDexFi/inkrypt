// =============================================================================
// Inkrypt - Error Handling
// Custom error classes, classification, and retry logic
// =============================================================================

import type { PentestErrorType } from './types/errors.js';

/**
 * Custom error class for pentest operations with classification.
 */
export class PentestError extends Error {
  constructor(
    message: string,
    public readonly type: PentestErrorType,
    public readonly retryable: boolean,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'PentestError';
  }
}

/**
 * Classify an error into a PentestErrorType with retry guidance.
 */
export function classifyError(error: Error): { type: PentestErrorType; retryable: boolean } {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // API authentication errors (not retryable)
  if (
    message.includes('api key') ||
    message.includes('unauthorized') ||
    message.includes('authentication failed') ||
    message.includes('invalid api')
  ) {
    return { type: 'auth_error', retryable: false };
  }

  // Configuration errors (not retryable)
  if (
    name === 'configerror' ||
    message.includes('config') ||
    message.includes('schema validation')
  ) {
    return { type: 'config_error', retryable: false };
  }

  // Target unreachable (may be retryable)
  if (
    message.includes('econnrefused') ||
    message.includes('ehostunreach') ||
    message.includes('host unreachable') ||
    message.includes('no route to host')
  ) {
    return { type: 'target_unreachable', retryable: true };
  }

  // SSH connection errors (may be retryable)
  if (
    message.includes('ssh') ||
    message.includes('connection reset') ||
    message.includes('broken pipe')
  ) {
    return { type: 'ssh_connection_error', retryable: true };
  }

  // Permission denied (not retryable)
  if (
    message.includes('permission denied') ||
    message.includes('access denied') ||
    message.includes('eperm')
  ) {
    return { type: 'permission_denied', retryable: false };
  }

  // Tool not found (not retryable)
  if (
    message.includes('not found') ||
    message.includes('command not found') ||
    message.includes('enoent')
  ) {
    return { type: 'tool_not_found', retryable: false };
  }

  // Timeout (retryable)
  if (
    message.includes('timeout') ||
    message.includes('etimedout') ||
    message.includes('timed out')
  ) {
    return { type: 'timeout_error', retryable: true };
  }

  // Rate limiting (retryable)
  if (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('too many requests')
  ) {
    return { type: 'rate_limit', retryable: true };
  }

  // Transient errors (retryable)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('temporary') ||
    message.includes('transient')
  ) {
    return { type: 'transient_error', retryable: true };
  }

  // Agent execution errors (may be retryable)
  if (
    message.includes('agent') ||
    message.includes('claude') ||
    message.includes('anthropic')
  ) {
    return { type: 'agent_error', retryable: true };
  }

  // Validation errors (not retryable)
  if (
    message.includes('validation') ||
    message.includes('deliverable') ||
    message.includes('expected output')
  ) {
    return { type: 'validation_error', retryable: false };
  }

  // Unknown (retryable once)
  return { type: 'unknown_error', retryable: true };
}

/**
 * Create a non-retryable PentestError.
 */
export function nonRetryableError(
  message: string,
  type: PentestErrorType,
  cause?: Error,
): PentestError {
  return new PentestError(message, type, false, cause);
}

/**
 * Create a retryable PentestError.
 */
export function retryableError(
  message: string,
  type: PentestErrorType,
  cause?: Error,
): PentestError {
  return new PentestError(message, type, true, cause);
}
