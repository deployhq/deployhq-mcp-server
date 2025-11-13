/**
 * Configuration utilities for DeployHQ MCP Server
 * Handles parsing of environment variables and CLI flags
 */

export interface ServerConfig {
  /**
   * Read-only mode: when enabled, write operations (like create_deployment) are blocked
   * Default: true (read-only enabled by default for security)
   */
  readOnlyMode: boolean;
}

/**
 * Parse boolean values from environment variables and CLI flags
 * Accepts: "true", "false", "1", "0", "yes", "no" (case-insensitive)
 *
 * @param value - String value to parse
 * @returns boolean value, or undefined if not a recognized boolean
 */
function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;

  const normalized = value.toLowerCase().trim();

  // True values
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }

  // False values
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  return undefined;
}

/**
 * Parse read-only mode from CLI flags
 * Checks for --read-only or --read-only=value flags
 *
 * @returns boolean if flag is present, undefined otherwise
 */
function parseReadOnlyFlag(): boolean | undefined {
  const args = process.argv;

  // Check for --read-only flag (enables read-only mode)
  if (args.includes('--read-only')) {
    return true;
  }

  // Check for --read-only=value flag
  const flagWithValue = args.find(arg => arg.startsWith('--read-only='));
  if (flagWithValue) {
    const value = flagWithValue.split('=')[1];
    const parsed = parseBoolean(value);
    // If parsing fails, default to true (safer default)
    return parsed !== undefined ? parsed : true;
  }

  return undefined;
}

/**
 * Parse server configuration from environment variables and CLI flags
 *
 * Precedence (highest to lowest):
 * 1. CLI flags (--read-only)
 * 2. Environment variables (DEPLOYHQ_READ_ONLY)
 * 3. Default values (read-only mode enabled by default)
 *
 * @returns ServerConfig object with parsed configuration
 */
export function parseServerConfig(): ServerConfig {
  // Check CLI flag first (highest precedence)
  const cliFlag = parseReadOnlyFlag();
  if (cliFlag !== undefined) {
    return { readOnlyMode: cliFlag };
  }

  // Check environment variable
  const envVar = process.env.DEPLOYHQ_READ_ONLY;
  const envValue = parseBoolean(envVar);
  if (envValue !== undefined) {
    return { readOnlyMode: envValue };
  }

  // Default to read-only mode enabled (secure by default)
  return { readOnlyMode: true };
}

/**
 * Get a description of where the read-only mode setting came from
 * Useful for logging and debugging
 *
 * @returns string describing the source of the configuration
 */
export function getConfigSource(): string {
  const cliFlag = parseReadOnlyFlag();
  if (cliFlag !== undefined) {
    return 'CLI flag';
  }

  const envVar = process.env.DEPLOYHQ_READ_ONLY;
  if (envVar !== undefined) {
    return `DEPLOYHQ_READ_ONLY=${envVar}`;
  }

  return 'default';
}