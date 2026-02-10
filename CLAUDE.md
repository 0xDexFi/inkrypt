# Inkrypt - Claude Code Guidance

## Project Overview
Inkrypt is an autonomous AI-powered system and SSH penetration testing framework. It uses Claude Agent SDK with Temporal orchestration to run multi-agent security assessments against infrastructure targets.

## Architecture
- **Temporal orchestration** for durable, crash-recoverable workflows
- **13 specialized agents** across 5 phases: Pre-Recon, Recon, Vuln Analysis (5), Exploitation (5), Reporting
- **Pipelined parallelism**: Exploitation agents start as soon as their vulnerability analysis completes
- **TypeScript/ESM** with strict typing throughout

## Key Directories
- `src/temporal/` - Temporal workflows, activities, worker, client
- `src/ai/` - Claude Agent SDK execution engine
- `src/audit/` - Logging, metrics, session tracking
- `src/phases/` - Pre-recon tool scanning, report assembly
- `src/types/` - Type definitions
- `src/utils/` - Git management, concurrency, formatting
- `prompts/` - Agent prompt templates (system/SSH focused)
- `configs/` - YAML config schema and examples

## Vulnerability Domains
1. **SSH** - Server configuration, authentication, CVEs, tunneling
2. **Privilege Escalation** - SUID, sudo, cron, kernel, permissions
3. **Network Services** - HTTP, FTP, SMB, databases, DNS, mail
4. **System Misconfigurations** - File permissions, access control, services, kernel hardening
5. **Credential Security** - Passwords, default creds, key management, storage

## Build & Run
```bash
npm install && npm run build
./inkrypt start TARGET=<ip> [SSH_USER=<user>] [SSH_KEY=<path>]
```

## Testing
Use `PIPELINE_TESTING=true` for fast iteration with minimal prompts.
