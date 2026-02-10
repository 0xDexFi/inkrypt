// =============================================================================
// Inkrypt - Live Terminal Dashboard
// Real-time pipeline progress display using ANSI escape codes
// =============================================================================

import chalk from 'chalk';
import type { PipelineInput, PipelineProgress, PipelineState, AgentEvent } from '../temporal/shared.js';
import type { AgentName } from '../types/agents.js';
import { getProgress } from '../temporal/workflows.js';
import { formatDuration } from '../ai/output-formatters.js';
import { AGENT_COLORS } from '../ai/message-handlers.js';

/**
 * Minimal handle interface for querying workflow progress and awaiting results.
 * Avoids importing the full @temporalio/client WorkflowHandle generic.
 */
export interface DashboardHandle {
  workflowId: string;
  query<T>(queryDef: unknown): Promise<T>;
  result(): Promise<PipelineState>;
}

// =============================================================================
// Constants
// =============================================================================

const POLL_INTERVAL_MS = 2000;

const ALL_AGENTS: AgentName[] = [
  'pre-recon', 'recon',
  'ssh-vuln', 'privesc-vuln', 'network-vuln', 'misconfig-vuln', 'credential-vuln', 'rdp-vuln', 'vnc-vuln',
  'ssh-exploit', 'privesc-exploit', 'network-exploit', 'misconfig-exploit', 'credential-exploit', 'rdp-exploit', 'vnc-exploit',
  'report',
];

const VULN_EXPLOIT_PAIRS: [AgentName, AgentName][] = [
  ['ssh-vuln', 'ssh-exploit'],
  ['privesc-vuln', 'privesc-exploit'],
  ['network-vuln', 'network-exploit'],
  ['misconfig-vuln', 'misconfig-exploit'],
  ['credential-vuln', 'credential-exploit'],
  ['rdp-vuln', 'rdp-exploit'],
  ['vnc-vuln', 'vnc-exploit'],
];

const MAX_EVENT_LOG_LINES = 8;

// =============================================================================
// Status Icons
// =============================================================================

function statusIcon(
  agent: AgentName,
  progress: PipelineProgress,
): string {
  if (progress.completedAgents.includes(agent)) return chalk.green('✓');
  if (progress.failedAgents.includes(agent)) return chalk.red('✗');
  if (progress.skippedAgents.includes(agent)) return chalk.dim('⊘');
  if (progress.activeAgents.includes(agent)) return chalk.yellow('▸');
  return chalk.gray('○');
}

function agentStatusText(
  agent: AgentName,
  progress: PipelineProgress,
): string {
  if (progress.completedAgents.includes(agent)) {
    const metrics = progress.agentMetrics.find((m) => m.agent === agent);
    if (metrics) {
      return `${formatDuration(metrics.duration)}  $${metrics.cost.toFixed(2)}`;
    }
    return 'done';
  }
  if (progress.failedAgents.includes(agent)) return chalk.red('failed');
  if (progress.skippedAgents.includes(agent)) return chalk.dim('skipped');
  if (progress.activeAgents.includes(agent)) return chalk.yellow('running...');
  return '';
}

// =============================================================================
// Color Helper
// =============================================================================

function colorAgent(agent: AgentName): string {
  for (const [key, color] of Object.entries(AGENT_COLORS)) {
    if (agent.includes(key)) return color(agent);
  }
  return chalk.white(agent);
}

// =============================================================================
// Rendering
// =============================================================================

const BOX_WIDTH = 66;

function hLine(left: string, fill: string, right: string): string {
  return left + fill.repeat(BOX_WIDTH - 2) + right;
}

function padLine(content: string, rawLen: number): string {
  const pad = BOX_WIDTH - 4 - rawLen;
  return '║  ' + content + ' '.repeat(Math.max(0, pad)) + '  ║';
}

function emptyLine(): string {
  return padLine('', 0);
}

