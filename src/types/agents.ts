// =============================================================================
// Inkrypt - Agent Type Definitions
// System & SSH focused agent types
// =============================================================================

/**
 * All agent names in the Inkrypt pipeline.
 * Organized by testing phase and vulnerability domain.
 */
export type AgentName =
  | 'pre-recon'
  | 'recon'
  | 'ssh-vuln'
  | 'privesc-vuln'
  | 'network-vuln'
  | 'misconfig-vuln'
  | 'credential-vuln'
  | 'ssh-exploit'
  | 'privesc-exploit'
  | 'network-exploit'
  | 'misconfig-exploit'
  | 'credential-exploit'
  | 'report';

/**
 * Prompt template names mapped to agents.
 */
export type PromptName =
  | 'pre-recon-system'
  | 'recon'
  | 'vuln-ssh'
  | 'vuln-privesc'
  | 'vuln-network'
  | 'vuln-misconfig'
  | 'vuln-credential'
  | 'exploit-ssh'
  | 'exploit-privesc'
  | 'exploit-network'
  | 'exploit-misconfig'
  | 'exploit-credential'
  | 'report-executive';

/**
 * Terminal agent names - agents that get a dedicated terminal/SSH session.
 */
export type TerminalAgent =
  | 'terminal-agent1'
  | 'terminal-agent2'
  | 'terminal-agent3'
  | 'terminal-agent4'
  | 'terminal-agent5';

/**
 * Maps agent names to their corresponding prompt template names.
 */
export function getPromptNameForAgent(agent: AgentName): PromptName {
  const mapping: Record<AgentName, PromptName> = {
    'pre-recon': 'pre-recon-system',
    'recon': 'recon',
    'ssh-vuln': 'vuln-ssh',
    'privesc-vuln': 'vuln-privesc',
    'network-vuln': 'vuln-network',
    'misconfig-vuln': 'vuln-misconfig',
    'credential-vuln': 'vuln-credential',
    'ssh-exploit': 'exploit-ssh',
    'privesc-exploit': 'exploit-privesc',
    'network-exploit': 'exploit-network',
    'misconfig-exploit': 'exploit-misconfig',
    'credential-exploit': 'exploit-credential',
    'report': 'report-executive',
  };
  return mapping[agent];
}

/**
 * Maps agents to their dedicated terminal session to prevent conflicts.
 */
export function getTerminalForAgent(agent: AgentName): TerminalAgent | null {
  const mapping: Partial<Record<AgentName, TerminalAgent>> = {
    'ssh-vuln': 'terminal-agent1',
    'ssh-exploit': 'terminal-agent1',
    'privesc-vuln': 'terminal-agent2',
    'privesc-exploit': 'terminal-agent2',
    'network-vuln': 'terminal-agent3',
    'network-exploit': 'terminal-agent3',
    'misconfig-vuln': 'terminal-agent4',
    'misconfig-exploit': 'terminal-agent4',
    'credential-vuln': 'terminal-agent5',
    'credential-exploit': 'terminal-agent5',
  };
  return mapping[agent] ?? null;
}
