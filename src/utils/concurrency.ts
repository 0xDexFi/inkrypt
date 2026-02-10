// =============================================================================
// Inkrypt - Concurrency Utilities
// Mutex and race condition prevention for parallel phases
// =============================================================================

/**
 * Simple async mutex for preventing race conditions during parallel agent execution.
 * Used when multiple agents write to shared files (e.g., session.json).
 */
export class SessionMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  /**
   * Acquire the mutex. Waits if already held.
   */
  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release the mutex. Wakes the next waiter.
   */
  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  /**
   * Execute a function while holding the mutex.
   */
  async withLock<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
