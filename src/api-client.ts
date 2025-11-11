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
   * Gets the base URL for this client
   * @returns Base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
