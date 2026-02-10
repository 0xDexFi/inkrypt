// =============================================================================
// Inkrypt - Tool Checker
// Validates external security tool availability
// =============================================================================

import { execSync } from 'child_process';
import chalk from 'chalk';

interface ToolCheck {
  name: string;
  command: string;
  required: boolean;
  category: string;
  description: string;
}

/**
 * Complete security toolkit checked by Inkrypt.
 */
const TOOLS: ToolCheck[] = [
  // --- Reconnaissance & Scanning ---
  {
    name: 'nmap',
    command: 'nmap --version',
    required: true,
    category: 'Reconnaissance',
    description: 'Port scanning, service detection, OS fingerprinting',
  },
  {
    name: 'masscan',
    command: 'masscan --version',
    required: false,
    category: 'Reconnaissance',
    description: 'High-speed port scanner for large networks',
  },
  {
    name: 'subfinder',
    command: 'subfinder -version',
    required: false,
    category: 'Reconnaissance',
    description: 'Subdomain enumeration',
  },
  {
    name: 'dnsrecon',
    command: 'dnsrecon --version',
    required: false,
    category: 'Reconnaissance',
    description: 'DNS enumeration and zone transfer testing',
  },

  // --- Vulnerability Analysis ---
  {
    name: 'ssh-audit',
    command: 'ssh-audit --help',
    required: true,
    category: 'Vulnerability Analysis',
    description: 'SSH server configuration auditing',
  },
  {
    name: 'nuclei',
    command: 'nuclei -version',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'Template-based vulnerability scanner',
  },
  {
    name: 'nikto',
    command: 'nikto -Version',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'Web server vulnerability scanner',
  },
  {
    name: 'sqlmap',
    command: 'sqlmap --version',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'SQL injection detection and exploitation',
  },
  {
    name: 'searchsploit',
    command: 'searchsploit --help',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'Local exploit database search (ExploitDB)',
  },
  {
    name: 'lynis',
    command: 'lynis --version',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'System security auditing and hardening',
  },
  {
    name: 'testssl.sh',
    command: 'testssl.sh --version',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'TLS/SSL cipher and vulnerability testing',
  },
  {
    name: 'sslscan',
    command: 'sslscan --version',
    required: false,
    category: 'Vulnerability Analysis',
    description: 'SSL/TLS configuration scanner',
  },

  // --- Exploitation ---
  {
    name: 'metasploit',
    command: 'msfconsole --version',
    required: false,
    category: 'Exploitation',
    description: 'Metasploit Framework - exploit development and delivery',
  },
  {
    name: 'msfvenom',
    command: 'msfvenom --version',
    required: false,
    category: 'Exploitation',
    description: 'Metasploit payload generator',
  },

  // --- Credential Testing ---
  {
    name: 'hydra',
    command: 'hydra -h',
    required: false,
    category: 'Credential Testing',
    description: 'Network login cracker',
  },
  {
    name: 'medusa',
    command: 'medusa -V',
    required: false,
    category: 'Credential Testing',
    description: 'Parallel network login auditor',
  },
  {
    name: 'john',
    command: 'john --help',
    required: false,
    category: 'Credential Testing',
    description: 'John the Ripper password cracker',
  },
  {
    name: 'hashcat',
    command: 'hashcat --version',
    required: false,
    category: 'Credential Testing',
    description: 'GPU-accelerated password recovery',
  },
  {
    name: 'hashid',
    command: 'hashid --help',
    required: false,
    category: 'Credential Testing',
    description: 'Hash type identification',
  },
  {
    name: 'sshpass',
    command: 'sshpass -V',
    required: false,
    category: 'Credential Testing',
    description: 'Non-interactive SSH password auth',
  },

  // --- Web Application Testing ---
  {
    name: 'gobuster',
    command: 'gobuster version',
    required: false,
    category: 'Web Testing',
    description: 'Directory/DNS/vhost brute-forcing',
  },
  {
    name: 'dirb',
    command: 'dirb',
    required: false,
    category: 'Web Testing',
    description: 'Web content scanner',
  },
  {
    name: 'wfuzz',
    command: 'wfuzz --version',
    required: false,
    category: 'Web Testing',
    description: 'Web application fuzzer',
  },
  {
    name: 'whatweb',
    command: 'whatweb --version',
    required: false,
    category: 'Web Testing',
    description: 'Web technology fingerprinting',
  },

  // --- SMB/AD/Network Services ---
  {
    name: 'enum4linux',
    command: 'enum4linux --help',
    required: false,
    category: 'Network Services',
    description: 'Windows/SMB enumeration',
  },
  {
    name: 'crackmapexec',
    command: 'crackmapexec --version',
    required: false,
    category: 'Network Services',
    description: 'Network service exploitation (SMB/WinRM/LDAP/SSH)',
  },
  {
    name: 'netexec',
    command: 'netexec --version',
    required: false,
    category: 'Network Services',
    description: 'CrackMapExec successor - network service exploitation',
  },
  {
    name: 'smbclient',
    command: 'smbclient --version',
    required: false,
    category: 'Network Services',
    description: 'SMB/CIFS client for share access',
  },
  {
    name: 'smbmap',
    command: 'smbmap --version',
    required: false,
    category: 'Network Services',
    description: 'SMB share enumeration',
  },
  {
    name: 'impacket',
    command: 'impacket-smbserver --help',
    required: false,
    category: 'Network Services',
    description: 'Impacket protocol exploitation suite',
  },
  {
    name: 'nbtscan',
    command: 'nbtscan -h',
    required: false,
    category: 'Network Services',
    description: 'NetBIOS name scanner',
  },

  // --- Privilege Escalation ---
  {
    name: 'linpeas',
    command: 'test -f /opt/privesc/linpeas.sh',
    required: false,
    category: 'Privilege Escalation',
    description: 'Linux Privilege Escalation Awesome Script',
  },
  {
    name: 'linenum',
    command: 'test -f /opt/privesc/linenum.sh',
    required: false,
    category: 'Privilege Escalation',
    description: 'Linux enumeration for privilege escalation',
  },
  {
    name: 'pspy',
    command: 'test -f /opt/privesc/pspy64',
    required: false,
    category: 'Privilege Escalation',
    description: 'Process spy - monitor processes without root',
  },

  // --- System Hardening & Detection ---
  {
    name: 'chkrootkit',
    command: 'chkrootkit -V',
    required: false,
    category: 'Hardening',
    description: 'Rootkit detection',
  },
  {
    name: 'rkhunter',
    command: 'rkhunter --version',
    required: false,
    category: 'Hardening',
    description: 'Rootkit and backdoor detection',
  },

  // --- Networking & Tunneling ---
  {
    name: 'proxychains',
    command: 'proxychains4 --version',
    required: false,
    category: 'Tunneling',
    description: 'Proxy chain for routing through pivots',
  },
  {
    name: 'socat',
    command: 'socat -V',
    required: false,
    category: 'Tunneling',
    description: 'Multipurpose relay for tunneling',
  },
  {
    name: 'netcat',
    command: 'nc -h',
    required: false,
    category: 'Tunneling',
    description: 'Network utility for connections and listeners',
  },

  // --- Core Utilities ---
  {
    name: 'curl',
    command: 'curl --version',
    required: true,
    category: 'Core',
    description: 'HTTP client for service probing',
  },
  {
    name: 'git',
    command: 'git --version',
    required: true,
    category: 'Core',
    description: 'Version control for checkpoint management',
  },
  {
    name: 'python3',
    command: 'python3 --version',
    required: true,
    category: 'Core',
    description: 'Python runtime for security tools and scripts',
  },
];

