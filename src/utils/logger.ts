/**
 * Shared logger utility
 * IMPORTANT: For stdio transport, all logs must go to stderr (not stdout)
 * stdout is reserved exclusively for JSON-RPC messages
 */

export const log = {
  info: (message: string, ...args: unknown[]): void => {
    console.error(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      console.error(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};
