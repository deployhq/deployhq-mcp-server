/**
 * DeployHQ MCP Server Entry Point
 * Express server with SSE transport for hosting on Digital Ocean App Platform
 */

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DeployHQClient } from './api-client.js';
import {
  tools,
  ListProjectsSchema,
  GetProjectSchema,
  ListServersSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
  CreateDeploymentSchema,
} from './tools.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Logger utility
 */
const log = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};

/**
 * Creates the MCP server instance with per-request client initialization
 */
function createMCPServer(
  username: string,
  password: string,
  account: string
): Server {
  // Create DeployHQ client with user credentials
  const client = new DeployHQClient({
    username,
    password,
    account,
    timeout: 30000,
  });

  const server = new Server(
    {
      name: 'deployhq-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    log.debug('Listing tools');
    return { tools };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log.info(`Calling tool: ${name}`);
    log.debug('Tool arguments:', JSON.stringify(args));

    try {
      let result: unknown;

      switch (name) {
        case 'list_projects': {
          ListProjectsSchema.parse(args);
          log.debug('Fetching projects from API...');
          result = await client.listProjects();
          log.debug(`Got ${Array.isArray(result) ? result.length : '?'} projects`);
          break;
        }

        case 'get_project': {
          const validatedArgs = GetProjectSchema.parse(args);
          log.debug(`Fetching project: ${validatedArgs.permalink}`);
          result = await client.getProject(validatedArgs.permalink);
          log.debug('Got project details');
          break;
        }

        case 'list_servers': {
          const validatedArgs = ListServersSchema.parse(args);
          log.debug(`Fetching servers for project: ${validatedArgs.project}`);
          result = await client.listServers(validatedArgs.project);
          log.debug(`Got ${Array.isArray(result) ? result.length : '?'} servers`);
          log.debug(`Result type: ${typeof result}, value: ${JSON.stringify(result)}`);
          break;
        }

        case 'list_deployments': {
          const validatedArgs = ListDeploymentsSchema.parse(args);
          log.debug(`Fetching deployments for project: ${validatedArgs.project}`);
          result = await client.listDeployments(
            validatedArgs.project,
            validatedArgs.page,
            validatedArgs.server_uuid
          );
          log.debug('Got deployments');
          break;
        }

        case 'get_deployment': {
          const validatedArgs = GetDeploymentSchema.parse(args);
          log.debug(`Fetching deployment: ${validatedArgs.uuid}`);
          result = await client.getDeployment(validatedArgs.project, validatedArgs.uuid);
          log.debug('Got deployment details');
          break;
        }

        case 'create_deployment': {
          const validatedArgs = CreateDeploymentSchema.parse(args);
          const { project, ...deploymentParams } = validatedArgs;
          log.debug(`Creating deployment for project: ${project}`);
          result = await client.createDeployment(project, deploymentParams);
          log.debug('Deployment created');
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      log.debug(`Tool ${name} completed successfully`);
      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
      log.debug(`Returning response with ${response.content[0].text.length} characters`);
      return response;
    } catch (error) {
      log.error(`Error executing tool ${name}:`, error);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: (error as Error).message,
                details: error instanceof Error ? error.stack : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

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

    // Store active transports by session ID
    const transports = new Map<string, SSEServerTransport>();

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

    // SSE endpoint for MCP - accepts credentials via headers
    app.get('/sse', async (req, res) => {
      log.info('New SSE connection');

      // Extract credentials from custom headers
      const username = req.headers['x-deployhq-username'] as string || process.env.DEPLOYHQ_USERNAME;
      const password = req.headers['x-deployhq-password'] as string || process.env.DEPLOYHQ_PASSWORD;
      const account = req.headers['x-deployhq-account'] as string || process.env.DEPLOYHQ_ACCOUNT;

      // Validate credentials
      if (!username || !password || !account) {
        log.error('Missing credentials in request headers');
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing required headers: X-DeployHQ-Username, X-DeployHQ-Password, X-DeployHQ-Account',
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
    app.post('/message', express.json(), async (req, res) => {
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

    // HTTP transport endpoint for MCP (JSON-RPC over HTTP)
    app.post('/mcp', express.json(), async (req, res) => {
      log.info('New HTTP transport request');

      // Extract credentials from custom headers
      const username = req.headers['x-deployhq-username'] as string || process.env.DEPLOYHQ_USERNAME;
      const password = req.headers['x-deployhq-password'] as string || process.env.DEPLOYHQ_PASSWORD;
      const account = req.headers['x-deployhq-account'] as string || process.env.DEPLOYHQ_ACCOUNT;

      // Validate credentials
      if (!username || !password || !account) {
        log.error('Missing credentials in request headers');
        res.status(401).json({
          error: 'Missing credentials in request headers',
        });
        return;
      }

      log.info(`Processing HTTP request for account: ${account} (user: ${username})`);

      try {
        // Create transport with JSON response mode (no SSE streaming)
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined, // Stateless mode
          enableJsonResponse: true, // Return JSON instead of SSE
        });

        // Create MCP server for this request
        const server = createMCPServer(username, password, account);

        // Connect server to transport
        await server.connect(transport);

        // Handle the request
        await transport.handleRequest(req, res, req.body);

        // Close connection after response
        await server.close();
      } catch (error) {
        log.error('Error processing HTTP transport request:', error);

        // Only send error response if headers not already sent
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error',
              data: {
                details: (error as Error).message,
              },
            },
            id: null,
          });
        }
      }
    });

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
