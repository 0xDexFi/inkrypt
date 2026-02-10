// =============================================================================
// Inkrypt - Pre-Reconnaissance Phase
// External security tool scanning before AI agent analysis
// Runs: nmap, masscan, ssh-audit, nuclei, subfinder, lynis, testssl, searchsploit
// =============================================================================

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface ToolScanResults {
  nmapResults: string;
  sshAuditResults: string;
  nucleiResults: string;
  subfinderResults: string;
  masscanResults: string;
  testsslResults: string;
  lynisResults: string;
  searchsploitResults: string;
}

/**
 * Run external pre-reconnaissance tools against the target.
 *
 * Wave 1 (parallel - fast scans):
 *   - masscan: Fast port discovery across all ports
 *   - ssh-audit: SSH server configuration analysis
 *   - subfinder: Subdomain enumeration (if hostname)
 *   - testssl.sh: TLS/SSL testing (if HTTPS detected)
 *
 * Wave 2 (parallel - deep scans, informed by Wave 1):
 *   - nmap: Detailed service/version/script scanning on discovered ports
 *   - nuclei: Vulnerability scanning with community templates
 *   - lynis: System security auditing (if authenticated)
 *   - searchsploit: Cross-reference discovered versions against ExploitDB
 */
export async function runPreReconTools(
  target: string,
  outputDir: string,
  scope?: string,
  sshPort?: number,
): Promise<ToolScanResults> {
  const toolOutputDir = join(outputDir, 'tool-outputs');
  if (!existsSync(toolOutputDir)) {
    mkdirSync(toolOutputDir, { recursive: true });
  }

  const port = sshPort ?? 22;

  // Wave 1: Fast parallel scans
  const [masscanResult, sshAuditResult, subfinderResult, testsslResult] =
    await Promise.allSettled([
      runMasscan(target, toolOutputDir, scope),
      runSSHAudit(target, port, toolOutputDir),
      runSubfinder(target, toolOutputDir),
      runTestSSL(target, toolOutputDir),
    ]);

  const masscan = settledValue(masscanResult, 'masscan');
  const sshAudit = settledValue(sshAuditResult, 'ssh-audit');
  const subfinder = settledValue(subfinderResult, 'subfinder');
  const testssl = settledValue(testsslResult, 'testssl');

  // Wave 2: Deep scans (can use masscan results to target nmap)
  const [nmapResult, nucleiResult, lynisResult, searchsploitResult] =
    await Promise.allSettled([
      runNmap(target, toolOutputDir, scope),
      runNuclei(target, toolOutputDir),
      runLynis(toolOutputDir),
      runSearchsploit(target, toolOutputDir),
    ]);

  return {
    nmapResults: settledValue(nmapResult, 'nmap'),
    sshAuditResults: sshAudit,
    nucleiResults: settledValue(nucleiResult, 'nuclei'),
    subfinderResults: subfinder,
    masscanResults: masscan,
    testsslResults: testssl,
    lynisResults: settledValue(lynisResult, 'lynis'),
    searchsploitResults: settledValue(searchsploitResult, 'searchsploit'),
  };
}

function settledValue(
  result: PromiseSettledResult<string>,
  tool: string,
): string {
  return result.status === 'fulfilled'
    ? result.value
    : `${tool} failed: ${result.reason}`;
}

// =============================================================================
// Individual tool runners
// =============================================================================

async function runNmap(
  target: string,
  outputDir: string,
  scope?: string,
): Promise<string> {
  const scanTarget = scope ?? target;
  const outputFile = join(outputDir, 'nmap-results.txt');

  return runTool(
    `nmap -sV -sC -O -A --top-ports 1000 -oN "${outputFile}" ${scanTarget}`,
    outputFile,
    600000,
  );
}

async function runMasscan(
  target: string,
  outputDir: string,
  scope?: string,
): Promise<string> {
  const scanTarget = scope ?? target;
  const outputFile = join(outputDir, 'masscan-results.txt');

  return runTool(
    `masscan ${scanTarget} -p1-65535 --rate=1000 -oL "${outputFile}"`,
    outputFile,
    300000,
  );
}

async function runSSHAudit(
  target: string,
  port: number,
  outputDir: string,
): Promise<string> {
  const outputFile = join(outputDir, 'ssh-audit-results.txt');

  return runTool(
    `ssh-audit -p ${port} ${target}`,
    outputFile,
    120000,
  );
}

async function runSubfinder(
  target: string,
  outputDir: string,
): Promise<string> {
  const outputFile = join(outputDir, 'subfinder-results.txt');

  // Only run on hostnames, not IP addresses
  if (/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
    const msg = 'Skipped: target is an IP address';
    writeFileSync(outputFile, msg, 'utf-8');
    return msg;
  }

  return runTool(
    `subfinder -d ${target} -o "${outputFile}" -silent`,
    outputFile,
    300000,
  );
}

async function runNuclei(
  target: string,
  outputDir: string,
): Promise<string> {
  const outputFile = join(outputDir, 'nuclei-results.txt');

  return runTool(
    `nuclei -target ${target} -severity low,medium,high,critical -o "${outputFile}" -silent`,
    outputFile,
    900000,
  );
}

async function runTestSSL(
  target: string,
  outputDir: string,
): Promise<string> {
  const outputFile = join(outputDir, 'testssl-results.txt');

  return runTool(
    `testssl.sh --quiet --logfile "${outputFile}" ${target}`,
    outputFile,
    300000,
  );
}

async function runLynis(outputDir: string): Promise<string> {
  const outputFile = join(outputDir, 'lynis-results.txt');

  return runTool(
    `lynis audit system --quick --no-colors --logfile "${outputFile}"`,
    outputFile,
    300000,
  );
}

async function runSearchsploit(
  target: string,
  outputDir: string,
): Promise<string> {
  const outputFile = join(outputDir, 'searchsploit-results.txt');

  // searchsploit needs service names/versions - search for common services
  // The AI agent will run more targeted searchsploit queries later
  return runTool(
    `searchsploit --nmap "${join(outputDir, 'nmap-results.txt')}" 2>/dev/null | tee "${outputFile}"`,
    outputFile,
    120000,
  );
}

// =============================================================================
// Generic tool runner with error handling
// =============================================================================

async function runTool(
  command: string,
  outputFile: string,
  timeout: number,
): Promise<string> {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (result && !existsSync(outputFile)) {
      writeFileSync(outputFile, result, 'utf-8');
    }
    return result;
  } catch (err: any) {
    const output = err.stdout ?? err.stderr ?? err.message;
    writeFileSync(outputFile, output, 'utf-8');
    return output;
  }
}
