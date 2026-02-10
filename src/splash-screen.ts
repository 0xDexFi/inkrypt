// =============================================================================
// Inkrypt - Splash Screen
// ASCII art banner and version display
// =============================================================================

import chalk from 'chalk';

/**
 * Display the Inkrypt splash screen.
 */
export function showSplashScreen(): void {
  const banner = `
  ${chalk.cyan.bold('██╗███╗   ██╗██╗  ██╗██████╗ ██╗   ██╗██████╗ ████████╗')}
  ${chalk.cyan.bold('██║████╗  ██║██║ ██╔╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝')}
  ${chalk.cyan.bold('██║██╔██╗ ██║█████╔╝ ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ')}
  ${chalk.cyan.bold('██║██║╚██╗██║██╔═██╗ ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║   ')}
  ${chalk.cyan.bold('██║██║ ╚████║██║  ██╗██║  ██║   ██║   ██║        ██║   ')}
  ${chalk.cyan.bold('╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝   ')}
`;

  console.log(banner);
  console.log(chalk.dim('  Autonomous System & SSH Penetration Testing Framework'));
  console.log(chalk.dim('  ====================================================='));
  console.log('');
  console.log(`  ${chalk.bold('Version:')}  1.0.0`);
  console.log(`  ${chalk.bold('Engine:')}   Claude Agent SDK`);
  console.log(`  ${chalk.bold('License:')}  AGPL-3.0`);
  console.log('');
}
