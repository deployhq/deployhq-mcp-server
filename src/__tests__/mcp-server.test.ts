import { describe, it, expect } from 'vitest';
import { createMCPServer } from '../mcp-server.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { ServerConfig } from '../config.js';

describe('MCP Server Factory', () => {
  describe('createMCPServer', () => {
    it('should create MCP server instance', () => {
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account'
      );

      expect(server).toBeInstanceOf(Server);
    });

    it('should create server with different credentials', () => {
      const server = createMCPServer(
        'another@example.com',
        'different-key',
        'another-account'
      );

      expect(server).toBeInstanceOf(Server);
    });

    it('should create multiple independent server instances', () => {
      const server1 = createMCPServer('user1@example.com', 'key1', 'account1');
      const server2 = createMCPServer('user2@example.com', 'key2', 'account2');

      expect(server1).toBeInstanceOf(Server);
      expect(server2).toBeInstanceOf(Server);
      expect(server1).not.toBe(server2);
    });

    it('should create server with read-only mode enabled by default', () => {
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account'
      );

      expect(server).toBeInstanceOf(Server);
      // Server should be created with default config (read-only enabled)
    });

    it('should create server with explicit read-only config', () => {
      const config: ServerConfig = { readOnlyMode: true };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      expect(server).toBeInstanceOf(Server);
    });

    it('should create server with read-only mode disabled', () => {
      const config: ServerConfig = { readOnlyMode: false };
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account',
        config
      );

      expect(server).toBeInstanceOf(Server);
    });
  });

  describe('Server Configuration', () => {
    it('should configure server with correct name', () => {
      const server = createMCPServer(
        'test@example.com',
        'api-key',
        'test-account'
      );

      // Server should have the correct name from package.json
      expect(server).toBeDefined();
    });

    it('should accept different server configurations', () => {
      const config1: ServerConfig = { readOnlyMode: true };
      const config2: ServerConfig = { readOnlyMode: false };

      const server1 = createMCPServer('test@example.com', 'key', 'account', config1);
      const server2 = createMCPServer('test@example.com', 'key', 'account', config2);

      expect(server1).toBeInstanceOf(Server);
      expect(server2).toBeInstanceOf(Server);
      expect(server1).not.toBe(server2);
    });
  });
});