function renderFrame(progress: PipelineProgress, input: PipelineInput): string {
  const lines: string[] = [];

  // Top border
  lines.push(chalk.cyan(hLine('╔', '═', '╗')));

  // Title
  lines.push(chalk.cyan(padLine(
    chalk.bold.cyan('INKRYPT') + '  ' + chalk.dim('Autonomous Penetration Testing'),
    'INKRYPT  Autonomous Penetration Testing'.length,
  )));

  // Target / Elapsed / Cost line
  const elapsed = formatDuration(progress.elapsedMs);
  const cost = `$${progress.totalCost.toFixed(2)}`;
  const infoStr = `Target: ${input.target}  │  Elapsed: ${elapsed}  │  Cost: ${cost}`;
  lines.push(chalk.cyan(padLine(
    `Target: ${chalk.bold(input.target)}  │  Elapsed: ${chalk.bold(elapsed)}  │  Cost: ${chalk.bold(cost)}`,
    infoStr.length,
  )));

  // Separator
  lines.push(chalk.cyan(hLine('╠', '═', '╣')));

  // Current phase
  const phaseLabel = `▶ Phase: ${progress.currentPhase}`;
  lines.push(chalk.cyan(padLine(
    chalk.bold(`▶ Phase: ${progress.currentPhase}`),
    phaseLabel.length,
  )));
  lines.push(chalk.cyan(emptyLine()));

  // --- PRE-RECON ---
  lines.push(chalk.cyan(padLine(chalk.dim.bold('PRE-RECON'), 'PRE-RECON'.length)));
  const preReconLine = renderAgentLine('pre-recon', progress);
  lines.push(chalk.cyan(padLine(preReconLine.colored, preReconLine.rawLen)));

  // --- RECON ---
  lines.push(chalk.cyan(padLine(chalk.dim.bold('RECON'), 'RECON'.length)));
  const reconLine = renderAgentLine('recon', progress);
  lines.push(chalk.cyan(padLine(reconLine.colored, reconLine.rawLen)));

  // --- VULN ANALYSIS & EXPLOITATION ---
  lines.push(chalk.cyan(padLine(chalk.dim.bold('VULN ANALYSIS & EXPLOITATION'), 'VULN ANALYSIS & EXPLOITATION'.length)));
  for (const [vulnAgent, exploitAgent] of VULN_EXPLOIT_PAIRS) {
    const vLine = renderAgentLine(vulnAgent, progress);
    const eLine = renderAgentLine(exploitAgent, progress);
    const arrow = '  →  ';
    const combined = `${vLine.colored}${arrow}${eLine.colored}`;
    const combinedRaw = vLine.rawLen + arrow.length + eLine.rawLen;
    lines.push(chalk.cyan(padLine(combined, combinedRaw)));
  }

  // --- REPORTING ---
  lines.push(chalk.cyan(padLine(chalk.dim.bold('REPORTING'), 'REPORTING'.length)));
  const reportLine = renderAgentLine('report', progress);
  lines.push(chalk.cyan(padLine(reportLine.colored, reportLine.rawLen)));

  // Separator
  lines.push(chalk.cyan(hLine('╠', '═', '╣')));

  // Event log
  lines.push(chalk.cyan(padLine(chalk.bold('Event Log'), 'Event Log'.length)));
  const recentEvents = progress.agentEvents.slice(-MAX_EVENT_LOG_LINES);
  if (recentEvents.length === 0) {
    lines.push(chalk.cyan(padLine(chalk.dim('  Waiting for events...'), '  Waiting for events...'.length)));
  } else {
    for (const evt of recentEvents) {
      const evtLine = renderEventLine(evt);
      lines.push(chalk.cyan(padLine(evtLine.colored, evtLine.rawLen)));
    }
  }

  // Separator
  lines.push(chalk.cyan(hLine('╠', '═', '╣')));

  // Footer
  const completedCount = progress.completedAgents.length;
  const errorCount = progress.errors.length;
  const footerStr = `Agents: ${completedCount}/17 complete  │  Errors: ${errorCount}  │  Ctrl+C to detach`;
  lines.push(chalk.cyan(padLine(
    `Agents: ${chalk.bold(completedCount.toString())}/17 complete  │  Errors: ${chalk.bold(errorCount.toString())}  │  ${chalk.dim('Ctrl+C to detach')}`,
    footerStr.length,
  )));

  // Bottom border
  lines.push(chalk.cyan(hLine('╚', '═', '╝')));

  return lines.join('\n');
}

