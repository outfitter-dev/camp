import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'path';
import { 
  Result, 
  success, 
  failure, 
  makeError,
  isSuccess,
  isFailure,
  type AppError 
} from '@outfitter/contracts';

// Types for the config reader (to be implemented)
interface RightdownConfigV2 {
  version: 2;
  preset?: 'strict' | 'standard' | 'relaxed';
  rules?: Record<string, unknown>;
  formatters?: {
    default?: string;
    languages?: Record<string, string>;
  };
  formatterOptions?: Record<string, Record<string, unknown>>;
  ignores?: Array<string>;
  terminology?: Array<{
    incorrect: string;
    correct: string;
    caseSensitive?: boolean;
  }>;
  output?: {
    diagnostics?: boolean;
    progress?: boolean;
    color?: boolean;
  };
}

interface RightdownConfigV1 {
  preset?: string;
  rules?: Record<string, unknown>;
  ignores?: Array<string>;
  terminology?: Array<{
    incorrect: string;
    correct: string;
    caseSensitive?: boolean;
  }>;
}

type RightdownConfig = RightdownConfigV1 | RightdownConfigV2;

// Mock implementation for tests (to be replaced with real implementation)
class ConfigReader {
  async read(path: string): Promise<Result<RightdownConfig, AppError>> {
    // This will be implemented
    throw new Error('Not implemented');
  }

  isV2Config(config: RightdownConfig): config is RightdownConfigV2 {
    return 'version' in config && config.version === 2;
  }

  validateConfig(config: unknown): Result<RightdownConfig, AppError> {
    // This will be implemented
    throw new Error('Not implemented');
  }
}

describe('ConfigReader', () => {
  let configReader: ConfigReader;
  const fixturesPath = join(__dirname, '../fixtures/configs');

  beforeEach(() => {
    configReader = new ConfigReader();
  });

  describe('read', () => {
    it('should read and parse v1 legacy config', async () => {
      const configPath = join(fixturesPath, 'v1-legacy.yaml');
      const result = await configReader.read(configPath);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const config = result.data;
        expect(configReader.isV2Config(config)).toBe(false);
        expect(config.preset).toBe('standard');
        expect(config.rules).toBeDefined();
        expect(config.ignores).toHaveLength(3);
      }
    });

    it('should read and parse v2 basic config', async () => {
      const configPath = join(fixturesPath, 'v2-basic.yaml');
      const result = await configReader.read(configPath);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const config = result.data;
        expect(configReader.isV2Config(config)).toBe(true);
        if (configReader.isV2Config(config)) {
          expect(config.version).toBe(2);
          expect(config.preset).toBe('standard');
          expect(config.formatters?.default).toBe('prettier');
          expect(config.formatters?.languages?.javascript).toBe('biome');
        }
      }
    });

    it('should read and parse v2 full config', async () => {
      const configPath = join(fixturesPath, 'v2-full.yaml');
      const result = await configReader.read(configPath);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const config = result.data;
        expect(configReader.isV2Config(config)).toBe(true);
        if (configReader.isV2Config(config)) {
          expect(config.version).toBe(2);
          expect(config.preset).toBe('strict');
          expect(config.formatters?.languages?.javascript).toBe('biome');
          expect(config.formatters?.languages?.html).toBe('prettier');
          expect(config.formatterOptions?.prettier?.printWidth).toBe(80);
          expect(config.formatterOptions?.biome?.indentWidth).toBe(2);
        }
      }
    });

    it('should fail on non-existent file', async () => {
      const configPath = join(fixturesPath, 'does-not-exist.yaml');
      const result = await configReader.read(configPath);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
      }
    });

    it('should fail on invalid YAML', async () => {
      // We'll need to create a fixture with invalid YAML
      const configPath = join(fixturesPath, 'invalid-yaml.yaml');
      const result = await configReader.read(configPath);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_YAML');
      }
    });
  });

  describe('validateConfig', () => {
    it('should validate v2 config with all required fields', () => {
      const config = {
        version: 2,
        preset: 'standard',
        formatters: {
          default: 'prettier',
          languages: {
            javascript: 'biome',
          },
        },
      };
      
      const result = configReader.validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid v2 config', () => {
      const config = {
        version: 2,
        preset: 'not-a-valid-preset',
        formatters: {
          default: 123, // Should be string
        },
      };
      
      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
      }
    });

    it('should fail on v2 config with invalid formatter options', () => {
      const config = {
        version: 2,
        formatters: {
          languages: {
            javascript: ['biome', 'prettier'], // Should be single formatter
          },
        },
      };
      
      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
    });

    it('should handle v1 config without version field', () => {
      const config = {
        preset: 'standard',
        rules: {
          'line-length': false,
        },
      };
      
      const result = configReader.validateConfig(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(configReader.isV2Config(result.data)).toBe(false);
      }
    });

    it('should fail on config with wrong version number', () => {
      const config = {
        version: 3, // Not supported yet
        preset: 'standard',
      };
      
      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNSUPPORTED_VERSION');
      }
    });
  });

  describe('type guards', () => {
    it('should correctly identify v2 config', () => {
      const v2Config: RightdownConfig = {
        version: 2,
        preset: 'standard',
      };
      
      expect(configReader.isV2Config(v2Config)).toBe(true);
    });

    it('should correctly identify v1 config', () => {
      const v1Config: RightdownConfig = {
        preset: 'standard',
        rules: {},
      };
      
      expect(configReader.isV2Config(v1Config)).toBe(false);
    });
  });
});