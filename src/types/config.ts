// =============================================================================
// Inkrypt - Configuration Type Definitions
// =============================================================================

/**
 * Rule for scope definition - what to include/exclude from testing.
 */
export interface Rule {
  pattern: string;
  description?: string;
}

/**
 * Scope rules controlling what targets/services to test.
 */
export interface Rules {
  focus?: Rule[];
  avoid?: Rule[];
}

/**
 * SSH authentication configuration.
 */
export interface SSHAuthentication {
  type: 'password' | 'key' | 'agent' | 'none';
  username?: string;
  password?: string;
  privateKeyPath?: string;
  passphrase?: string;
  port?: number;
}

/**
 * Service-specific credentials for testing.
 */
export interface ServiceCredential {
  service: string;
  port: number;
  username?: string;
  password?: string;
  description?: string;
}

/**
 * Network scope configuration.
 */
export interface NetworkScope {
  cidr?: string;
  excludeHosts?: string[];
  excludePorts?: number[];
  maxScanRate?: number;
}

/**
 * Full Inkrypt distributed configuration.
 */
export interface DistributedConfig {
  target: string;
  ssh?: SSHAuthentication;
  credentials?: ServiceCredential[];
  network?: NetworkScope;
  rules?: Rules;
  scanOptions?: {
    aggressive?: boolean;
    udpScan?: boolean;
    osDetection?: boolean;
    serviceVersioning?: boolean;
    scriptScan?: boolean;
    timing?: 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';
  };
  customCommands?: {
    preRecon?: string[];
    postRecon?: string[];
  };
}
