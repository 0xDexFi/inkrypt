// =============================================================================
// Inkrypt - CLI User Interface
// Terminal UI components and status display
// =============================================================================

import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Display a styled info box.
 */
export function showInfoBox(title: string, content: string): void {
  console.log(
    boxen(content, {
      title,
      titleAlignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }),
  );
}

/**
 * Display a styled error box.
 */
export function showErrorBox(title: string, content: string): void {
  console.log(
    boxen(content, {
      title,
      titleAlignment: 'center',
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'red',
    }),
  );
}

/**
 * Display a progress line.
 */
export function showProgress(phase: string, agent: string, status: string): void {
  const statusIcon = status === 'running' ? chalk.yellow('~') :
    status === 'done' ? chalk.green('+') :
    status === 'fail' ? chalk.red('x') : chalk.gray('.');

  console.log(`  ${statusIcon} ${chalk.bold(phase)} > ${agent}`);
}

/**
 * Display target information.
 */
export function showTargetInfo(
  target: string,
  sshUser?: string,
  sshPort?: number,
  scope?: string,
): void {
  const lines = [
    `${chalk.bold('Target:')}  ${chalk.cyan(target)}`,
  ];

  if (sshUser) lines.push(`${chalk.bold('SSH:')}     ${sshUser}@${target}:${sshPort ?? 22}`);
  if (scope) lines.push(`${chalk.bold('Scope:')}   ${scope}`);

  showInfoBox('Inkrypt Target', lines.join('\n'));
}
