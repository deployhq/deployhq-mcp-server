/**
 * HTTP Transport Handler
 * Handles JSON-RPC over HTTP for MCP
 */

import { Express } from 'express';
import { DeployHQClient } from '../api-client.js';
import { log } from '../utils/logger.js';
import {
  tools,
  ListProjectsSchema,
  GetProjectSchema,
  ListServersSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
  CreateDeploymentSchema,
} from '../tools.js';

/**
 * Setup HTTP transport routes for MCP protocol
 */
export function setupHTTPRoutes(app: Express): void {
  // HTTP transport endpoint for MCP (JSON-RPC over HTTP)
  app.post('/mcp', async (req, res) => {
    log.info('New HTTP transport request');

    // Extract credentials from custom headers
    const username = req.headers['x-deployhq-email'] as string || process.env.DEPLOYHQ_EMAIL;
    const password = req.headers['x-deployhq-api-key'] as string || process.env.DEPLOYHQ_API_KEY;
    const account = req.headers['x-deployhq-account'] as string || process.env.DEPLOYHQ_ACCOUNT;

    // Validate credentials
    if (!username || !password || !account) {
      log.error('Missing credentials in request headers');
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Missing credentials in request headers',
        },
        id: req.body?.id || null,
      });
      return;
    }

    log.info(`Processing HTTP request for account: ${account} (user: ${username})`);

    try {
      // Create DeployHQ client with user credentials
      const client = new DeployHQClient({
        username,
        password,
        account,
        timeout: 30000,
      });

      const { jsonrpc, method, params, id } = req.body;

      // Validate JSON-RPC request
      if (jsonrpc !== '2.0') {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0"',
          },
          id: id || null,
        });
        return;
      }

      let result: unknown;

      // Handle different MCP methods
      switch (method) {
        case 'initialize':
          log.debug('Handling initialize request');
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'deployhq-mcp-server',
              version: '1.0.0',
            },
          };
          break;

        case 'tools/list':
          log.debug('Handling tools/list request');
          result = { tools };
          break;

        case 'tools/call': {
          const { name, arguments: args } = params;
          log.info(`Calling tool: ${name}`);

          switch (name) {
            case 'list_projects':
              ListProjectsSchema.parse(args);
              result = await client.listProjects();
              break;

            case 'get_project': {
              const validatedArgs = GetProjectSchema.parse(args);
              result = await client.getProject(validatedArgs.permalink);
              break;
            }

            case 'list_servers': {
              const validatedArgs = ListServersSchema.parse(args);
              result = await client.listServers(validatedArgs.project);
              break;
            }

            case 'list_deployments': {
              const validatedArgs = ListDeploymentsSchema.parse(args);
              result = await client.listDeployments(
                validatedArgs.project,
                validatedArgs.page,
                validatedArgs.server_uuid
              );
              break;
            }

            case 'get_deployment': {
              const validatedArgs = GetDeploymentSchema.parse(args);
              result = await client.getDeployment(validatedArgs.project, validatedArgs.uuid);
              break;
            }

            case 'create_deployment': {
              const validatedArgs = CreateDeploymentSchema.parse(args);
              const { project, ...deploymentParams } = validatedArgs;
              result = await client.createDeployment(project, deploymentParams);
              break;
            }

            default:
              throw new Error(`Unknown tool: ${name}`);
          }

          // Wrap tool result in MCP format
          result = {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
          break;
        }

        default:
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
            id: id || null,
          });
          return;
      }

      // Send successful response
      res.json({
        jsonrpc: '2.0',
        result,
        id,
      });
    } catch (error) {
      log.error('Error processing HTTP request:', error);

      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: {
            details: (error as Error).message,
          },
        },
        id: req.body?.id || null,
      });
    }
  });
}