/**
 * Check availability of all external tools.
 * Returns true if all required tools are available.
 */
export function checkTools(): boolean {
  console.log(chalk.bold('\n  Inkrypt Security Toolkit Check'));
  console.log(chalk.gray('  ==============================\n'));

  let allRequiredAvailable = true;
  let currentCategory = '';

  for (const tool of TOOLS) {
    // Print category header
    if (tool.category !== currentCategory) {
      currentCategory = tool.category;
      console.log(`\n  ${chalk.cyan.bold(currentCategory)}`);
    }

    const available = isToolAvailable(tool.command);
    const status = available
      ? chalk.green('+')
      : tool.required
        ? chalk.red('x')
        : chalk.yellow('-');

    const label = available
      ? chalk.green(tool.name)
      : tool.required
        ? chalk.red(tool.name)
        : chalk.dim(tool.name);

    const reqLabel = tool.required
      ? chalk.red('(required)')
      : chalk.dim('(optional)');

    console.log(`    ${status} ${label.padEnd(30)} ${reqLabel} ${chalk.dim(tool.description)}`);

    if (!available && tool.required) {
      allRequiredAvailable = false;
    }
  }

  // Summary
  const total = TOOLS.length;
  const available = TOOLS.filter((t) => isToolAvailable(t.command)).length;
  const required = TOOLS.filter((t) => t.required).length;
  const requiredAvailable = TOOLS.filter((t) => t.required && isToolAvailable(t.command)).length;

  console.log(`\n  ${chalk.bold('Summary:')} ${available}/${total} tools available | ${requiredAvailable}/${required} required tools ready`);

  if (!allRequiredAvailable) {
    console.log(chalk.red('\n  Some required tools are missing. Install them or use the Docker image.'));
    console.log(chalk.yellow('  The Docker image (Kali-based) includes ALL tools pre-installed.\n'));
  } else {
    console.log(chalk.green('\n  All required tools available. Ready to test.\n'));
  }

  return allRequiredAvailable;
}

/**
 * Check if a tool is available by running its command.
 */
function isToolAvailable(command: string): boolean {
  try {
    execSync(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}
