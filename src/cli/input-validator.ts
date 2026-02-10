// =============================================================================
// Inkrypt - Input Validator
// Validates CLI input parameters
// =============================================================================

import { existsSync } from 'fs';

/**
 * Validate target format (IP address or hostname).
 */
export function validateTarget(target: string): { valid: boolean; error?: string } {
  if (!target || target.trim().length === 0) {
    return { valid: false, error: 'Target is required' };
  }

  // IPv4 address
  const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipv4Regex.test(target)) {
    const parts = target.split('.').map(Number);
    if (parts.every((p) => p !== undefined && p >= 0 && p <= 255)) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid IPv4 address' };
  }

  // IPv6 address (basic check)
  if (target.includes(':') && /^[0-9a-fA-F:]+$/.test(target)) {
    return { valid: true };
  }

  // Hostname
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (hostnameRegex.test(target)) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid target format. Use an IP address or hostname.' };
}

/**
 * Validate SSH port number.
 */
export function validatePort(port: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { valid: false, error: 'Port must be between 1 and 65535' };
  }
  return { valid: true };
}

/**
 * Validate SSH key path exists.
 */
export function validateKeyPath(keyPath: string): { valid: boolean; error?: string } {
  if (!existsSync(keyPath)) {
    return { valid: false, error: `SSH key not found: ${keyPath}` };
  }
  return { valid: true };
}

/**
 * Validate CIDR scope format.
 */
export function validateScope(scope: string): { valid: boolean; error?: string } {
  const cidrRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(scope)) {
    return { valid: false, error: 'Invalid CIDR format. Use format: 192.168.1.0/24' };
  }

  const prefix = parseInt(scope.split('/')[1]!, 10);
  if (prefix < 0 || prefix > 32) {
    return { valid: false, error: 'CIDR prefix must be between 0 and 32' };
  }

  return { valid: true };
}

/**
 * Validate config file path.
 */
export function validateConfigPath(configPath: string): { valid: boolean; error?: string } {
  if (!existsSync(configPath)) {
    return { valid: false, error: `Config file not found: ${configPath}` };
  }

  if (!configPath.endsWith('.yaml') && !configPath.endsWith('.yml')) {
    return { valid: false, error: 'Config file must be a YAML file (.yaml or .yml)' };
  }

  return { valid: true };
}
