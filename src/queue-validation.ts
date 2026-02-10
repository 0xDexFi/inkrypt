// =============================================================================
// Inkrypt - Queue Validation
// Validates deliverable files exist before exploitation phase
// =============================================================================

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AGENT_VALIDATORS } from './constants.js';
import type { AgentName } from './types/agents.js';

/**
 * Validate that expected deliverables exist for an agent.
 * Returns list of found deliverable paths.
 */
export async function validateDeliverables(
  agent: AgentName,
  outputDir: string,
): Promise<string[]> {
  const expectedFiles = AGENT_VALIDATORS[agent];
  if (!expectedFiles || expectedFiles.length === 0) {
    return [];
  }

  const found: string[] = [];
  const missing: string[] = [];

  for (const file of expectedFiles) {
    const filePath = resolveDeliverablePath(agent, outputDir, file);

    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8').trim();
      if (content.length > 0) {
        found.push(filePath);
      } else {
        missing.push(file);
      }
    } else {
      missing.push(file);
    }
  }

  // Warn but don't fail for missing deliverables
  if (missing.length > 0) {
    console.warn(
      `[${agent}] Missing deliverables: ${missing.join(', ')}`,
    );
  }

  return found;
}

/**
 * Check if a vulnerability queue file exists and has content.
 * Used before exploitation to determine if there are findings to exploit.
 */
export function hasVulnerabilityFindings(
  domain: string,
  outputDir: string,
): boolean {
  const queueFile = join(outputDir, 'vuln-queues', `vuln-queue-${domain}.md`);

  if (!existsSync(queueFile)) {
    return false;
  }

  const content = readFileSync(queueFile, 'utf-8').trim();

  // Check for meaningful content (not just headers)
  const lines = content.split('\n').filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('---') &&
      trimmed !== 'No vulnerabilities found.'
    );
  });

  return lines.length > 0;
}

/**
 * Resolve the full path for a deliverable file based on agent type.
 */
function resolveDeliverablePath(
  agent: AgentName,
  outputDir: string,
  filename: string,
): string {
  // Vulnerability queue files
  if (filename.startsWith('vuln-queue-')) {
    return join(outputDir, 'vuln-queues', filename);
  }

  // Exploit result files
  if (filename.startsWith('exploit-results-')) {
    return join(outputDir, 'exploit-results', filename);
  }

  // Report files
  if (filename === 'pentest-report.md' || filename === 'executive-summary.md') {
    return join(outputDir, 'reports', filename);
  }

  // Tool output files
  if (
    filename.endsWith('-results.txt') &&
    (agent === 'pre-recon' || agent === 'recon')
  ) {
    return join(outputDir, 'tool-outputs', filename);
  }

  // Default: root of output directory
  return join(outputDir, filename);
}
