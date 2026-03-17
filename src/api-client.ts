/**
 * DeployHQ API Client
 * Provides type-safe access to DeployHQ API endpoints
 */

// Import fetch for Node 16+ compatibility
import fetch, { RequestInit as NodeFetchRequestInit } from 'node-fetch';

/**
 * Custom error class for DeployHQ API errors
 */
export class DeployHQError extends Error {
  public statusCode?: number;
  public response?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    response?: unknown
  ) {
    super(message);
    this.name = 'DeployHQError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Error class for authentication failures
 */
export class AuthenticationError extends DeployHQError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error class for validation errors
 */
export class ValidationError extends DeployHQError {
  constructor(message: string, response?: unknown) {
    super(message, 422, response);
    this.name = 'ValidationError';
  }
}

/**
 * DeployHQ API response types
 */
export interface Project {
  name: string;
  permalink: string;
  zone: string;
  public_key: string;
  repository: {
    scm_type: string;
    url: string;
    branch: string;
    hosting_service?: string;
  };
  last_deployed_at?: string;
  auto_deploy_url?: string;
}

export interface Server {
  identifier: string;
  name: string;
  protocol_type: string;
  server_path: string;
  hostname: string;
  username: string;
  port?: number;
  use_ssh_keys?: boolean;
  automatic_deployment?: boolean;
  branch_to_deploy?: string;
}

export interface Deployment {
  identifier: string;
  status: string;
  servers: Server[];
  project: {
    name: string;
    permalink: string;
  };
  start_revision?: string;
  end_revision?: string;
  branch?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface PaginatedResponse<T> {
  records: T[];
  pagination: {
    total: number;
    total_pages: number;
    per_page: number;
    current_page: number;
  };
}

export interface CreateDeploymentParams {
  parent_identifier: string;
  start_revision: string;
  end_revision: string;
  branch?: string;
  mode?: 'queue' | 'preview';
  copy_config_files?: boolean;
  run_build_commands?: boolean;
  use_build_cache?: boolean;
  use_latest?: string;
}

export interface EnvironmentVariable {
  identifier: number;
  name: string;
  masked_value: string;
  locked: boolean;
  build_pipeline: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGlobalEnvironmentVariableParams {
  name: string;
  value: string;
  locked?: boolean;
  build_pipeline?: boolean;
}

export interface SshKey {
  identifier: string;
  title: string;
  public_key: string;
  key_type: string;
  fingerprint: string;
  account: boolean;
}

export interface ConfigFile {
  identifier: string;
  description: string;
  path: string;
  body: string;
  build: boolean;
}

export interface CreateGlobalConfigFileParams {
  path: string;
  body: string;
  description?: string;
  build?: boolean;
}

export interface UpdateGlobalConfigFileParams {
  path?: string;
  body?: string;
  description?: string;
  build?: boolean;
}

export interface UpdateGlobalEnvironmentVariableParams {
  name?: string;
  value?: string;
  locked?: boolean;
  build_pipeline?: boolean;
}

/**
 * Configuration for DeployHQ API client
 */
export interface DeployHQClientConfig {
  username: string;
  password: string;
  account: string;
  timeout?: number;
}

/**
 * DeployHQ API Client
 * Handles authentication and requests to the DeployHQ API
 */
export class DeployHQClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeout: number;

  /**
   * Creates a new DeployHQ API client
   * @param config - Client configuration including credentials
   */
  constructor(config: DeployHQClientConfig) {
    if (!config.username || !config.password || !config.account) {
      throw new Error('Missing required configuration: username, password, or account');
    }

    this.baseUrl = `https://${config.account}.deployhq.com`;
    this.timeout = config.timeout || 30000;

    // Create Basic Auth header
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Makes an HTTP request to the DeployHQ API
   * @param path - API endpoint path
   * @param options - Fetch options
   * @returns Parsed JSON response
   */
  private async request<T>(path: string, options: NodeFetchRequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'DeployHQ-MCP-Server/1.0.0',
          ...(options.headers as Record<string, string> || {}),
        },
        body: options.body,
        signal: controller.signal,
      } as NodeFetchRequestInit);

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new AuthenticationError('Invalid credentials or insufficient permissions');
      }

      // Handle validation errors
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        throw new ValidationError('Validation failed', errorData);
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new DeployHQError(
          `API request failed: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      // Parse and return JSON response
      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DeployHQError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new DeployHQError('Request timeout', 408);
      }

      throw new DeployHQError(
        `Request failed: ${(error as Error).message}`,
        undefined,
        error
      );
    }
  }

  /**
   * Lists all projects in the account
   * @returns Array of projects
   */
  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  /**
   * Gets details for a specific project
   * @param permalink - Project permalink or identifier
   * @returns Project details
   */
  async getProject(permalink: string): Promise<Project> {
    return this.request<Project>(`/projects/${permalink}`);
  }

  /**
   * Lists all servers for a project
   * @param project - Project permalink
   * @returns Array of servers
   */
  async listServers(project: string): Promise<Server[]> {
    // DeployHQ API returns servers directly as an array, not wrapped in { records: [...] }
    return this.request<Server[]>(`/projects/${project}/servers`);
  }

  /**
   * Lists deployments for a project
   * @param project - Project permalink
   * @param page - Page number (optional)
   * @param serverUuid - Server UUID to filter by (optional)
   * @returns Paginated deployment response
   */
  async listDeployments(
    project: string,
    page?: number,
    serverUuid?: string
  ): Promise<PaginatedResponse<Deployment>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (serverUuid) params.append('to', serverUuid);

    const query = params.toString();
    const path = `/projects/${project}/deployments${query ? `?${query}` : ''}`;

    return this.request<PaginatedResponse<Deployment>>(path);
  }

  /**
   * Gets details for a specific deployment
   * @param project - Project permalink
   * @param uuid - Deployment UUID
   * @returns Deployment details
   */
  async getDeployment(project: string, uuid: string): Promise<Deployment> {
    return this.request<Deployment>(`/projects/${project}/deployments/${uuid}`);
  }

  /**
   * Creates a new deployment
   * @param project - Project permalink
   * @param params - Deployment parameters
   * @returns Created deployment details
   */
  async createDeployment(
    project: string,
    params: CreateDeploymentParams
  ): Promise<Deployment> {
    return this.request<Deployment>(`/projects/${project}/deployments`, {
      method: 'POST',
      body: JSON.stringify({ deployment: params }),
    });
  }

  /**
   * Gets the deployment log for a specific deployment
   * Fetches all step logs and combines them into a single text output
   * @param project - Project permalink
   * @param uuid - Deployment UUID
   * @returns Deployment log as text
   */
  async getDeploymentLog(project: string, uuid: string): Promise<string> {
    const deployment = await this.getDeployment(project, uuid) as Deployment & { steps?: Array<{ identifier: string; step: string }> };

    if (!deployment.steps || deployment.steps.length === 0) {
      return 'No deployment steps found.';
    }

    const logParts: string[] = [];

    for (const step of deployment.steps) {
      try {
        const logs = await this.request<Array<{ message: string; detail?: string; type: string }>>(
          `/projects/${project}/deployments/${uuid}/steps/${step.identifier}/logs`
        );

        if (logs && logs.length > 0) {
          logParts.push(`=== ${step.step} ===`);
          for (const entry of logs) {
            const detail = entry.detail ? ` ${entry.detail}` : '';
            logParts.push(`[${entry.type}] ${entry.message}${detail}`);
          }
          logParts.push('');
        }
      } catch {
        // Skip steps with no logs
      }
    }

    return logParts.length > 0 ? logParts.join('\n') : 'No log entries found.';
  }

  /**
   * Lists all SSH public keys for the account
   * @returns Array of SSH keys (public keys only)
   */
  async listSshKeys(): Promise<SshKey[]> {
    return this.request<SshKey[]>('/ssh_keys');
  }

  /**
   * Lists all global environment variables for the account
   * @returns Array of environment variables
   */
  async listGlobalEnvironmentVariables(): Promise<EnvironmentVariable[]> {
    return this.request<EnvironmentVariable[]>('/global_environment_variables');
  }

  /**
   * Creates a new global environment variable
   * @param params - Environment variable parameters
   * @returns Created environment variable
   */
  async createGlobalEnvironmentVariable(
    params: CreateGlobalEnvironmentVariableParams
  ): Promise<EnvironmentVariable> {
    return this.request<EnvironmentVariable>('/global_environment_variables', {
      method: 'POST',
      body: JSON.stringify({ environment_variable: params }),
    });
  }

  /**
   * Updates an existing global environment variable
   * @param id - Environment variable identifier
   * @param params - Environment variable parameters to update
   * @returns Updated environment variable
   */
  async updateGlobalEnvironmentVariable(
    id: string,
    params: UpdateGlobalEnvironmentVariableParams
  ): Promise<EnvironmentVariable> {
    return this.request<EnvironmentVariable>(`/global_environment_variables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ environment_variable: params }),
    });
  }

  /**
   * Deletes a global environment variable
   * @param id - Environment variable identifier
   * @returns Deletion status response
   */
  async deleteGlobalEnvironmentVariable(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/global_environment_variables/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Lists all global config file templates for the account
   * @returns Array of config files
   */
  async listGlobalConfigFiles(): Promise<ConfigFile[]> {
    return this.request<ConfigFile[]>('/global_config_files');
  }

  /**
   * Gets a specific global config file template
   * @param id - Config file identifier (UUID)
   * @returns Config file details including body
   */
  async getGlobalConfigFile(id: string): Promise<ConfigFile> {
    return this.request<ConfigFile>(`/global_config_files/${id}`);
  }

  /**
   * Creates a new global config file template
   * @param params - Config file parameters
   * @returns Created config file
   */
  async createGlobalConfigFile(
    params: CreateGlobalConfigFileParams
  ): Promise<ConfigFile> {
    return this.request<ConfigFile>('/global_config_files', {
      method: 'POST',
      body: JSON.stringify({ config_file: params }),
    });
  }

  /**
   * Updates an existing global config file template
   * @param id - Config file identifier (UUID)
   * @param params - Config file parameters to update
   * @returns Updated config file
   */
  async updateGlobalConfigFile(
    id: string,
    params: UpdateGlobalConfigFileParams
  ): Promise<ConfigFile> {
    return this.request<ConfigFile>(`/global_config_files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ config_file: params }),
    });
  }

  /**
   * Deletes a global config file template
   * @param id - Config file identifier (UUID)
   * @returns Deletion status response
   */
  async deleteGlobalConfigFile(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/global_config_files/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Validates credentials by attempting to list projects
   * @returns true if credentials are valid
   * @throws AuthenticationError if credentials are invalid
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.listProjects();
      return true;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      // Re-throw other errors as authentication failures for clarity
      throw new AuthenticationError(
        `Failed to validate credentials: ${(error as Error).message}`
      );
    }
  }

  /**
   * Gets the base URL for this client
   * @returns Base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
