import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DeployHQClient,
  DeployHQError,
  AuthenticationError,
  ValidationError,
} from '../api-client.js';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

import fetch from 'node-fetch';
const mockFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe('DeployHQClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with valid config', () => {
      const client = new DeployHQClient({
        username: 'test@example.com',
        password: 'api-key',
        account: 'test-account',
      });

      expect(client).toBeInstanceOf(DeployHQClient);
      expect(client.getBaseUrl()).toBe('https://test-account.deployhq.com');
    });

    it('should throw error without username', () => {
      expect(() => {
        new DeployHQClient({
          username: '',
          password: 'api-key',
          account: 'test-account',
        });
      }).toThrow('Missing required configuration');
    });

    it('should throw error without password', () => {
      expect(() => {
        new DeployHQClient({
          username: 'test@example.com',
          password: '',
          account: 'test-account',
        });
      }).toThrow('Missing required configuration');
    });

    it('should throw error without account', () => {
      expect(() => {
        new DeployHQClient({
          username: 'test@example.com',
          password: 'api-key',
          account: '',
        });
      }).toThrow('Missing required configuration');
    });

    it('should set custom timeout', () => {
      const client = new DeployHQClient({
        username: 'test@example.com',
        password: 'api-key',
        account: 'test-account',
        timeout: 60000,
      });

      expect(client).toBeInstanceOf(DeployHQClient);
    });
  });

  describe('Error Classes', () => {
    it('should create DeployHQError with message', () => {
      const error = new DeployHQError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DeployHQError');
      expect(error.message).toBe('Test error');
    });

    it('should create DeployHQError with status code', () => {
      const error = new DeployHQError('Test error', 500);
      expect(error.statusCode).toBe(500);
    });

    it('should create AuthenticationError', () => {
      const error = new AuthenticationError();
      expect(error).toBeInstanceOf(DeployHQError);
      expect(error.name).toBe('AuthenticationError');
      expect(error.statusCode).toBe(401);
    });

    it('should create ValidationError', () => {
      const error = new ValidationError('Validation failed');
      expect(error).toBeInstanceOf(DeployHQError);
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(422);
    });
  });

  describe('API Methods', () => {
    let client: DeployHQClient;

    beforeEach(() => {
      client = new DeployHQClient({
        username: 'test@example.com',
        password: 'api-key',
        account: 'test-account',
      });
    });

    describe('listProjects', () => {
      it('should fetch projects successfully', async () => {
        const mockProjects = [
          { name: 'Project 1', permalink: 'project-1' },
          { name: 'Project 2', permalink: 'project-2' },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProjects,
        } as any);

        const result = await client.listProjects();

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Basic'),
              'Accept': 'application/json',
            }),
          })
        );
        expect(result).toEqual(mockProjects);
      });

      it('should throw AuthenticationError on 401', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        } as any);

        await expect(client.listProjects()).rejects.toThrow(AuthenticationError);
      });

      it('should throw AuthenticationError on 403', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
        } as any);

        await expect(client.listProjects()).rejects.toThrow(AuthenticationError);
      });
    });

    describe('getProject', () => {
      it('should fetch project by permalink', async () => {
        const mockProject = { name: 'Test Project', permalink: 'test-project' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProject,
        } as any);

        const result = await client.getProject('test-project');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project',
          expect.any(Object)
        );
        expect(result).toEqual(mockProject);
      });
    });

    describe('listServers', () => {
      it('should fetch servers for project', async () => {
        const mockServers = [
          { identifier: 'server-1', name: 'Production' },
          { identifier: 'server-2', name: 'Staging' },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockServers,
        } as any);

        const result = await client.listServers('test-project');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project/servers',
          expect.any(Object)
        );
        expect(result).toEqual(mockServers);
      });
    });

    describe('listDeployments', () => {
      it('should fetch deployments without pagination', async () => {
        const mockResponse = {
          records: [{ identifier: 'deploy-1' }],
          pagination: { total: 1, total_pages: 1, per_page: 30, current_page: 1 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        } as any);

        const result = await client.listDeployments('test-project');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project/deployments',
          expect.any(Object)
        );
        expect(result).toEqual(mockResponse);
      });

      it('should fetch deployments with page', async () => {
        const mockResponse = {
          records: [{ identifier: 'deploy-2' }],
          pagination: { total: 10, total_pages: 2, per_page: 30, current_page: 2 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        } as any);

        await client.listDeployments('test-project', 2);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project/deployments?page=2',
          expect.any(Object)
        );
      });

      it('should fetch deployments filtered by server', async () => {
        const mockResponse = {
          records: [{ identifier: 'deploy-3' }],
          pagination: { total: 1, total_pages: 1, per_page: 30, current_page: 1 },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        } as any);

        await client.listDeployments('test-project', undefined, 'server-123');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project/deployments?to=server-123',
          expect.any(Object)
        );
      });
    });

    describe('getDeployment', () => {
      it('should fetch specific deployment', async () => {
        const mockDeployment = { identifier: 'deploy-1', status: 'completed' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockDeployment,
        } as any);

        const result = await client.getDeployment('test-project', 'deploy-1');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project/deployments/deploy-1',
          expect.any(Object)
        );
        expect(result).toEqual(mockDeployment);
      });
    });

    describe('createDeployment', () => {
      it('should create deployment with required params', async () => {
        const mockDeployment = { identifier: 'deploy-new', status: 'pending' };
        const params = {
          parent_identifier: 'server-1',
          start_revision: 'abc123',
          end_revision: 'def456',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockDeployment,
        } as any);

        const result = await client.createDeployment('test-project', params);

        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-account.deployhq.com/projects/test-project/deployments',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ deployment: params }),
          })
        );
        expect(result).toEqual(mockDeployment);
      });

      it('should throw ValidationError on 422', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ error: 'Invalid params' }),
        } as any);

        await expect(
          client.createDeployment('test-project', {
            parent_identifier: 'server-1',
            start_revision: 'abc123',
            end_revision: 'def456',
          })
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('Error Handling', () => {
      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(client.listProjects()).rejects.toThrow(DeployHQError);
      });

      it('should handle non-OK responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        } as any);

        await expect(client.listProjects()).rejects.toThrow(DeployHQError);
      });
    });
  });
});
