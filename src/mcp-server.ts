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
import {
  tools,
  ListProjectsSchema,
  GetProjectSchema,
  ListServersSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
  GetDeploymentLogSchema,
  CreateDeploymentSchema,
} from './tools.js';

/**
 * Creates the MCP server instance with per-request client initialization
 */
export function createMCPServer(
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

        case 'get_deployment_log': {
          const validatedArgs = GetDeploymentLogSchema.parse(args);
          log.debug(`Fetching deployment log: ${validatedArgs.uuid}`);
          result = await client.getDeploymentLog(validatedArgs.project, validatedArgs.uuid);
          log.debug('Got deployment log');
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

      // Build helpful error message with context
      let errorMessage = (error as Error).message;
      let suggestions: string[] = [];

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