function renderAgentLine(agent: AgentName, progress: PipelineProgress): { colored: string; rawLen: number } {
  const icon = statusIcon(agent, progress);
  const status = agentStatusText(agent, progress);
  const coloredName = colorAgent(agent);
  const ansiOverhead = coloredName.length - agent.length;
  // Pad the colored name so the visible width is 18 chars
  const colored = ` ${icon} ${coloredName.padEnd(18 + ansiOverhead)}${status ? '  ' + status : ''}`;
  // rawLen: icon(1) + space(1) + agentPadded(18) + optional status
  const rawLen = 1 + 1 + 18 + (status ? 2 + stripAnsi(status).length : 0);
  return { colored, rawLen };
}

function renderEventLine(evt: AgentEvent): { colored: string; rawLen: number } {
  const time = new Date(evt.timestamp).toISOString().slice(11, 19);
  let icon: string;
  let detail: string;
  let rawDetail: string;

  switch (evt.event) {
    case 'started':
      icon = chalk.yellow('▸');
      detail = `${colorAgent(evt.agent)} started`;
      rawDetail = `${evt.agent} started`;
      break;
    case 'completed': {
      icon = chalk.green('✓');
      const dur = evt.duration ? formatDuration(evt.duration) : '';
      const cost = evt.cost !== undefined ? `$${evt.cost.toFixed(2)}` : '';
      const meta = [dur, cost].filter(Boolean).join(', ');
      detail = `${colorAgent(evt.agent)} completed${meta ? ` (${meta})` : ''}`;
      rawDetail = `${evt.agent} completed${meta ? ` (${meta})` : ''}`;
      break;
    }
    case 'failed':
      icon = chalk.red('✗');
      detail = `${chalk.red(evt.agent)} failed`;
      rawDetail = `${evt.agent} failed`;
      break;
    case 'skipped':
      icon = chalk.dim('⊘');
      detail = `${chalk.dim(evt.agent)} skipped`;
      rawDetail = `${evt.agent} skipped`;
      break;
  }

  const colored = `${chalk.gray(time)}  ${icon} ${detail}`;
  const rawLen = time.length + 2 + 1 + 1 + rawDetail.length;
  return { colored, rawLen };
}

// =============================================================================
// Completion Screen
// =============================================================================

function renderCompletionScreen(progress: PipelineProgress, input: PipelineInput): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.cyan(hLine('╔', '═', '╗')));
  lines.push(chalk.cyan(padLine(chalk.bold.green('PIPELINE COMPLETE'), 'PIPELINE COMPLETE'.length)));
  lines.push(chalk.cyan(hLine('╠', '═', '╣')));

  const elapsed = formatDuration(progress.elapsedMs);
  const summaryLines = [
    ['Target', input.target],
    ['Status', progress.status === 'completed' ? chalk.green('completed') : chalk.red(progress.status)],
    ['Duration', elapsed],
    ['Total Cost', `$${progress.totalCost.toFixed(2)}`],
    ['Completed', `${progress.completedAgents.length} agents`],
    ['Failed', `${progress.failedAgents.length} agents`],
    ['Skipped', `${progress.skippedAgents.length} agents`],
  ];

  for (const [label, value] of summaryLines) {
    const raw = `  ${label!.padEnd(14)}${stripAnsi(value!)}`;
    lines.push(chalk.cyan(padLine(
      `  ${chalk.bold(label!.padEnd(14))}${value}`,
      raw.length,
    )));
  }

  if (progress.errors.length > 0) {
    lines.push(chalk.cyan(emptyLine()));
    lines.push(chalk.cyan(padLine(chalk.bold.red('Errors:'), 'Errors:'.length)));
    for (const err of progress.errors.slice(0, 5)) {
      const truncated = err.length > 54 ? err.slice(0, 54) + '...' : err;
      lines.push(chalk.cyan(padLine(`  ${chalk.red(truncated)}`, 2 + truncated.length)));
    }
  }

  // Agent results table
  lines.push(chalk.cyan(emptyLine()));
  lines.push(chalk.cyan(padLine(chalk.bold('Agent Results:'), 'Agent Results:'.length)));
  for (const agent of ALL_AGENTS) {
    const metrics = progress.agentMetrics.find((m) => m.agent === agent);
    const icon = statusIcon(agent, progress);
    if (metrics) {
      const dur = formatDuration(metrics.duration);
      const cost = `$${metrics.cost.toFixed(2)}`;
      const raw = ` X ${agent.padEnd(20)}${dur.padEnd(10)}${cost}`;
      lines.push(chalk.cyan(padLine(
        ` ${icon} ${colorAgent(agent).padEnd(20 + (colorAgent(agent).length - agent.length))}${dur.padEnd(10)}${cost}`,
        raw.length,
      )));
    } else {
      const raw = ` X ${agent}`;
      lines.push(chalk.cyan(padLine(` ${icon} ${colorAgent(agent)}`, raw.length)));
    }
  }

  lines.push(chalk.cyan(hLine('╚', '═', '╝')));
  lines.push('');

  return lines.join('\n');
}

