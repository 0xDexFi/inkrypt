// =============================================================================
// Inkrypt - Constants & Agent Validators
// =============================================================================

import type { AgentName, TerminalAgent } from './types/agents.js';

/**
 * Expected deliverable files per agent for output validation.
 */
export const AGENT_VALIDATORS: Record<AgentName, string[]> = {
  'pre-recon': [
    'nmap-results.txt',
    'ssh-audit-results.txt',
    'service-enumeration.md',
  ],
  'recon': [
    'attack-surface.md',
    'technology-stack.md',
    'entry-points.md',
  ],
  'ssh-vuln': ['vuln-queue-ssh.md'],
  'privesc-vuln': ['vuln-queue-privesc.md'],
  'network-vuln': ['vuln-queue-network.md'],
  'misconfig-vuln': ['vuln-queue-misconfig.md'],
  'credential-vuln': ['vuln-queue-credential.md'],
  'ssh-exploit': ['exploit-results-ssh.md'],
  'privesc-exploit': ['exploit-results-privesc.md'],
  'network-exploit': ['exploit-results-network.md'],
  'misconfig-exploit': ['exploit-results-misconfig.md'],
  'credential-exploit': ['exploit-results-credential.md'],
  'report': ['pentest-report.md'],
};

/**
 * Terminal agent mappings for concurrent SSH/command sessions.
 * Each vulnerability domain gets its own terminal session to prevent conflicts.
 */
export const TERMINAL_AGENT_MAPPING: Record<string, TerminalAgent> = {
  'ssh': 'terminal-agent1',
  'privesc': 'terminal-agent2',
  'network': 'terminal-agent3',
  'misconfig': 'terminal-agent4',
  'credential': 'terminal-agent5',
};

/**
 * Vulnerability domains tested by Inkrypt.
 */
export const VULN_DOMAINS = [
  'ssh',
  'privesc',
  'network',
  'misconfig',
  'credential',
] as const;

export type VulnDomain = (typeof VULN_DOMAINS)[number];

/**
 * Default SSH port.
 */
export const DEFAULT_SSH_PORT = 22;

/**
 * Maximum concurrent activities for Temporal worker.
 */
export const MAX_CONCURRENT_ACTIVITIES = 25;

/**
 * Heartbeat interval in milliseconds.
 */
export const HEARTBEAT_INTERVAL_MS = 2000;

/**
 * Maximum error message length for Temporal (prevent buffer overflow).
 */
export const MAX_ERROR_LENGTH = 5000;
