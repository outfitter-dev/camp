import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  CommonEnvSchemas,
  createEnvSchema,
  createNextEnvSchema,
  createNodeEnvSchema,
  parseEnvVar,
  validateRequiredEnvVars,
} from '../env';
import { ErrorCode } from '../error';

describe('Environment validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear environment
    process.env = {};
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('createEnvSchema', () => {
    it('should validate correct environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

      const result = createEnvSchema({
        NODE_ENV: CommonEnvSchemas.NODE_ENV,
        PORT: CommonEnvSchemas.PORT,
        DATABASE_URL: CommonEnvSchemas.DATABASE_URL,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe(3000);
        expect(result.data.DATABASE_URL).toBe('postgresql://localhost:5432/test');
      }
    });

    it('should fail with missing required variables', () => {
      const result = createEnvSchema({
        DATABASE_URL: CommonEnvSchemas.DATABASE_URL,
        API_KEY: CommonEnvSchemas.API_KEY,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.details?.missingVariables).toEqual(['DATABASE_URL', 'API_KEY']);
      }
    });

    it('should use default values when available', () => {
      const result = createEnvSchema({
        NODE_ENV: CommonEnvSchemas.NODE_ENV,
        PORT: CommonEnvSchemas.PORT,
        LOG_LEVEL: CommonEnvSchemas.LOG_LEVEL,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
        expect(result.data.PORT).toBe(3000);
        expect(result.data.LOG_LEVEL).toBe('info');
      }
    });
  });

  describe('createNextEnvSchema', () => {
    it('should validate Next.js environment with additional schema', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_SECRET = 'super-secret-key-that-is-long-enough';

      const result = createNextEnvSchema({
        CUSTOM_VAR: z.string().default('default-value'),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('production');
        expect(result.data.PORT).toBe(3000); // default
        expect(result.data.CUSTOM_VAR).toBe('default-value'); // default
      }
    });
  });

  describe('createNodeEnvSchema', () => {
    it('should validate Node.js environment', () => {
      process.env.NODE_ENV = 'test';
      process.env.LOG_LEVEL = 'debug';

      const result = createNodeEnvSchema({
        DB_HOST: z.string().default('localhost'),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('test');
        expect(result.data.LOG_LEVEL).toBe('debug');
        expect(result.data.DB_HOST).toBe('localhost');
      }
    });
  });

  describe('parseEnvVar', () => {
    it('should parse a single environment variable', () => {
      process.env.TEST_PORT = '8080';

      const result = parseEnvVar('TEST_PORT', z.coerce.number());

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(8080);
      }
    });

    it('should use default value when variable is undefined', () => {
      const result = parseEnvVar('UNDEFINED_VAR', z.string(), 'default');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('default');
      }
    });

    it('should fail with invalid value', () => {
      process.env.INVALID_PORT = 'not-a-number';

      const result = parseEnvVar('INVALID_PORT', z.coerce.number());

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.details?.variable).toBe('INVALID_PORT');
      }
    });
  });

  describe('validateRequiredEnvVars', () => {
    it('should validate all required variables are present', () => {
      process.env.VAR1 = 'value1';
      process.env.VAR2 = 'value2';

      const result = validateRequiredEnvVars('VAR1', 'VAR2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          VAR1: 'value1',
          VAR2: 'value2',
        });
      }
    });

    it('should fail when required variables are missing', () => {
      process.env.VAR1 = 'value1';

      const result = validateRequiredEnvVars('VAR1', 'VAR2', 'VAR3');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.details?.missingVariables).toEqual(['VAR2', 'VAR3']);
        expect(result.error.message).toContain('VAR2, VAR3');
      }
    });
  });

  describe('CommonEnvSchemas', () => {
    it('should provide correct schema for NODE_ENV', () => {
      const validValues = ['development', 'production', 'test'];

      for (const value of validValues) {
        const result = CommonEnvSchemas.NODE_ENV.safeParse(value);
        expect(result.success).toBe(true);
      }

      const invalidResult = CommonEnvSchemas.NODE_ENV.safeParse('invalid');
      expect(invalidResult.success).toBe(false);
    });

    it('should coerce PORT to number', () => {
      const result = CommonEnvSchemas.PORT.safeParse('3000');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(3000);
      }
    });

    it('should validate DATABASE_URL as URL', () => {
      const validUrl = 'postgresql://user:pass@localhost:5432/db';
      const result = CommonEnvSchemas.DATABASE_URL.safeParse(validUrl);
      expect(result.success).toBe(true);

      const invalidResult = CommonEnvSchemas.DATABASE_URL.safeParse('not-a-url');
      expect(invalidResult.success).toBe(false);
    });
  });
});
