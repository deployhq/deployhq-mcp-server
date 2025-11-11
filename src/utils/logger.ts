/**
 * Shared logger utility
 * IMPORTANT: For stdio transport, all logs must go to stderr (not stdout)
 * stdout is reserved exclusively for JSON-RPC messages
 */

type LogLevel = 'ERROR' | 'INFO' | 'DEBUG';

/**
 * Get current log level from environment
 * Defaults to INFO
 */
function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  if (level === 'ERROR' || level === 'INFO' || level === 'DEBUG') {
    return level;
  }
  return 'INFO';
}

/**
 * Check if a log level should be displayed
 */
function shouldLog(messageLevel: LogLevel): boolean {
  const currentLevel = getLogLevel();
  const levels: Record<LogLevel, number> = {
    ERROR: 0,
    INFO: 1,
    DEBUG: 2,
  };
  return levels[messageLevel] <= levels[currentLevel];
}

/**
 * Format log message
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${level}] ${timestamp} - ${message}`;
}

export const log = {
  error: (message: string, ...args: unknown[]): void => {
    if (shouldLog('ERROR')) {
      console.error(formatMessage('ERROR', message), ...args);
    }
  },
  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('INFO')) {
      console.error(formatMessage('INFO', message), ...args);
    }
  },
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('DEBUG')) {
      console.error(formatMessage('DEBUG', message), ...args);
    }
  },
};
