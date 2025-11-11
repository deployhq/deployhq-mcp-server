#!/usr/bin/env node

/**
 * DeployHQ MCP Server - stdio Transport Entry Point
 * For use with Claude Code and other MCP clients via npx
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from './mcp-server.js';
import { log } from './utils/logger.js';

/**
 * Main stdio server entry point
 */
async function main(): Promise<void> {
  try {
    // Read credentials from environment variables
    const username = process.env.DEPLOYHQ_USERNAME;
    const password = process.env.DEPLOYHQ_PASSWORD;
    const account = process.env.DEPLOYHQ_ACCOUNT;

    // Validate required environment variables
    if (!username || !password || !account) {
      log.error('Missing required environment variables');
      log.error('Please set: DEPLOYHQ_USERNAME, DEPLOYHQ_PASSWORD, DEPLOYHQ_ACCOUNT');
      process.exit(1);
    }

    log.info('Starting DeployHQ MCP Server in stdio mode');
    log.debug(`Account: ${account}, Username: ${username}`);

    // Create MCP server with user credentials
    const server = createMCPServer(username, password, account);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    log.info('DeployHQ MCP Server running on stdio');
    log.debug('Ready to receive JSON-RPC messages');

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      log.info(`Received ${signal}, shutting down gracefully`);
      await server.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    log.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the application
main().catch((error) => {
  log.error('Unhandled error in main:', error);
  process.exit(1);
});
