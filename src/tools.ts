/**
 * MCP Tool Definitions for DeployHQ
 * Defines all available tools and their schemas
 */

import { z } from 'zod';

/**
 * Schema definitions for tool inputs
 */
export const ListProjectsSchema = z.object({});

export const GetProjectSchema = z.object({
  permalink: z.string().describe('Project permalink or identifier'),
});

export const ListServersSchema = z.object({
  project: z.string().describe('Project permalink'),
});

export const ListDeploymentsSchema = z.object({
  project: z.string().describe('Project permalink'),
  page: z.number().optional().describe('Page number for pagination'),
  server_uuid: z.string().optional().describe('Filter by server UUID'),
});

export const GetDeploymentSchema = z.object({
  project: z.string().describe('Project permalink'),
  uuid: z.string().describe('Deployment UUID'),
});

export const GetDeploymentLogSchema = z.object({
  project: z.string().describe('Project permalink'),
  uuid: z.string().describe('Deployment UUID'),
});

export const CreateDeploymentSchema = z.object({
  project: z.string().describe('Project permalink'),
  parent_identifier: z.string().describe('Server or server group UUID'),
  start_revision: z.string().describe('Start commit hash or revision'),
  end_revision: z.string().describe('End commit hash or revision'),
  branch: z.string().optional().describe('Branch to deploy from'),
  mode: z.enum(['queue', 'preview']).optional().describe('Deployment mode: queue to deploy immediately, preview to preview changes'),
  copy_config_files: z.boolean().optional().describe('Whether to copy config files'),
  run_build_commands: z.boolean().optional().describe('Whether to run build commands'),
  use_build_cache: z.boolean().optional().describe('Whether to use build cache'),
  use_latest: z.string().optional().describe('Set to "1" to use the latest deployed commit as start_revision'),
});

/**
 * Tool definitions for MCP server
 */
export const tools = [
  {
    name: 'list_projects',
    description:
      'List all projects in the DeployHQ account. Returns project names, permalinks, repository information, and deployment status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_project',
    description:
      'Get detailed information about a specific project including repository details, SSH keys, and deployment URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        permalink: {
          type: 'string',
          description: 'Project permalink or identifier',
        },
      },
      required: ['permalink'],
    },
  },
  {
    name: 'list_servers',
    description:
      'List all servers configured for a project. Returns server names, hostnames, protocols, paths, and deployment settings.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project permalink',
        },
      },
      required: ['project'],
    },
  },
  {
    name: 'list_deployments',
    description:
      'List deployments for a project with pagination support. Returns deployment status, timestamps, revisions, and server information. Can be filtered by server UUID.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project permalink',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (optional)',
        },
        server_uuid: {
          type: 'string',
          description: 'Filter deployments by server UUID (optional)',
        },
      },
      required: ['project'],
    },
  },
  {
    name: 'get_deployment',
    description:
      'Get detailed information about a specific deployment including its status, logs, files changed, and server details.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project permalink',
        },
        uuid: {
          type: 'string',
          description: 'Deployment UUID',
        },
      },
      required: ['project', 'uuid'],
    },
  },
  {
    name: 'get_deployment_log',
    description:
      'Get the deployment log for a specific deployment. Returns the complete log output as text, useful for debugging failed or completed deployments.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project permalink',
        },
        uuid: {
          type: 'string',
          description: 'Deployment UUID',
        },
      },
      required: ['project', 'uuid'],
    },
  },
  {
    name: 'create_deployment',
    description:
      'Create a new deployment for a project. Can queue for immediate deployment or create a preview. Requires server UUID and commit revisions.',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: 'Project permalink',
        },
        parent_identifier: {
          type: 'string',
          description: 'Server or server group UUID to deploy to',
        },
        start_revision: {
          type: 'string',
          description: 'Starting commit hash or revision',
        },
        end_revision: {
          type: 'string',
          description: 'Ending commit hash or revision (usually HEAD or latest)',
        },
        branch: {
          type: 'string',
          description: 'Branch to deploy from (optional)',
        },
        mode: {
          type: 'string',
          enum: ['queue', 'preview'],
          description: 'Deployment mode: "queue" to deploy immediately, "preview" to preview changes (optional)',
        },
        copy_config_files: {
          type: 'boolean',
          description: 'Whether to copy configuration files (optional)',
        },
        run_build_commands: {
          type: 'boolean',
          description: 'Whether to run build commands (optional)',
        },
        use_build_cache: {
          type: 'boolean',
          description: 'Whether to use the build cache (optional)',
        },
        use_latest: {
          type: 'string',
          description: 'Set to "1" to use the last deployed commit as start_revision (optional)',
        },
      },
      required: ['project', 'parent_identifier', 'start_revision', 'end_revision'],
    },
  },
] as const;

/**
 * Type for tool names
 */
export type ToolName = typeof tools[number]['name'];
