/**
 * MCP Server Setup
 * Initializes and configures the Model Context Protocol server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DeployHQClient, DeployHQError } from './api-client.js';
import {
  tools,
  ListProjectsSchema,
  GetProjectSchema,
  ListServersSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
  CreateDeploymentSchema,
} from './tools.js';

/**
 * Logger utility
 */
const log = {
  info: (message: string, ...args: unknown[]) => {
    console.error(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
      console.error(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
};

/**
 * Creates and configures the MCP server
 * @param client - DeployHQ API client
 * @returns Configured MCP server instance
 */
export function createMCPServer(client: DeployHQClient): Server {
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

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    log.debug('Listing tools');
    return { tools };
  });

  /**
   * Handler for calling tools
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log.info(`Calling tool: ${name}`);
    log.debug('Tool arguments:', args);

    try {
      switch (name) {
        case 'list_projects': {
          const validatedArgs = ListProjectsSchema.parse(args);
          const projects = await client.listProjects();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(projects, null, 2),
              },
            ],
          };
        }

        case 'get_project': {
          const validatedArgs = GetProjectSchema.parse(args);
          const project = await client.getProject(validatedArgs.permalink);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(project, null, 2),
              },
            ],
          };
        }

        case 'list_servers': {
          const validatedArgs = ListServersSchema.parse(args);
          const servers = await client.listServers(validatedArgs.project);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(servers, null, 2),
              },
            ],
          };
        }

        case 'list_deployments': {
          const validatedArgs = ListDeploymentsSchema.parse(args);
          const deployments = await client.listDeployments(
            validatedArgs.project,
            validatedArgs.page,
            validatedArgs.server_uuid
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(deployments, null, 2),
              },
            ],
          };
        }

        case 'get_deployment': {
          const validatedArgs = GetDeploymentSchema.parse(args);
          const deployment = await client.getDeployment(
            validatedArgs.project,
            validatedArgs.uuid
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(deployment, null, 2),
              },
            ],
          };
        }

        case 'create_deployment': {
          const validatedArgs = CreateDeploymentSchema.parse(args);
          const { project, ...deploymentParams } = validatedArgs;
          const deployment = await client.createDeployment(project, deploymentParams);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(deployment, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      log.error(`Error executing tool ${name}:`, error);

      // Handle different error types
      if (error instanceof DeployHQError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.message,
                  statusCode: error.statusCode,
                  details: error.response,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Handle validation errors
      if ((error as Error).name === 'ZodError') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Invalid input parameters',
                  details: error,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Generic error handler
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'An unexpected error occurred',
                message: (error as Error).message,
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
 * Runs the MCP server with stdio transport
 * @param client - DeployHQ API client
 */
export async function runStdioServer(client: DeployHQClient): Promise<void> {
  const server = createMCPServer(client);
  const transport = new StdioServerTransport();

  log.info('Starting MCP server with stdio transport');

  await server.connect(transport);

  log.info('MCP server connected and running');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    log.info('Received SIGINT, shutting down gracefully');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log.info('Received SIGTERM, shutting down gracefully');
    await server.close();
    process.exit(0);
  });
}
