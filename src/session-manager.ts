// =============================================================================
// Inkrypt - Session Manager
// Agent definitions, execution order, and parallel groups
// =============================================================================

import type { AgentName } from './types/agents.js';

/**
 * All agents in pipeline execution order.
 */
export const AGENTS: AgentName[] = [
  'pre-recon',
  'recon',
  'ssh-vuln',
  'privesc-vuln',
  'network-vuln',
  'misconfig-vuln',
  'credential-vuln',
  'ssh-exploit',
  'privesc-exploit',
  'network-exploit',
  'misconfig-exploit',
  'credential-exploit',
  'report',
];

/**
 * Ordered execution phases.
 * Sequential phases run one at a time.
 * Parallel phases run all agents concurrently.
 */
export const AGENT_ORDER: { phase: string; agents: AgentName[]; parallel: boolean }[] = [
  {
    phase: 'Pre-Reconnaissance',
    agents: ['pre-recon'],
    parallel: false,
  },
  {
    phase: 'Reconnaissance',
    agents: ['recon'],
    parallel: false,
  },
  {
    phase: 'Vulnerability Analysis',
    agents: ['ssh-vuln', 'privesc-vuln', 'network-vuln', 'misconfig-vuln', 'credential-vuln', 'rdp-vuln', 'vnc-vuln'],
    parallel: true,
  },
  {
    phase: 'Exploitation',
    agents: ['ssh-exploit', 'privesc-exploit', 'network-exploit', 'misconfig-exploit', 'credential-exploit', 'rdp-exploit', 'vnc-exploit'],
    parallel: true,
  },
  {
    phase: 'Reporting',
    agents: ['report'],
    parallel: false,
  },
];

/**
 * Get parallel groups for pipelined execution.
 * Exploitation agents can start as soon as their corresponding vuln agent finishes.
 */
export function getParallelGroups(): { vuln: AgentName; exploit: AgentName }[] {
  return [
    { vuln: 'ssh-vuln', exploit: 'ssh-exploit' },
    { vuln: 'privesc-vuln', exploit: 'privesc-exploit' },
    { vuln: 'network-vuln', exploit: 'network-exploit' },
    { vuln: 'misconfig-vuln', exploit: 'misconfig-exploit' },
    { vuln: 'credential-vuln', exploit: 'credential-exploit' },
    { vuln: 'rdp-vuln', exploit: 'rdp-exploit' },
    { vuln: 'vnc-vuln', exploit: 'vnc-exploit' },
  ];
}

/**
 * Get the display name for an agent.
 */
export function getAgentDisplayName(agent: AgentName): string {
  const names: Record<AgentName, string> = {
    'pre-recon': 'Pre-Reconnaissance',
    'recon': 'Reconnaissance',
    'ssh-vuln': 'SSH Vulnerability Analysis',
    'privesc-vuln': 'Privilege Escalation Analysis',
    'network-vuln': 'Network Service Analysis',
    'misconfig-vuln': 'System Misconfiguration Analysis',
    'credential-vuln': 'Credential Security Analysis',
    'rdp-vuln': 'RDP Vulnerability Analysis',
    'vnc-vuln': 'VNC Vulnerability Analysis',
    'ssh-exploit': 'SSH Exploitation',
    'privesc-exploit': 'Privilege Escalation Exploitation',
    'network-exploit': 'Network Service Exploitation',
    'misconfig-exploit': 'System Misconfiguration Exploitation',
    'credential-exploit': 'Credential Exploitation',
    'rdp-exploit': 'RDP Exploitation',
    'vnc-exploit': 'VNC Exploitation',
    'report': 'Report Generation',
  };
  return names[agent];
}
