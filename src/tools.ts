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
  end_revision: z.string().describe('End commit SHA hash, or "latest"/"HEAD"/branch name to deploy the latest commit on the branch'),
  branch: z.string().optional().describe('Branch to deploy from'),
  mode: z.enum(['queue', 'preview']).optional().describe('Deployment mode: queue to deploy immediately, preview to preview changes'),
  copy_config_files: z.boolean().optional().describe('Whether to copy config files'),
  run_build_commands: z.boolean().optional().describe('Whether to run build commands'),
  use_build_cache: z.boolean().optional().describe('Whether to use build cache'),
  use_latest: z.string().optional().describe('Set to "1" to use the last successfully deployed commit as start_revision (start_revision will be translated to the ___PREVIOUS___ constant)'),
});

export const ListGlobalEnvironmentVariablesSchema = z.object({});

export const CreateGlobalEnvironmentVariableSchema = z.object({
  name: z.string().describe('Environment variable name'),
  value: z.string().describe('Environment variable value'),
  locked: z.boolean().optional().describe('Whether the variable is locked (read-only after creation)'),
  build_pipeline: z.boolean().optional().describe('Whether the variable is available in the build pipeline'),
});

export const UpdateGlobalEnvironmentVariableSchema = z.object({
  id: z.coerce.string().describe('Environment variable identifier'),
  name: z.string().optional().describe('Environment variable name'),
  value: z.string().optional().describe('Environment variable value'),
  locked: z.boolean().optional().describe('Whether the variable is locked'),
  build_pipeline: z.boolean().optional().describe('Whether the variable is available in the build pipeline'),
});

export const DeleteGlobalEnvironmentVariableSchema = z.object({
  id: z.coerce.string().describe('Environment variable identifier'),
});

export const ListGlobalConfigFilesSchema = z.object({});

export const GetGlobalConfigFileSchema = z.object({
  id: z.string().describe('Config file identifier (UUID)'),
});

export const CreateGlobalConfigFileSchema = z.object({
  path: z.string().describe('File path for the config file'),
  body: z.string().describe('File contents'),
  description: z.string().optional().describe('Description of the config file'),
  build: z.boolean().optional().describe('Whether the config file is used during builds'),
});

export const UpdateGlobalConfigFileSchema = z.object({
  id: z.string().describe('Config file identifier (UUID)'),
  path: z.string().optional().describe('File path for the config file'),
  body: z.string().optional().describe('File contents'),
  description: z.string().optional().describe('Description of the config file'),
  build: z.boolean().optional().describe('Whether the config file is used during builds'),
});

export const DeleteGlobalConfigFileSchema = z.object({
  id: z.string().describe('Config file identifier (UUID)'),
});

export const ListSshKeysSchema = z.object({});

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
          description: 'Ending commit SHA hash, or "latest"/"HEAD"/branch name to deploy the latest commit on the branch (automatically resolved)',
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
          description: 'Set to "1" to use the last successfully deployed commit as start_revision (optional)',
        },
      },
      required: ['project', 'parent_identifier', 'start_revision', 'end_revision'],
    },
  },
  {
    name: 'list_global_environment_variables',
    description:
      'List all global (account-level) environment variables. These variables are available across all projects in the account. Returns variable names, masked values, and settings.',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_global_environment_variable',
    description:
      'Create a new global (account-level) environment variable. The variable will be available across all projects in the account.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Environment variable name',
        },
        value: {
          type: 'string',
          description: 'Environment variable value',
        },
        locked: {
          type: 'boolean',
          description: 'Whether the variable is locked (read-only after creation) (optional)',
        },
        build_pipeline: {
          type: 'boolean',
          description: 'Whether the variable is available in the build pipeline (optional)',
        },
      },
      required: ['name', 'value'],
    },
  },
  {
    name: 'update_global_environment_variable',
    description:
      'Update an existing global (account-level) environment variable. Can change the name, value, locked status, or build pipeline availability.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Environment variable identifier',
        },
        name: {
          type: 'string',
          description: 'Environment variable name (optional)',
        },
        value: {
          type: 'string',
          description: 'Environment variable value (optional)',
        },
        locked: {
          type: 'boolean',
          description: 'Whether the variable is locked (optional)',
        },
        build_pipeline: {
          type: 'boolean',
          description: 'Whether the variable is available in the build pipeline (optional)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_global_environment_variable',
    description:
      'Delete a global (account-level) environment variable. This action is irreversible.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Environment variable identifier',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_global_config_files',
    description:
      'List all global (account-level) config file templates. These config files are available across all projects in the account. Returns file paths, descriptions, and settings.',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_global_config_file',
    description:
      'Get a specific global (account-level) config file template including its body/contents. Use this to read the full content of a config file.',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Config file identifier (UUID)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_global_config_file',
    description:
      'Create a new global (account-level) config file template. The config file will be available across all projects in the account.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path for the config file',
        },
        body: {
          type: 'string',
          description: 'File contents',
        },
        description: {
          type: 'string',
          description: 'Description of the config file (optional)',
        },
        build: {
          type: 'boolean',
          description: 'Whether the config file is used during builds (optional)',
        },
      },
      required: ['path', 'body'],
    },
  },
  {
    name: 'update_global_config_file',
    description:
      'Update an existing global (account-level) config file template. Can change the path, body, description, or build setting.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Config file identifier (UUID)',
        },
        path: {
          type: 'string',
          description: 'File path for the config file (optional)',
        },
        body: {
          type: 'string',
          description: 'File contents (optional)',
        },
        description: {
          type: 'string',
          description: 'Description of the config file (optional)',
        },
        build: {
          type: 'boolean',
          description: 'Whether the config file is used during builds (optional)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_global_config_file',
    description:
      'Delete a global (account-level) config file template. This action is irreversible.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Config file identifier (UUID)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_ssh_keys',
    description:
      'List all SSH public keys for the account. Returns public keys, fingerprints, titles, and key types. Use these keys to authorize DeployHQ on servers for SSH-based deployments. Never returns private keys.',
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
] as const;

/**
 * Type for tool names
 */
export type ToolName = typeof tools[number]['name'];
