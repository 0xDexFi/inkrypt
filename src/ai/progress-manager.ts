// =============================================================================
// Inkrypt - Progress Manager
// Tracks progress within individual agent turns
// =============================================================================

import type { AgentName } from '../types/agents.js';

interface ProgressState {
  agent: AgentName;
  startTime: number;
  currentStep: string;
  toolCallCount: number;
  lastToolCall?: string;
  lastActivity: number;
}

/**
 * Manages progress tracking for agent execution.
 */
export class ProgressManager {
  private state: ProgressState;

  constructor(agent: AgentName) {
    this.state = {
      agent,
      startTime: Date.now(),
      currentStep: 'Initializing',
      toolCallCount: 0,
      lastActivity: Date.now(),
    };
  }

  /**
   * Update the current step description.
   */
  setStep(step: string): void {
    this.state.currentStep = step;
    this.state.lastActivity = Date.now();
  }

  /**
   * Record a tool call.
   */
  recordToolCall(tool: string): void {
    this.state.toolCallCount++;
    this.state.lastToolCall = tool;
    this.state.lastActivity = Date.now();
  }

  /**
   * Get elapsed time in milliseconds.
   */
  getElapsed(): number {
    return Date.now() - this.state.startTime;
  }

  /**
   * Get time since last activity in milliseconds.
   */
  getIdleTime(): number {
    return Date.now() - this.state.lastActivity;
  }

  /**
   * Get current progress snapshot for heartbeat.
   */
  getSnapshot(): Record<string, unknown> {
    return {
      agent: this.state.agent,
      elapsed: this.getElapsed(),
      step: this.state.currentStep,
      toolCalls: this.state.toolCallCount,
      lastTool: this.state.lastToolCall,
      idleMs: this.getIdleTime(),
    };
  }
}
