/**
 * DeployHQ MCP Server Entry Point
 * Express server with SSE and HTTP transports for hosting on Digital Ocean App Platform
 */

import express from 'express';
import dotenv from 'dotenv';
import { log } from './utils/logger.js';
import { tools } from './tools.js';
import { setupSSERoutes } from './transports/sse-handler.js';
import { setupHTTPRoutes } from './transports/http-handler.js';

// Load environment variables
dotenv.config();

/**
 * Main application
 */
async function main(): Promise<void> {
  try {
    // Create Express app
    const app = express();
    const port = parseInt(process.env.PORT || '8080', 10);

    // Enable CORS for all routes
    app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-DeployHQ-Username, X-DeployHQ-Password, X-DeployHQ-Account');
      next();
    });

    // Handle OPTIONS preflight
    app.options('*', (_req, res) => {
      res.sendStatus(200);
    });

    // Parse JSON request bodies
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'deployhq-mcp-server',
        version: '1.0.0',
      });
    });

    // Tools listing endpoint
    app.get('/tools', (_req, res) => {
      res.json({
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        count: tools.length,
      });
    });

    // Setup transport routes
    setupSSERoutes(app);
    setupHTTPRoutes(app);

    // Start server
    app.listen(port, () => {
      log.info(`Server running on port ${port}`);
      log.info(`Health check: http://localhost:${port}/health`);
      log.info(`SSE endpoint: http://localhost:${port}/sse`);
      log.info(`HTTP transport: http://localhost:${port}/mcp`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      log.info(`Received ${signal}, shutting down gracefully`);
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
