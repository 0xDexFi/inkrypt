// =============================================================================
// Inkrypt - Git Manager
// Git checkpoint, commit, and rollback operations for agent workspaces
// =============================================================================

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type { AgentName } from '../types/agents.js';

/**
 * Manages git operations for agent execution safety.
 * Creates checkpoints before execution and rolls back on failure.
 */
export class GitManager {
  constructor(private readonly workDir: string) {}

  /**
   * Initialize git repo if not already initialized.
   */
  async init(): Promise<void> {
    if (!existsSync(`${this.workDir}/.git`)) {
      this.exec('git init');
      this.exec('git add -A');
      this.exec('git commit -m "Initial checkpoint" --allow-empty');
    }
  }

  /**
   * Create a checkpoint before agent execution.
   */
  async createCheckpoint(agent: AgentName): Promise<void> {
    try {
      await this.init();
      this.exec('git add -A');
      this.exec(`git commit -m "checkpoint-before-${agent}" --allow-empty`);
    } catch {
      // Checkpoints are best-effort
    }
  }

  /**
   * Commit checkpoint after successful execution.
   */
  async commitCheckpoint(agent: AgentName): Promise<void> {
    try {
      this.exec('git add -A');
      this.exec(`git commit -m "completed-${agent}" --allow-empty`);
    } catch {
      // Commits are best-effort
    }
  }

  /**
   * Rollback to the checkpoint before agent execution.
   */
  async rollbackCheckpoint(agent: AgentName): Promise<void> {
    try {
      // Find the checkpoint commit
      const log = this.exec(`git log --oneline --grep="checkpoint-before-${agent}" -1`);
      if (log.trim()) {
        const commitHash = log.trim().split(' ')[0];
        if (commitHash) {
          this.exec(`git reset --hard ${commitHash}`);
        }
      }
    } catch {
      // Rollback is best-effort
    }
  }

  /**
   * Execute a git command in the working directory.
   */
  private exec(command: string): string {
    return execSync(command, {
      cwd: this.workDir,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }
}
