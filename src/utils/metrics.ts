// =============================================================================
// Inkrypt - Metrics Utilities
// Timer and measurement helpers
// =============================================================================

/**
 * Simple high-resolution timer for duration tracking.
 */
export class Timer {
  private readonly start: number;

  constructor() {
    this.start = Date.now();
  }

  /**
   * Get elapsed time in milliseconds.
   */
  elapsed(): number {
    return Date.now() - this.start;
  }

  /**
   * Get elapsed time as formatted string.
   */
  format(): string {
    const ms = this.elapsed();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const min = Math.floor(ms / 60000);
    const sec = Math.round((ms % 60000) / 1000);
    return `${min}m${sec}s`;
  }
}
