/**
 * Integration tests for read-only mode
 * Tests the enforcement of read-only mode when calling create_deployment
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMCPServer, invokeToolForTest } from '../mcp-server.js';
import type { ServerConfig } from '../config.js';

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

    // eslint-disable-next-line no-unused-vars
    constructor(_config: { username: string; password: string; account: string }) {
      // Mock constructor - config param prefixed with _ to indicate intentionally unused
    }
  }

  return {
    DeployHQClient: MockDeployHQClient,
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

      const response = await invokeToolForTest(server, 'create_deployment', {
        project: 'test-project',
        parent_identifier: 'server-uuid',
        start_revision: 'abc123',
        end_revision: 'def456',
      });

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

      const response = await invokeToolForTest(server, 'create_deployment', {
        project: 'test-project',
        parent_identifier: 'server-uuid',
        start_revision: 'abc123',
        end_revision: 'def456',
      });

      // Should return a successful response
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('identifier');
      expect(response.content[0].text).toContain('test-deployment-uuid');
    });

    it('should use default read-only mode (disabled) when no config provided', async () => {
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account'
        // No config provided - should default to deployments allowed
      );

      const response = await invokeToolForTest(server, 'create_deployment', {
        project: 'test-project',
        parent_identifier: 'server-uuid',
        start_revision: 'abc123',
        end_revision: 'def456',
      });

      // Should return a successful response (deployments allowed by default)
      expect(response.isError).toBeUndefined();
      expect(response.content[0].text).toContain('identifier');
    });

    it('should include helpful error message with configuration instructions', async () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      const response = await invokeToolForTest(server, 'create_deployment', {
        project: 'test-project',
        parent_identifier: 'server-uuid',
        start_revision: 'abc123',
        end_revision: 'def456',
      });

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

      const response = await invokeToolForTest(server, 'list_projects', {});

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

      const response = await invokeToolForTest(server, 'get_project', {
        permalink: 'test-project',
      });

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

      const response = await invokeToolForTest(server, 'list_servers', {
        project: 'test-project',
      });

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

      const response = await invokeToolForTest(server, 'list_deployments', {
        project: 'test-project',
      });

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

      const response = await invokeToolForTest(server, 'get_deployment', {
        project: 'test-project',
        uuid: 'deployment-uuid',
      });

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

      const response = await invokeToolForTest(server, 'get_deployment_log', {
        project: 'test-project',
        uuid: 'deployment-uuid',
      });

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

      const response = await invokeToolForTest(server, 'create_deployment', {
        project: 'test-project',
        parent_identifier: 'server-uuid',
        start_revision: 'abc123',
        end_revision: 'def456',
      });

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

      const response = await invokeToolForTest(server, 'create_deployment', {
        project: 'test-project',
        parent_identifier: 'server-uuid',
        start_revision: 'abc123',
        end_revision: 'def456',
      });

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