/**
 * MCP Server Factory
 * Creates MCP server instances with per-request client initialization
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DeployHQClient } from './api-client.js';
import { log } from './utils/logger.js';
import { ServerConfig } from './config.js';
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
} from './tools.js';

/**
 * Creates the MCP server instance with per-request client initialization
 */
export function createMCPServer(
  username: string,
  password: string,
  account: string,
  config: ServerConfig = { readOnlyMode: false }
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
    // Redact sensitive fields before logging to prevent secret leaks
    const safeArgs = { ...args };
    if ('value' in safeArgs) (safeArgs as Record<string, unknown>).value = '[REDACTED]';
    if ('body' in safeArgs) (safeArgs as Record<string, unknown>).body = '[REDACTED]';
    log.debug('Tool arguments:', JSON.stringify(safeArgs));

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

        case 'get_deployment_log': {
          const validatedArgs = GetDeploymentLogSchema.parse(args);
          log.debug(`Fetching deployment log: ${validatedArgs.uuid}`);
          result = await client.getDeploymentLog(validatedArgs.project, validatedArgs.uuid);
          log.debug('Got deployment log');
          break;
        }

        case 'create_deployment': {
          // Check if server is in read-only mode
          if (config.readOnlyMode) {
            log.info('⚠️  Deployment creation blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Deployment creation is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental deployments when using AI assistants.'
            );
          }

          const validatedArgs = CreateDeploymentSchema.parse(args);
          const { project, ...deploymentParams } = validatedArgs;

          log.debug(`Creating deployment for project: ${project}`);
          result = await client.createDeployment(project, deploymentParams);
          log.debug('Deployment created');
          break;
        }

        case 'list_ssh_keys': {
          ListSshKeysSchema.parse(args);
          log.debug('Fetching SSH keys from API...');
          result = await client.listSshKeys();
          log.debug(`Got ${Array.isArray(result) ? result.length : '?'} SSH keys`);
          break;
        }

        case 'list_global_environment_variables': {
          ListGlobalEnvironmentVariablesSchema.parse(args);
          log.debug('Fetching global environment variables from API...');
          result = await client.listGlobalEnvironmentVariables();
          log.debug(`Got ${Array.isArray(result) ? result.length : '?'} global environment variables`);
          break;
        }

        case 'create_global_environment_variable': {
          if (config.readOnlyMode) {
            log.info('⚠️  Global environment variable creation blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Global environment variable creation is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental changes when using AI assistants.'
            );
          }

          const validatedArgs = CreateGlobalEnvironmentVariableSchema.parse(args);
          log.debug(`Creating global environment variable: ${validatedArgs.name}`);
          result = await client.createGlobalEnvironmentVariable(validatedArgs);
          log.debug('Global environment variable created');
          break;
        }

        case 'update_global_environment_variable': {
          if (config.readOnlyMode) {
            log.info('⚠️  Global environment variable update blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Global environment variable update is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental changes when using AI assistants.'
            );
          }

          const validatedArgs = UpdateGlobalEnvironmentVariableSchema.parse(args);
          const { id, ...updateParams } = validatedArgs;
          log.debug(`Updating global environment variable: ${id}`);
          result = await client.updateGlobalEnvironmentVariable(id, updateParams);
          log.debug('Global environment variable updated');
          break;
        }

        case 'delete_global_environment_variable': {
          if (config.readOnlyMode) {
            log.info('⚠️  Global environment variable deletion blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Global environment variable deletion is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental changes when using AI assistants.'
            );
          }

          const validatedArgs = DeleteGlobalEnvironmentVariableSchema.parse(args);
          log.debug(`Deleting global environment variable: ${validatedArgs.id}`);
          result = await client.deleteGlobalEnvironmentVariable(validatedArgs.id);
          log.debug('Global environment variable deleted');
          break;
        }

        case 'list_global_config_files': {
          ListGlobalConfigFilesSchema.parse(args);
          log.debug('Fetching global config files from API...');
          result = await client.listGlobalConfigFiles();
          log.debug(`Got ${Array.isArray(result) ? result.length : '?'} global config files`);
          break;
        }

        case 'get_global_config_file': {
          const validatedArgs = GetGlobalConfigFileSchema.parse(args);
          log.debug(`Fetching global config file: ${validatedArgs.id}`);
          result = await client.getGlobalConfigFile(validatedArgs.id);
          log.debug('Got global config file details');
          break;
        }

        case 'create_global_config_file': {
          if (config.readOnlyMode) {
            log.info('⚠️  Global config file creation blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Global config file creation is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental changes when using AI assistants.'
            );
          }

          const validatedArgs = CreateGlobalConfigFileSchema.parse(args);
          log.debug(`Creating global config file: ${validatedArgs.path}`);
          result = await client.createGlobalConfigFile(validatedArgs);
          log.debug('Global config file created');
          break;
        }

        case 'update_global_config_file': {
          if (config.readOnlyMode) {
            log.info('⚠️  Global config file update blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Global config file update is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental changes when using AI assistants.'
            );
          }

          const validatedArgs = UpdateGlobalConfigFileSchema.parse(args);
          const { id, ...updateParams } = validatedArgs;
          log.debug(`Updating global config file: ${id}`);
          result = await client.updateGlobalConfigFile(id, updateParams);
          log.debug('Global config file updated');
          break;
        }

        case 'delete_global_config_file': {
          if (config.readOnlyMode) {
            log.info('⚠️  Global config file deletion blocked by read-only mode');
            throw new Error(
              'FORBIDDEN: Server is running in read-only mode. ' +
              'Global config file deletion is disabled for security.\n\n' +
              'To disable read-only mode:\n' +
              '- Set environment variable: DEPLOYHQ_READ_ONLY=false\n' +
              '- Or use CLI flag: --read-only=false\n\n' +
              'Read-only mode can be enabled to prevent ' +
              'accidental changes when using AI assistants.'
            );
          }

          const validatedArgs = DeleteGlobalConfigFileSchema.parse(args);
          log.debug(`Deleting global config file: ${validatedArgs.id}`);
          result = await client.deleteGlobalConfigFile(validatedArgs.id);
          log.debug('Global config file deleted');
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

      // Build helpful error message with context
      const errorMessage = (error as Error).message;
      const suggestions: string[] = [];

      // Add context-specific suggestions based on error type
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Authentication')) {
          suggestions.push('• Verify your DEPLOYHQ_EMAIL and DEPLOYHQ_API_KEY are correct');
          suggestions.push('• Check that your API key has sufficient permissions');
        }
        if (error.message.includes('404') || error.message.includes('not found')) {
          suggestions.push('• Verify the project permalink or identifier is correct');
          suggestions.push('• Check that the resource exists in your DeployHQ account');
        }
        if (error.message.includes('422') || error.message.includes('Validation')) {
          suggestions.push('• Check that all required parameters are provided');
          suggestions.push('• Verify parameter values are in the correct format');
        }
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          suggestions.push('• Check your network connection');
          suggestions.push('• Try again in a moment');
        }
        if (error.message.includes('deployment')) {
          suggestions.push('• Use list_deployments to verify deployment exists');
          suggestions.push('• Check deployment UUID is correct');
        }
        if (error.message.includes('server')) {
          suggestions.push('• Use list_servers to see available servers');
          suggestions.push('• Verify server UUID is correct');
        }
        if (error.message.includes('project')) {
          suggestions.push('• Use list_projects to see available projects');
          suggestions.push('• Verify project permalink matches exactly');
        }
      }

      const errorResponse: Record<string, unknown> = {
        error: errorMessage,
        tool: name,
      };

      if (suggestions.length > 0) {
        errorResponse.suggestions = suggestions;
      }

      if (error instanceof Error && error.stack) {
        errorResponse.details = error.stack;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Test helper: Invoke a tool by name for testing purposes
 * This provides a clean interface for tests without exposing internal implementation
 *
 * @internal - For testing only
 */
export async function invokeToolForTest(
  server: Server,
  toolName: string,
  args: Record<string, unknown>
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const request = {
    method: 'tools/call' as const,
    params: {
      name: toolName,
      arguments: args,
    },
  };

  // Access the internal handler through the documented setRequestHandler API
  // This is still accessing internals but isolates it to one place
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (server as any)._requestHandlers;
  const handler = handlers.get('tools/call');

  if (!handler) {
    throw new Error('Tool handler not found - server not properly initialized');
  }

  return handler(request) as Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}
