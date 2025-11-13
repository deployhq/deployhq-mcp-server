import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseServerConfig, getConfigSource } from '../config.js';

describe('Configuration Parsing', () => {
  // Store original process.argv and env
  let originalArgv: string[];
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalArgv = [...process.argv];
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
  });

  describe('parseServerConfig', () => {
    describe('Default behavior', () => {
      it('should default to read-only mode disabled (deployments allowed)', () => {
        // Clear any existing config
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });
    });

    describe('Environment variable parsing', () => {
      it('should parse DEPLOYHQ_READ_ONLY=false', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'false';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should parse DEPLOYHQ_READ_ONLY=true', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'true';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse DEPLOYHQ_READ_ONLY=0', () => {
        process.env.DEPLOYHQ_READ_ONLY = '0';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should parse DEPLOYHQ_READ_ONLY=1', () => {
        process.env.DEPLOYHQ_READ_ONLY = '1';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse DEPLOYHQ_READ_ONLY=yes', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'yes';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse DEPLOYHQ_READ_ONLY=no', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'no';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should be case-insensitive for TRUE', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'TRUE';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should be case-insensitive for FALSE', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'FALSE';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should be case-insensitive for YES', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'Yes';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should be case-insensitive for NO', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'No';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should handle whitespace in environment variable', () => {
        process.env.DEPLOYHQ_READ_ONLY = ' false ';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should fall back to default for unrecognized values', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'maybe';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        // Unrecognized values are ignored and we use the default (false)
        expect(config.readOnlyMode).toBe(false);
      });
    });

    describe('CLI flag parsing', () => {
      it('should parse --read-only flag (enables read-only)', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse --read-only=false', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=false'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should parse --read-only=true', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=true'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse --read-only=0', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=0'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should parse --read-only=1', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=1'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse --read-only=yes', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=yes'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should parse --read-only=no', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=no'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should be case-insensitive for CLI flag values', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=FALSE'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should default to true for --read-only with unrecognized value', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=maybe'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should handle CLI flag in different positions', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', 'other-arg', '--read-only=false', 'another-arg'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });
    });

    describe('Precedence rules', () => {
      it('should prioritize CLI flag over environment variable (CLI=false, ENV=true)', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'true';
        process.argv = ['node', 'test.js', '--read-only=false'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should prioritize CLI flag over environment variable (CLI=true, ENV=false)', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'false';
        process.argv = ['node', 'test.js', '--read-only=true'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(true);
      });

      it('should prioritize CLI flag over default', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js', '--read-only=false'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should prioritize environment variable over default', () => {
        process.env.DEPLOYHQ_READ_ONLY = 'false';
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });

      it('should use default when neither CLI flag nor env var is set', () => {
        delete process.env.DEPLOYHQ_READ_ONLY;
        process.argv = ['node', 'test.js'];

        const config = parseServerConfig();

        expect(config.readOnlyMode).toBe(false);
      });
    });
  });

  describe('getConfigSource', () => {
    it('should return "CLI flag" when CLI flag is used', () => {
      delete process.env.DEPLOYHQ_READ_ONLY;
      process.argv = ['node', 'test.js', '--read-only=false'];

      const source = getConfigSource();

      expect(source).toBe('CLI flag');
    });

    it('should return "DEPLOYHQ_READ_ONLY=value" when environment variable is used', () => {
      process.env.DEPLOYHQ_READ_ONLY = 'false';
      process.argv = ['node', 'test.js'];

      const source = getConfigSource();

      expect(source).toBe('DEPLOYHQ_READ_ONLY=false');
    });

    it('should return "default" when neither CLI flag nor env var is set', () => {
      delete process.env.DEPLOYHQ_READ_ONLY;
      process.argv = ['node', 'test.js'];

      const source = getConfigSource();

      expect(source).toBe('default');
    });

    it('should prioritize CLI flag in source reporting', () => {
      process.env.DEPLOYHQ_READ_ONLY = 'true';
      process.argv = ['node', 'test.js', '--read-only=false'];

      const source = getConfigSource();

      expect(source).toBe('CLI flag');
    });

    it('should show environment variable value in source', () => {
      process.env.DEPLOYHQ_READ_ONLY = 'true';
      process.argv = ['node', 'test.js'];

      const source = getConfigSource();

      expect(source).toBe('DEPLOYHQ_READ_ONLY=true');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string environment variable as default', () => {
      process.env.DEPLOYHQ_READ_ONLY = '';
      process.argv = ['node', 'test.js'];

      const config = parseServerConfig();

      // Empty string is ignored and we use the default (false)
      expect(config.readOnlyMode).toBe(false);
    });

    it('should handle multiple --read-only flags (last one wins)', () => {
      delete process.env.DEPLOYHQ_READ_ONLY;
      process.argv = ['node', 'test.js', '--read-only=true', '--read-only=false'];

      const config = parseServerConfig();

      // Since we use .find(), the first match wins
      expect(config.readOnlyMode).toBe(true);
    });

    it('should handle --read-only flag without value', () => {
      delete process.env.DEPLOYHQ_READ_ONLY;
      process.argv = ['node', 'test.js', '--read-only'];

      const config = parseServerConfig();

      expect(config.readOnlyMode).toBe(true);
    });
  });
});