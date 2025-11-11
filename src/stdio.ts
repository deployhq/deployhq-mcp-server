#!/usr/bin/env node

/**
 * DeployHQ MCP Server - stdio Transport Entry Point
 * For use with Claude Code and other MCP clients via npx
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from './mcp-server.js';
import { DeployHQClient, AuthenticationError } from './api-client.js';
import { log } from './utils/logger.js';

/**
 * Main stdio server entry point
 */
async function main(): Promise<void> {
  try {
    // Read credentials from environment variables
    const email = process.env.DEPLOYHQ_EMAIL;
    const apiKey = process.env.DEPLOYHQ_API_KEY;
    const account = process.env.DEPLOYHQ_ACCOUNT;

    // Validate required environment variables
    if (!email || !apiKey || !account) {
      log.error('Missing required environment variables');
      log.error('Please set: DEPLOYHQ_EMAIL, DEPLOYHQ_API_KEY, DEPLOYHQ_ACCOUNT');
      process.exit(1);
    }

    log.info('Starting DeployHQ MCP Server in stdio mode');
    log.debug(`Account: ${account}, Email: ${email}`);

    // Validate credentials before starting server
    log.info('Validating credentials...');
    try {
      const testClient = new DeployHQClient({
        username: email,
        password: apiKey,
        account,
        timeout: 10000, // 10 second timeout for validation
      });
      await testClient.validateCredentials();
      log.info('✓ Credentials validated successfully');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        log.error('✗ Authentication failed: Invalid credentials or insufficient permissions');
        log.error('Please check your DEPLOYHQ_EMAIL and DEPLOYHQ_API_KEY');
        process.exit(1);
      }
      log.error('✗ Failed to validate credentials:', (error as Error).message);
      log.error('Please check your network connection and DeployHQ account settings');
      process.exit(1);
    }

    // Create MCP server with user credentials
    const server = createMCPServer(email, apiKey, account);

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
