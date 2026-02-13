// =============================================================================
// Inkrypt - Splash Screen
// Cyberpunk ASCII art banner with gradient colors and system readout
// =============================================================================

import chalk from 'chalk';
import gradient from 'gradient-string';

// Custom cyberpunk gradient: red -> magenta -> purple -> blue -> cyan
const cyberGradient = gradient(['#ff0040', '#ff00ff', '#8000ff', '#0080ff', '#00ffff']);
const dimGradient = gradient(['#660022', '#660066', '#330066', '#003366', '#006666']);
const warningGradient = gradient(['#ff0000', '#ff4400', '#ff8800', '#ffcc00']);

/**
 * Display the Inkrypt splash screen.
 */
export async function showSplashScreen(): Promise<void> {
  try {
    console.clear();

    // System boot lines
    console.log('');
    console.log(chalk.gray('  [sys] ') + chalk.dim.green('Establishing encrypted channel...'));
    await delay(200);
    console.log(chalk.gray('  [sys] ') + chalk.dim.green('Loading exploit modules...'));
    await delay(150);
    console.log(chalk.gray('  [sys] ') + chalk.dim.green('Initializing agent framework...'));
    await delay(150);
    console.log('');

    // Main ASCII art with gradient
    const logo = [
      '       ██▓ ███▄    █  ██ ▄█▀ ██▀███   ▓██   ██▓ ██▓███  ▄▄▄█████▓ ',
      '      ▓██▒ ██ ▀█   █  ██▄█▒ ▓██ ▒ ██▒ ▒██  ██▒ ▓██▒  ██▒▓  ██▒ ▓▒ ',
      '      ▒██▒▓██  ▀█ ██▒▓███▄░ ▓██ ░▄█ ▒  ▒██ ██░ ▓██ ░▄█ ▒▒ ▓██░ ▒░ ',
      '      ░██░▓██▒  ▐▌██▒▓██ █▄ ▒██▀▀█▄    ░ ▐██▓░ ▒██▀▀█▄  ░ ▓██▓ ░  ',
      '      ░██░▒██░   ▓██░▒██▒ █▄░██▓ ▒██▒  ░ ██▒▓░ ░██▓ ▒██▒  ▒██▒ ░  ',
      '      ░▓  ░ ▒░   ▒ ▒ ▒ ▒▒ ▓▒░ ▒▓ ░▒▓░   ██▒▒▒  ░ ▒▓ ░▒▓░  ▒ ░░   ',
      '       ▒ ░ ░░   ░ ▒░░ ░▒ ▒░  ░▒ ░ ▒░  ▓██ ░▒░    ░▒ ░ ▒░    ░     ',
      '       ▒ ░  ░   ░ ░ ░ ░░ ░   ░░   ░   ▒ ▒ ░░     ░░   ░   ░       ',
      '       ░          ░ ░  ░       ░        ░ ░          ░               ',
      '                              ░                                      ',
    ];

    // Print each logo line with gradient
    for (const line of logo) {
      console.log('  ' + cyberGradient(line));
    }

    console.log('');

    // Decorative separator
    const separator = '  ' + dimGradient('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(separator);
    console.log('');

    // Skull icon + tagline
    const skull = chalk.hex('#ff0040')('  ☠');
    const tagline = chalk.bold.white(' AUTONOMOUS SYSTEM & SSH PENETRATION TESTING FRAMEWORK');
    console.log(skull + tagline);
    console.log('');

    // System info block
    const infoLines = [
      [chalk.hex('#ff00ff')('  ┌─'), chalk.hex('#ff00ff').bold(' SYSTEM '), chalk.hex('#ff00ff')('─────────────────────────────────────────────────────────┐')],
      [chalk.hex('#ff00ff')('  │'), chalk.gray('  Engine    '), chalk.dim('│'), chalk.white(' Claude Agent SDK + Temporal Orchestration'), padRight('', 17), chalk.hex('#ff00ff')('│')],
      [chalk.hex('#ff00ff')('  │'), chalk.gray('  Agents    '), chalk.dim('│'), chalk.white(' 17 Specialized AI Agents, 7 Pipelined Domains'), padRight('', 12), chalk.hex('#ff00ff')('│')],
      [chalk.hex('#ff00ff')('  │'), chalk.gray('  Toolkit   '), chalk.dim('│'), chalk.white(' Metasploit, Nmap, Hydra, Nuclei, Impacket, 30+'), padRight('', 11), chalk.hex('#ff00ff')('│')],
      [chalk.hex('#ff00ff')('  │'), chalk.gray('  Status    '), chalk.dim('│'), warningGradient(' ■ ■ ■  ARMED & READY'), padRight('', 37), chalk.hex('#ff00ff')('│')],
      [chalk.hex('#ff00ff')('  └──────────────────────────────────────────────────────────────────────┘')],
    ];

    for (const parts of infoLines) {
      console.log(parts.join(''));
    }

    console.log('');

    // Loading animation
    const loadingFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        process.stdout.write(
          `\r  ${chalk.hex('#00ffff')(loadingFrames[frameIndex % loadingFrames.length]!)} ${chalk.dim('Connecting to Temporal orchestration engine...')}`
        );
        frameIndex++;
      }, 80);

      setTimeout(() => {
        clearInterval(interval);
        process.stdout.write(
          `\r  ${chalk.hex('#00ff00')('✓')} ${chalk.dim('Connected.                                      ')}\n\n`
        );
        resolve();
      }, 1500);
    });

  } catch {
    // Fallback
    console.log(chalk.hex('#ff0040').bold('\n  INKRYPT - Autonomous Penetration Testing Framework\n'));
  }
}

function padRight(str: string, len: number): string {
  return str + ' '.repeat(Math.max(0, len - str.length));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
