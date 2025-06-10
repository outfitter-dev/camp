import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import {
  createEnvSchema,
  createNextEnvSchema,
  createNodeEnvSchema,
  parseEnvVar,
  validateRequiredEnvVars,
  CommonEnvSchemas,
} from '../zod/env';
import { fromZod } from '../zod/error';
import { ErrorCode } from '../error';
import { isSuccess, isFailure, failure, success } from '../result';

describe('Zod-dependent utilities', () => {
  describe('fromZod', () => {
    it('should convert Zod errors to AppError', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const parseResult = schema.safeParse({
        email: 'invalid-email',
        age: 15,
      });

      if (!parseResult.success) {
        const appError = fromZod(parseResult.error);

        expect(appError.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(appError.message).toBe('Validation failed');
        expect(appError.details?.issues).toBeDefined();
        expect(Array.isArray(appError.details?.issues)).toBe(true);
      }
    });
  });

  describe('Environment validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = {};
    });

    afterEach(() => {
      process.env = originalEnv;
    });

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
        expect(result.data.DATABASE_URL).toBe(
          'postgresql://localhost:5432/test'
        );
      }
    });
  });

  describe('API request validation integration', () => {
    it('should integrate with validation and error reporting', () => {
      const validateApiRequest = (data: unknown) => {
        const schema = z.object({
          username: z.string().min(3).max(20),
          email: z.string().email(),
          age: z.number().min(13).max(120),
        });

        const parseResult = schema.safeParse(data);
        if (!parseResult.success) {
          return failure(fromZod(parseResult.error));
        }

        return success(parseResult.data);
      };

      const validData = {
        username: 'johndoe',
        email: 'john@example.com',
        age: 25,
      };

      const validResult = validateApiRequest(validData);
      expect(isSuccess(validResult)).toBe(true);

      const invalidData = {
        username: 'jo',
        email: 'invalid-email',
        age: 5,
      };

      const invalidResult = validateApiRequest(invalidData);
      expect(isFailure(invalidResult)).toBe(true);
      if (!invalidResult.success) {
        expect(invalidResult.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(invalidResult.error.details?.issues).toHaveLength(3);
      }
    });
  });
});
