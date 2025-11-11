/**
 * SSE Transport Handler
 * Handles Server-Sent Events transport for MCP
 */

import { Express } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { log } from '../utils/logger.js';
import { createMCPServer } from '../mcp-server.js';

/**
 * Setup SSE routes for MCP protocol
 */
export function setupSSERoutes(app: Express): void {
  // Store active transports by session ID
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint for MCP - accepts credentials via headers
  app.get('/sse', async (req, res) => {
    log.info('New SSE connection');

    // Extract credentials from custom headers
    const username = req.headers['x-deployhq-email'] as string || process.env.DEPLOYHQ_EMAIL;
    const password = req.headers['x-deployhq-api-key'] as string || process.env.DEPLOYHQ_API_KEY;
    const account = req.headers['x-deployhq-account'] as string || process.env.DEPLOYHQ_ACCOUNT;

    // Validate credentials
    if (!username || !password || !account) {
      log.error('Missing credentials in request headers');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing required headers: X-DeployHQ-Email, X-DeployHQ-API-Key, X-DeployHQ-Account',
      });
      return;
    }

    log.info(`Creating MCP server for account: ${account} (user: ${username})`);

    try {
      const transport = new SSEServerTransport('/message', res);
      const server = createMCPServer(username, password, account);

      // Store transport for message routing
      transports.set(transport.sessionId, transport);
      log.debug(`Stored transport with session ID: ${transport.sessionId}`);

      await server.connect(transport);

      // Handle connection close
      req.on('close', () => {
        log.info('SSE connection closed');
        transports.delete(transport.sessionId);
        server.close().catch((error) => {
          log.error('Error closing server:', error);
        });
      });
    } catch (error) {
      log.error('Error creating MCP server:', error);
      res.status(500).json({
        error: 'Server initialization failed',
        message: (error as Error).message,
      });
    }
  });

  // POST endpoint for MCP messages (SSE transport)
  app.post('/message', async (req, res) => {
    // Extract session ID from query parameter (sent by SSE transport)
    const sessionId = req.query.sessionId as string;

    log.debug(`Received POST to /message with sessionId: ${sessionId}`);
    log.debug('Message body:', JSON.stringify(req.body));

    if (!sessionId) {
      log.error('No session ID provided in query parameter');
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      log.error(`No transport found for session ID: ${sessionId}`);
      log.debug(`Active sessions: ${Array.from(transports.keys()).join(', ')}`);
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      log.error('Error handling POST message:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  });
}
