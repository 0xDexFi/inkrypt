# Inkrypt

**Autonomous AI-Powered System & SSH Penetration Testing Framework**

Inkrypt is an autonomous penetration testing framework that uses AI agents to perform comprehensive security assessments against infrastructure targets. Built on the same multi-agent architecture patterns as web application pentest tools, Inkrypt is purpose-built for system-level and SSH security testing.

## Features

- **13 Specialized AI Agents** across 5 testing phases
- **Pipelined Parallel Execution** - exploitation starts immediately after vulnerability analysis
- **Crash-Recoverable Workflows** via Temporal orchestration
- **Zero False Positives** - every finding is validated through exploitation
- **Professional Reports** with reproducible proof-of-concepts
- **Comprehensive Audit Trail** with crash-safe logging

## Vulnerability Domains

| Domain | Vuln Agent | Exploit Agent | Coverage |
|--------|-----------|---------------|----------|
| SSH Security | `ssh-vuln` | `ssh-exploit` | Algorithms, auth, CVEs, tunneling, brute force resistance |
| Privilege Escalation | `privesc-vuln` | `privesc-exploit` | SUID, sudo, cron, kernel, permissions, services |
| Network Services | `network-vuln` | `network-exploit` | HTTP, FTP, SMB, databases, DNS, mail, SNMP, RDP |
| System Misconfig | `misconfig-vuln` | `misconfig-exploit` | File perms, access control, services, kernel, containers |
| Credential Security | `credential-vuln` | `credential-exploit` | Passwords, defaults, storage, keys, auth mechanisms |

## Quick Start

### Platform Support

- **Linux** (native) - fully supported, recommended
- **macOS** - supported via Docker
- **Windows** - supported via WSL2 + Docker

### Prerequisites

- **Linux/macOS**: Node.js >= 20, Docker & Docker Compose
- Anthropic API key

### Installation

```bash
git clone <repo-url> inkrypt
cd inkrypt
npm install
npm run build
```

### Setup

```bash
# 1. Edit .env and add your Anthropic API key
#    (auto-created from .env.example on first run)
nano .env
```

Your `.env` file:
```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000
```

### Usage

```bash
# Basic system scan
./inkrypt start TARGET=192.168.1.100

# SSH authenticated pentest
./inkrypt start TARGET=10.0.0.5 SSH_USER=admin SSH_KEY=~/.ssh/id_rsa

# Network scope scan with config
./inkrypt start TARGET=10.0.0.1 SCOPE=10.0.0.0/24 CONFIG=configs/example-config.yaml

# Query running pentest
./inkrypt query ID=inkrypt-abc123

# View logs
./inkrypt logs ID=inkrypt-abc123

# Stop containers
./inkrypt stop
```

### Docker (Recommended)

```bash
# Just edit .env and run - Docker includes all 40+ tools
./inkrypt start TARGET=192.168.1.100
```

## Architecture

```
Phase 1: Pre-Reconnaissance
         External tool scans (nmap, ssh-audit, nuclei, subfinder)
         + AI analysis of scan results
                    |
Phase 2: Reconnaissance
         Deep attack surface mapping & technology detection
                    |
Phase 3 & 4: Vulnerability Analysis + Exploitation (Pipelined)
         |-- ssh-vuln ---------> ssh-exploit
         |-- privesc-vuln -----> privesc-exploit
         |-- network-vuln -----> network-exploit
         |-- misconfig-vuln ---> misconfig-exploit
         |-- credential-vuln --> credential-exploit
                    |
Phase 5: Reporting
         Executive summary + full technical report
```

## Security Tools Included

The Docker image is based on **Kali Linux** and includes 40+ security tools:

| Category | Tools |
|----------|-------|
| **Exploitation Framework** | Metasploit Framework (msfconsole, msfvenom), searchsploit/ExploitDB |
| **Reconnaissance** | nmap, masscan, subfinder, dnsrecon, whatweb, whois |
| **Vulnerability Scanning** | nuclei, nikto, sqlmap, lynis, testssl.sh, sslscan |
| **Credential Testing** | hydra, medusa, john, hashcat, hashid, sshpass |
| **Web Testing** | gobuster, dirb, wfuzz, whatweb, sqlmap |
| **SMB/AD/Network** | enum4linux, crackmapexec, netexec, smbclient, smbmap, nbtscan, impacket |
| **Privilege Escalation** | LinPEAS, LinEnum, pspy, searchsploit |
| **System Auditing** | lynis, chkrootkit, rkhunter |
| **Tunneling/Pivoting** | proxychains4, socat, chisel |
| **Python Libraries** | paramiko, impacket, pwntools, bloodhound, certipy-ad |
| **Network Utilities** | netcat, hping3, tcpdump, arping, fping, traceroute |

## Configuration

See `configs/example-config.yaml` for full configuration options including:
- SSH authentication (password, key, agent)
- Service credentials for authenticated testing
- Network scope and exclusions
- Scan timing and aggressiveness
- Focus/avoid rules

## Output

Results are written to `audit-logs/<target>_<session>/`:

```
audit-logs/
  192.168.1.100_inkrypt-abc123/
    tool-outputs/          # Raw tool scan results
    vuln-queues/           # Vulnerability analysis findings
    exploit-results/       # Exploitation proof-of-concepts
    reports/               # Final pentest reports
    agent-logs/            # Per-agent execution logs
    session.json           # Session metrics
    session.log            # Combined session log
    workflow.log           # Workflow phase transitions
```

## License

AGPL-3.0