// =============================================================================
// ANSI Helpers
// =============================================================================

/** Strip ANSI escape codes for length calculation. */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/** Enter alternate screen buffer and hide cursor. */
function enterAltScreen(): void {
  process.stdout.write('\x1b[?1049h');
  process.stdout.write('\x1b[?25l');
}

/** Exit alternate screen buffer and show cursor. */
function exitAltScreen(): void {
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\x1b[?1049l');
}

/** Move cursor to home position. */
function cursorHome(): void {
  process.stdout.write('\x1b[H');
}

/** Clear from cursor to end of screen. */
function clearToEnd(): void {
  process.stdout.write('\x1b[J');
}

// =============================================================================
// Main Dashboard Entry Point
// =============================================================================

export async function startDashboard(
  handle: DashboardHandle,
  input: PipelineInput,
): Promise<PipelineState | null> {
  let detached = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let lastProgress: PipelineProgress | null = null;

  // Set up clean exit
  const cleanup = () => {
    if (pollTimer) clearInterval(pollTimer);
    exitAltScreen();
  };

  const onSigInt = () => {
    detached = true;
    cleanup();
    console.log('');
    console.log(chalk.yellow('[Inkrypt] Detached from dashboard. Workflow continues in background.'));
    console.log(chalk.dim(`[Inkrypt] Workflow ID: ${handle.workflowId}`));
    console.log(chalk.dim(`[Inkrypt] Query progress: ./inkrypt query ID=${handle.workflowId}`));
    console.log('');
    process.exit(0);
  };

  process.on('SIGINT', onSigInt);

  enterAltScreen();

  // Poll and render loop
  pollTimer = setInterval(async () => {
    try {
      lastProgress = await handle.query<PipelineProgress>(getProgress);
      cursorHome();
      process.stdout.write(renderFrame(lastProgress, input));
      clearToEnd();
    } catch {
      // Query may fail during workflow transitions — silently retry
    }
  }, POLL_INTERVAL_MS);

  // Render initial frame immediately
  try {
    lastProgress = await handle.query<PipelineProgress>(getProgress);
    cursorHome();
    process.stdout.write(renderFrame(lastProgress, input));
    clearToEnd();
  } catch {
    // Workflow may not have started yet
    cursorHome();
    process.stdout.write(chalk.yellow('\n  Waiting for workflow to start...\n'));
  }

  // Wait for workflow completion
  try {
    const result = await handle.result();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;

    // Final query to get complete progress
    try {
      lastProgress = await handle.query<PipelineProgress>(getProgress);
    } catch {
      // Use last known progress
    }

    if (!detached && lastProgress) {
      exitAltScreen();
      console.log(renderCompletionScreen(lastProgress, input));
    }

    process.removeListener('SIGINT', onSigInt);
    return result;
  } catch (err) {
    cleanup();
    process.removeListener('SIGINT', onSigInt);

    // Final query to show failure state
    try {
      lastProgress = await handle.query<PipelineProgress>(getProgress);
      if (lastProgress) {
        console.log(renderCompletionScreen(lastProgress, input));
      }
    } catch {
      // Ignore
    }

    throw err;
  }
}
