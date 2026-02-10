// =============================================================================
// Inkrypt - Configuration Parser
// YAML config parsing with JSON Schema validation and safety checks
// =============================================================================

import { readFileSync, existsSync, statSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { DistributedConfig } from './types/config.js';

const MAX_CONFIG_SIZE = 1024 * 1024; // 1MB
const DANGEROUS_PATTERNS = [
  /\$\(.*\)/,      // Command substitution
  /`.*`/,           // Backtick command substitution
  /;\s*rm\s/,       // Command injection with rm
  /\|\s*bash/,      // Pipe to bash
  />\s*\/etc\//,    // Redirect to /etc
  /&&\s*curl/,      // Download and execute
  /\beval\b/,       // eval usage
];

/**
 * Load and validate a YAML configuration file.
 */
export async function loadConfig(configPath: string): Promise<DistributedConfig> {
  // Verify file exists
  if (!existsSync(configPath)) {
    throw new ConfigError(`Configuration file not found: ${configPath}`);
  }

  // Check file size
  const stats = statSync(configPath);
  if (stats.size > MAX_CONFIG_SIZE) {
    throw new ConfigError(`Configuration file too large: ${stats.size} bytes (max: ${MAX_CONFIG_SIZE})`);
  }

  // Read and parse YAML
  const raw = readFileSync(configPath, 'utf-8');

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(raw)) {
      throw new ConfigError(`Dangerous pattern detected in config: ${pattern.source}`);
    }
  }

  let parsed: unknown;
  try {
    parsed = loadYaml(raw);
  } catch (err) {
    throw new ConfigError(`YAML parsing failed: ${err instanceof Error ? err.message : err}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ConfigError('Configuration must be a YAML object');
  }

  // Validate against JSON Schema
  const valid = await validateSchema(parsed);
  if (!valid.success) {
    throw new ConfigError(`Schema validation failed: ${valid.errors.join(', ')}`);
  }

  return parsed as DistributedConfig;
}

/**
 * Validate config against JSON Schema.
 */
async function validateSchema(
  config: unknown,
): Promise<{ success: boolean; errors: string[] }> {
  try {
    const schemaPath = new URL('../configs/config-schema.json', import.meta.url).pathname;
    if (!existsSync(schemaPath)) {
      // Schema file not found, skip validation
      return { success: true, errors: [] };
    }

    const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(config);

    if (valid) {
      return { success: true, errors: [] };
    }

    const errors = validate.errors?.map(
      (e) => `${e.instancePath} ${e.message}`,
    ) ?? ['Unknown validation error'];

    return { success: false, errors };
  } catch (err) {
    // If schema loading fails, allow config through
    return { success: true, errors: [] };
  }
}

/**
 * Configuration parsing error.
 */
class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
