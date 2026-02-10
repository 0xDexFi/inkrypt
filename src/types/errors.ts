// =============================================================================
// Inkrypt - Error Type Definitions
// =============================================================================

/**
 * Categorized error types for retry logic and classification.
 */
export type PentestErrorType =
  | 'auth_error'           // API authentication failure
  | 'config_error'         // Configuration parsing failure
  | 'target_unreachable'   // Target host not reachable
  | 'ssh_connection_error' // SSH connection failure
  | 'permission_denied'    // Insufficient permissions
  | 'tool_not_found'       // External tool missing
  | 'timeout_error'        // Operation timed out
  | 'rate_limit'           // API rate limit hit
  | 'transient_error'      // Temporary network/API errors
  | 'agent_error'          // AI agent execution failure
  | 'validation_error'     // Output validation failure
  | 'unknown_error';       // Uncategorized errors

/**
 * Structured log entry for audit trail.
 */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  agent?: string;
  phase?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tool execution error result.
 */
export interface ToolErrorResult {
  tool: string;
  error: string;
  exitCode?: number;
  stderr?: string;
  retryable: boolean;
}
