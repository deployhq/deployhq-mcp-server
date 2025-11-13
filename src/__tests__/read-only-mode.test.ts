/**
 * Integration tests for read-only mode
 * Tests the enforcement of read-only mode when calling create_deployment
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from '../mcp-server.js';
import type { ServerConfig } from '../config.js';
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

// Mock the DeployHQClient to avoid making real API calls
vi.mock('../api-client.js', () => {
  class MockDeployHQClient {
    createDeployment = vi.fn().mockResolvedValue({
      identifier: 'test-deployment-uuid',
      status: 'queued',
    });
    listProjects = vi.fn().mockResolvedValue([]);
    getProject = vi.fn().mockResolvedValue({});
    listServers = vi.fn().mockResolvedValue([]);
    listDeployments = vi.fn().mockResolvedValue([]);
    getDeployment = vi.fn().mockResolvedValue({});
    getDeploymentLog = vi.fn().mockResolvedValue('');
    validateCredentials = vi.fn().mockResolvedValue(undefined);

    constructor(_config: any) {
      // Mock constructor - config param prefixed with _ to indicate intentionally unused
    }
  }

  class MockAuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }

  return {
    DeployHQClient: MockDeployHQClient,
    AuthenticationError: MockAuthenticationError,
  };
});

describe('Read-Only Mode Integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console.error to prevent test output pollution
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('create_deployment tool with read-only mode', () => {
    it('should block create_deployment when read-only mode is enabled', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'create_deployment',
          arguments: {
            project: 'test-project',
            parent_identifier: 'server-uuid',
            start_revision: 'abc123',
            end_revision: 'def456',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      expect(handler).toBeDefined();

      const response = await handler(request);

      // Should return an error response
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('FORBIDDEN');
      expect(response.content[0].text).toContain('read-only mode');
      expect(response.content[0].text).toContain('DEPLOYHQ_READ_ONLY=false');
    });

    it('should allow create_deployment when read-only mode is disabled', async () => {
      const config: ServerConfig = { readOnlyMode: false };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'create_deployment',
          arguments: {
            project: 'test-project',
            parent_identifier: 'server-uuid',
            start_revision: 'abc123',
            end_revision: 'def456',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      expect(handler).toBeDefined();

      const response = await handler(request);

      // Should return a successful response
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('identifier');
      expect(response.content[0].text).toContain('test-deployment-uuid');
    });

    it('should use default read-only mode (enabled) when no config provided', async () => {
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account'
        // No config provided - should default to read-only
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'create_deployment',
          arguments: {
            project: 'test-project',
            parent_identifier: 'server-uuid',
            start_revision: 'abc123',
            end_revision: 'def456',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      expect(handler).toBeDefined();

      const response = await handler(request);

      // Should return an error response (read-only by default)
      expect(response.isError).toBe(true);
      expect(response.content[0].text).toContain('read-only mode');
    });

    it('should include helpful error message with configuration instructions', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'create_deployment',
          arguments: {
            project: 'test-project',
            parent_identifier: 'server-uuid',
            start_revision: 'abc123',
            end_revision: 'def456',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      const errorText = response.content[0].text;

      // Check error message contains all required information
      expect(errorText).toContain('FORBIDDEN');
      expect(errorText).toContain('read-only mode');
      expect(errorText).toContain('DEPLOYHQ_READ_ONLY=false');
      expect(errorText).toContain('--read-only=false');
      expect(errorText).toContain('security');
      expect(errorText).toContain('AI assistants');
    });
  });

  describe('Read-only mode does not affect read operations', () => {
    it('should allow list_projects in read-only mode', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'list_projects',
          arguments: {},
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      // Should work normally
      expect(response.isError).toBeUndefined();
    });

    it('should allow get_project in read-only mode', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'get_project',
          arguments: {
            permalink: 'test-project',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      // Should work normally
      expect(response.isError).toBeUndefined();
    });

    it('should allow list_servers in read-only mode', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'list_servers',
          arguments: {
            project: 'test-project',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      // Should work normally
      expect(response.isError).toBeUndefined();
    });

    it('should allow list_deployments in read-only mode', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'list_deployments',
          arguments: {
            project: 'test-project',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      // Should work normally
      expect(response.isError).toBeUndefined();
    });

    it('should allow get_deployment in read-only mode', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'get_deployment',
          arguments: {
            project: 'test-project',
            uuid: 'deployment-uuid',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      // Should work normally
      expect(response.isError).toBeUndefined();
    });

    it('should allow get_deployment_log in read-only mode', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'get_deployment_log',
          arguments: {
            project: 'test-project',
            uuid: 'deployment-uuid',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      // Should work normally
      expect(response.isError).toBeUndefined();
    });
  });

  describe('Error message format', () => {
    it('should return error as JSON with proper structure', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'create_deployment',
          arguments: {
            project: 'test-project',
            parent_identifier: 'server-uuid',
            start_revision: 'abc123',
            end_revision: 'def456',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0]).toBeDefined();
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toBeDefined();

      // Parse the JSON error response
      const errorData = JSON.parse(response.content[0].text);
      expect(errorData.error).toBeDefined();
      expect(errorData.tool).toBe('create_deployment');
    });

    it('should provide clear error message that can be displayed to users', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const request: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: 'create_deployment',
          arguments: {
            project: 'test-project',
            parent_identifier: 'server-uuid',
            start_revision: 'abc123',
            end_revision: 'def456',
          },
        },
      };

      // Get the handler for CallToolRequest
      const handlers = (server as any)._requestHandlers;
      const handler = handlers.get('tools/call');

      const response = await handler(request);

      const errorData = JSON.parse(response.content[0].text);

      // Error message should be clear and actionable
      expect(errorData.error).toContain('FORBIDDEN');
      expect(errorData.error).toContain('read-only mode');

      // Should provide at least two ways to disable read-only mode
      expect(errorData.error).toContain('DEPLOYHQ_READ_ONLY=false');
      expect(errorData.error).toContain('--read-only=false');

      // Should explain why read-only mode exists
      expect(errorData.error).toContain('security');
    });
  });
});