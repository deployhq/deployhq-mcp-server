/**
 * HTTP Transport Handler
 * Handles JSON-RPC over HTTP for MCP
 */

import { Express } from 'express';
import { DeployHQClient } from '../api-client.js';
import { log } from '../utils/logger.js';
import { ServerConfig } from '../config.js';
import {
  tools,
  ListProjectsSchema,
  GetProjectSchema,
  ListServersSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
  GetDeploymentLogSchema,
  CreateDeploymentSchema,
  ListSshKeysSchema,
  ListGlobalEnvironmentVariablesSchema,
  CreateGlobalEnvironmentVariableSchema,
  UpdateGlobalEnvironmentVariableSchema,
  DeleteGlobalEnvironmentVariableSchema,
  ListGlobalConfigFilesSchema,
  GetGlobalConfigFileSchema,
  CreateGlobalConfigFileSchema,
  UpdateGlobalConfigFileSchema,
  DeleteGlobalConfigFileSchema,
} from '../tools.js';

/**
 * Setup HTTP transport routes for MCP protocol
 */
export function setupHTTPRoutes(app: Express, config: ServerConfig): void {
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
              if (config.readOnlyMode) {
                log.info('⚠️  Deployment creation blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Deployment creation is disabled for security.\n\n' +
                  'To enable deployments:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental deployments when using AI assistants.'
                );
              }

              const validatedArgs = CreateDeploymentSchema.parse(args);
              const { project, ...deploymentParams } = validatedArgs;
              result = await client.createDeployment(project, deploymentParams);
              break;
            }

            case 'get_deployment_log': {
              const validatedArgs = GetDeploymentLogSchema.parse(args);
              result = await client.getDeploymentLog(validatedArgs.project, validatedArgs.uuid);
              break;
            }

            case 'list_ssh_keys':
              ListSshKeysSchema.parse(args);
              result = await client.listSshKeys();
              break;

            case 'list_global_environment_variables':
              ListGlobalEnvironmentVariablesSchema.parse(args);
              result = await client.listGlobalEnvironmentVariables();
              break;

            case 'create_global_environment_variable': {
              if (config.readOnlyMode) {
                log.info('⚠️  Global environment variable creation blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Global environment variable creation is disabled for security.\n\n' +
                  'To enable mutations:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental changes when using AI assistants.'
                );
              }
              const validatedArgs = CreateGlobalEnvironmentVariableSchema.parse(args);
              result = await client.createGlobalEnvironmentVariable(validatedArgs);
              break;
            }

            case 'update_global_environment_variable': {
              if (config.readOnlyMode) {
                log.info('⚠️  Global environment variable update blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Global environment variable updates are disabled for security.\n\n' +
                  'To enable mutations:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental changes when using AI assistants.'
                );
              }
              const validatedArgs = UpdateGlobalEnvironmentVariableSchema.parse(args);
              const { id, ...updateParams } = validatedArgs;
              result = await client.updateGlobalEnvironmentVariable(id, updateParams);
              break;
            }

            case 'delete_global_environment_variable': {
              if (config.readOnlyMode) {
                log.info('⚠️  Global environment variable deletion blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Global environment variable deletion is disabled for security.\n\n' +
                  'To enable mutations:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental changes when using AI assistants.'
                );
              }
              const validatedArgs = DeleteGlobalEnvironmentVariableSchema.parse(args);
              result = await client.deleteGlobalEnvironmentVariable(validatedArgs.id);
              break;
            }

            case 'list_global_config_files':
              ListGlobalConfigFilesSchema.parse(args);
              result = await client.listGlobalConfigFiles();
              break;

            case 'get_global_config_file': {
              const validatedArgs = GetGlobalConfigFileSchema.parse(args);
              result = await client.getGlobalConfigFile(validatedArgs.id);
              break;
            }

            case 'create_global_config_file': {
              if (config.readOnlyMode) {
                log.info('⚠️  Global config file creation blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Global config file creation is disabled for security.\n\n' +
                  'To enable mutations:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental changes when using AI assistants.'
                );
              }
              const validatedArgs = CreateGlobalConfigFileSchema.parse(args);
              result = await client.createGlobalConfigFile(validatedArgs);
              break;
            }

            case 'update_global_config_file': {
              if (config.readOnlyMode) {
                log.info('⚠️  Global config file update blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Global config file updates are disabled for security.\n\n' +
                  'To enable mutations:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental changes when using AI assistants.'
                );
              }
              const validatedArgs = UpdateGlobalConfigFileSchema.parse(args);
              const { id, ...updateParams } = validatedArgs;
              result = await client.updateGlobalConfigFile(id, updateParams);
              break;
            }

            case 'delete_global_config_file': {
              if (config.readOnlyMode) {
                log.info('⚠️  Global config file deletion blocked by read-only mode');
                throw new Error(
                  'FORBIDDEN: Server is running in read-only mode. ' +
                  'Global config file deletion is disabled for security.\n\n' +
                  'To enable mutations:\n' +
                  '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
                  '- Or use CLI flag: --read-only=false\n\n' +
                  'Read-only mode is enabled by default to prevent ' +
                  'accidental changes when using AI assistants.'
                );
              }
              const validatedArgs = DeleteGlobalConfigFileSchema.parse(args);
              result = await client.deleteGlobalConfigFile(validatedArgs.id);
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
