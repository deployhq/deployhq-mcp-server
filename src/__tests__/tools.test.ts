import { describe, it, expect } from 'vitest';
import {
  ListProjectsSchema,
  GetProjectSchema,
  ListServersSchema,
  ListDeploymentsSchema,
  GetDeploymentSchema,
  GetDeploymentLogSchema,
  CreateDeploymentSchema,
  tools,
} from '../tools.js';

describe('Tool Schemas', () => {
  describe('ListProjectsSchema', () => {
    it('should validate empty object', () => {
      const result = ListProjectsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept any additional properties', () => {
      const result = ListProjectsSchema.safeParse({ foo: 'bar' });
      expect(result.success).toBe(true);
    });
  });

  describe('GetProjectSchema', () => {
    it('should validate with valid permalink', () => {
      const result = GetProjectSchema.safeParse({ permalink: 'my-project' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.permalink).toBe('my-project');
      }
    });

    it('should fail without permalink', () => {
      const result = GetProjectSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should fail with non-string permalink', () => {
      const result = GetProjectSchema.safeParse({ permalink: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('ListServersSchema', () => {
    it('should validate with valid project', () => {
      const result = ListServersSchema.safeParse({ project: 'my-project' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.project).toBe('my-project');
      }
    });

    it('should fail without project', () => {
      const result = ListServersSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('ListDeploymentsSchema', () => {
    it('should validate with only project', () => {
      const result = ListDeploymentsSchema.safeParse({ project: 'my-project' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.project).toBe('my-project');
        expect(result.data.page).toBeUndefined();
        expect(result.data.server_uuid).toBeUndefined();
      }
    });

    it('should validate with project and page', () => {
      const result = ListDeploymentsSchema.safeParse({
        project: 'my-project',
        page: 2,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
      }
    });

    it('should validate with project and server_uuid', () => {
      const result = ListDeploymentsSchema.safeParse({
        project: 'my-project',
        server_uuid: 'abc-123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.server_uuid).toBe('abc-123');
      }
    });

    it('should fail without project', () => {
      const result = ListDeploymentsSchema.safeParse({ page: 1 });
      expect(result.success).toBe(false);
    });

    it('should fail with invalid page type', () => {
      const result = ListDeploymentsSchema.safeParse({
        project: 'my-project',
        page: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GetDeploymentSchema', () => {
    it('should validate with project and uuid', () => {
      const result = GetDeploymentSchema.safeParse({
        project: 'my-project',
        uuid: 'deployment-123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.project).toBe('my-project');
        expect(result.data.uuid).toBe('deployment-123');
      }
    });

    it('should fail without project', () => {
      const result = GetDeploymentSchema.safeParse({ uuid: 'deployment-123' });
      expect(result.success).toBe(false);
    });

    it('should fail without uuid', () => {
      const result = GetDeploymentSchema.safeParse({ project: 'my-project' });
      expect(result.success).toBe(false);
    });
  });

  describe('GetDeploymentLogSchema', () => {
    it('should validate with project and uuid', () => {
      const result = GetDeploymentLogSchema.safeParse({
        project: 'my-project',
        uuid: 'deployment-123',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.project).toBe('my-project');
        expect(result.data.uuid).toBe('deployment-123');
      }
    });

    it('should fail without project', () => {
      const result = GetDeploymentLogSchema.safeParse({ uuid: 'deployment-123' });
      expect(result.success).toBe(false);
    });

    it('should fail without uuid', () => {
      const result = GetDeploymentLogSchema.safeParse({ project: 'my-project' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateDeploymentSchema', () => {
    it('should validate with required fields', () => {
      const result = CreateDeploymentSchema.safeParse({
        project: 'my-project',
        parent_identifier: 'server-123',
        start_revision: 'abc123',
        end_revision: 'def456',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.project).toBe('my-project');
        expect(result.data.parent_identifier).toBe('server-123');
        expect(result.data.start_revision).toBe('abc123');
        expect(result.data.end_revision).toBe('def456');
      }
    });

    it('should validate with optional branch', () => {
      const result = CreateDeploymentSchema.safeParse({
        project: 'my-project',
        parent_identifier: 'server-123',
        start_revision: 'abc123',
        end_revision: 'def456',
        branch: 'main',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.branch).toBe('main');
      }
    });

    it('should validate with mode', () => {
      const result = CreateDeploymentSchema.safeParse({
        project: 'my-project',
        parent_identifier: 'server-123',
        start_revision: 'abc123',
        end_revision: 'def456',
        mode: 'preview',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('preview');
      }
    });

    it('should fail with invalid mode', () => {
      const result = CreateDeploymentSchema.safeParse({
        project: 'my-project',
        parent_identifier: 'server-123',
        start_revision: 'abc123',
        end_revision: 'def456',
        mode: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('should validate with boolean flags', () => {
      const result = CreateDeploymentSchema.safeParse({
        project: 'my-project',
        parent_identifier: 'server-123',
        start_revision: 'abc123',
        end_revision: 'def456',
        copy_config_files: true,
        run_build_commands: false,
        use_build_cache: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.copy_config_files).toBe(true);
        expect(result.data.run_build_commands).toBe(false);
        expect(result.data.use_build_cache).toBe(true);
      }
    });

    it('should fail without required fields', () => {
      const result = CreateDeploymentSchema.safeParse({
        project: 'my-project',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Tools Array', () => {
    it('should export 7 tools', () => {
      expect(tools).toHaveLength(7);
    });

    it('should have correct tool names', () => {
      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain('list_projects');
      expect(toolNames).toContain('get_project');
      expect(toolNames).toContain('list_servers');
      expect(toolNames).toContain('list_deployments');
      expect(toolNames).toContain('get_deployment');
      expect(toolNames).toContain('get_deployment_log');
      expect(toolNames).toContain('create_deployment');
    });

    it('should have descriptions for all tools', () => {
      tools.forEach((tool) => {
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
      });
    });

    it('should have input schemas for all tools', () => {
      tools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      });
    });
  });
});
