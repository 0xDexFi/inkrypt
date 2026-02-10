# =============================================================================
# Inkrypt - Autonomous System & SSH Penetration Testing Framework
# Multi-stage Docker build with full pentest toolkit
# =============================================================================

# Stage 1: Builder
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Runtime
FROM kalilinux/kali-rolling AS runtime

ENV DEBIAN_FRONTEND=noninteractive

# =============================================================================
# Core system packages + Node.js
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
       | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
       > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Metasploit Framework
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    metasploit-framework \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Network Reconnaissance & Scanning
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    masscan \
    subfinder \
    dnsutils \
    dnsrecon \
    whois \
    traceroute \
    net-tools \
    iproute2 \
    iputils-ping \
    tcpdump \
    netcat-openbsd \
    hping3 \
    arping \
    fping \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Vulnerability Scanning & Analysis
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    nikto \
    nuclei \
    sqlmap \
    exploitdb \
    lynis \
    chkrootkit \
    rkhunter \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Web Application Testing
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    gobuster \
    dirb \
    wfuzz \
    sslscan \
    testssl.sh \
    whatweb \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Credential & Password Testing
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    hydra \
    medusa \
    john \
    hashcat \
    sshpass \
    openssh-client \
    hashid \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# SMB/AD/Network Service Exploitation
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    enum4linux \
    smbclient \
    smbmap \
    crackmapexec \
    nbtscan \
    onesixtyone \
    snmpwalk \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# RDP & VNC Testing Tools
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    freerdp2-x11 \
    rdesktop \
    tigervnc-viewer \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Privilege Escalation & Post-Exploitation Tools
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    proxychains4 \
    socat \
    chisel \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Download LinPEAS and LinEnum
RUN mkdir -p /opt/privesc && \
    curl -fsSL https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh \
      -o /opt/privesc/linpeas.sh && \
    chmod +x /opt/privesc/linpeas.sh && \
    curl -fsSL https://raw.githubusercontent.com/rebootuser/LinEnum/master/LinEnum.sh \
      -o /opt/privesc/linenum.sh && \
    chmod +x /opt/privesc/linenum.sh

# pspy for process monitoring (detect cron jobs without root)
RUN curl -fsSL https://github.com/DominicBreuker/pspy/releases/latest/download/pspy64 \
      -o /opt/privesc/pspy64 && \
    chmod +x /opt/privesc/pspy64

# =============================================================================
# Python-based security tools
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir \
    ssh-audit \
    paramiko \
    impacket \
    netexec \
    bloodhound \
    certipy-ad \
    pwntools \
    droopescan \
    wpscan

ENV PATH="/opt/venv/bin:/opt/privesc:$PATH"

# =============================================================================
# Setup
# =============================================================================

# Create non-root user
RUN groupadd -g 1001 pentest && \
    useradd -u 1001 -g pentest -m -s /bin/bash pentest

# Initialize Metasploit database
RUN mkdir -p /var/run/postgresql && \
    chown pentest:pentest /var/run/postgresql

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY prompts/ ./prompts/
COPY configs/ ./configs/
COPY inkrypt ./inkrypt
RUN chmod +x ./inkrypt

# Create workspace directories
RUN mkdir -p /app/audit-logs /app/targets && \
    chown -R pentest:pentest /app

USER pentest

# Default: start as Temporal worker
CMD ["node", "dist/temporal/worker.js"]
