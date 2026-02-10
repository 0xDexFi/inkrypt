// =============================================================================
// Inkrypt - Prompt Manager
// Loads and renders prompt templates with variable substitution
// =============================================================================

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { PromptName } from '../types/agents.js';

/**
 * Template variables available for prompt rendering.
 */
interface PromptVariables {
  target: string;
  sshUser?: string;
  sshPort?: string;
  sshKeyPath?: string;
  scope?: string;
  outputDir: string;
  configContext?: string;
  sshInstructions?: string;
  terminalAgent?: string;
}

/**
 * Load and render a prompt template with variable substitution.
 */
export async function loadPromptTemplate(
  promptName: PromptName,
  variables: PromptVariables,
): Promise<string> {
  const promptPath = resolvePromptPath(promptName);

  if (!existsSync(promptPath)) {
    throw new Error(`Prompt template not found: ${promptPath}`);
  }

  let template = readFileSync(promptPath, 'utf-8');

  // Load shared sections
  template = injectSharedSections(template);

  // Substitute variables
  template = substituteVariables(template, variables);

  return template;
}

/**
 * Resolve the file path for a prompt template.
 */
function resolvePromptPath(promptName: PromptName): string {
  // Check for pipeline-testing variant first
  const pipelineTestingPath = join(
    process.cwd(),
    'prompts',
    'pipeline-testing',
    `${promptName}.txt`,
  );

  if (process.env['INKRYPT_PIPELINE_TESTING'] === 'true' && existsSync(pipelineTestingPath)) {
    return pipelineTestingPath;
  }

  return join(process.cwd(), 'prompts', `${promptName}.txt`);
}

/**
 * Inject shared sections into the template.
 */
function injectSharedSections(template: string): string {
  // Replace <!-- INCLUDE:filename --> directives
  const includePattern = /<!-- INCLUDE:(\S+) -->/g;
  return template.replace(includePattern, (_, filename) => {
    const sharedPath = join(process.cwd(), 'prompts', 'shared', filename);
    if (existsSync(sharedPath)) {
      return readFileSync(sharedPath, 'utf-8');
    }
    return `<!-- INCLUDE:${filename} not found -->`;
  });
}

/**
 * Substitute template variables.
 */
function substituteVariables(template: string, variables: PromptVariables): string {
  const replacements: Record<string, string> = {
    '{{TARGET}}': variables.target,
    '{{TARGET_HOST}}': variables.target,
    '{{SSH_USER}}': variables.sshUser ?? 'N/A',
    '{{SSH_PORT}}': variables.sshPort ?? '22',
    '{{SSH_KEY_PATH}}': variables.sshKeyPath ?? 'N/A',
    '{{SCOPE}}': variables.scope ?? variables.target,
    '{{OUTPUT_DIR}}': variables.outputDir,
    '{{CONFIG_CONTEXT}}': variables.configContext ?? 'No additional configuration provided.',
    '{{SSH_INSTRUCTIONS}}': variables.sshInstructions ?? 'No SSH credentials available.',
    '{{TERMINAL_AGENT}}': variables.terminalAgent ?? 'default',
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replaceAll(placeholder, value);
  }

  return result;
}
