// =============================================================================
// Inkrypt - Metrics Tracker
// Tracks cost, duration, tokens, and attempts per agent
// =============================================================================

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { atomicWrite } from './utils.js';
import type { AgentName } from '../types/agents.js';
import type { AgentMetrics } from '../temporal/shared.js';

interface SessionMetrics {
  sessionId: string;
  startTime: string;
  agents: Record<string, {
    startTime?: string;
    endTime?: string;
    duration?: number;
    cost?: number;
    inputTokens?: number;
    outputTokens?: number;
    turns?: number;
    attempts: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
  }>;
  totalCost: number;
  totalDuration: number;
}

/**
 * Tracks and persists metrics across agent executions.
 * Uses atomic writes to prevent corruption during parallel execution.
 */
export class MetricsTracker {
  private readonly metricsPath: string;
  private metrics: SessionMetrics;

  constructor(sessionPath: string, sessionId: string) {
    this.metricsPath = join(sessionPath, 'session.json');

    if (existsSync(this.metricsPath)) {
      this.metrics = JSON.parse(readFileSync(this.metricsPath, 'utf-8'));
    } else {
      this.metrics = {
        sessionId,
        startTime: new Date().toISOString(),
        agents: {},
        totalCost: 0,
        totalDuration: 0,
      };
      this.persist();
    }
  }

  recordAgentStart(agent: AgentName): void {
    this.metrics.agents[agent] = {
      startTime: new Date().toISOString(),
      attempts: (this.metrics.agents[agent]?.attempts ?? 0) + 1,
      status: 'running',
    };
    this.persist();
  }

  recordAgentComplete(agent: AgentName, agentMetrics: AgentMetrics): void {
    const entry = this.metrics.agents[agent];
    if (entry) {
      entry.endTime = new Date().toISOString();
      entry.duration = agentMetrics.duration;
      entry.cost = agentMetrics.cost;
      entry.inputTokens = agentMetrics.inputTokens;
      entry.outputTokens = agentMetrics.outputTokens;
      entry.turns = agentMetrics.turns;
      entry.status = 'completed';
    }
    this.metrics.totalCost += agentMetrics.cost;
    this.persist();
  }

  recordAgentError(agent: AgentName, error: Error): void {
    const entry = this.metrics.agents[agent];
    if (entry) {
      entry.endTime = new Date().toISOString();
      entry.status = 'failed';
      entry.error = error.message.slice(0, 500);
    }
    this.persist();
  }

  writeFinalSummary(allMetrics: AgentMetrics[]): void {
    this.metrics.totalCost = allMetrics.reduce((sum, m) => sum + m.cost, 0);
    this.metrics.totalDuration = allMetrics.reduce((sum, m) => sum + m.duration, 0);
    this.persist();
  }

  private persist(): void {
    atomicWrite(this.metricsPath, JSON.stringify(this.metrics, null, 2));
  }
}
