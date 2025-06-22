import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSuccess, isFailure } from '@outfitter/contracts';
import type { IFormatter } from './base.test.js';

// Mock Prettier module
vi.mock('prettier', () => ({
  format: vi.fn(),
  resolveConfig: vi.fn(),
  getFileInfo: vi.fn(),
  getSupportInfo: vi.fn(),
}));

// Prettier formatter implementation (to be implemented)
class PrettierFormatter implements IFormatter {
  readonly name = 'prettier';
  
  async isAvailable() {
    // Will be implemented
    throw new Error('Not implemented');
  }

  async getVersion() {
    // Will be implemented
    throw new Error('Not implemented');
  }

  async format(code: string, language: string, options?: Record<string, unknown>) {
    // Will be implemented
    throw new Error('Not implemented');
  }

  getSupportedLanguages() {
    return [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'json',
      'jsonc',
      'css',
      'scss',
      'less',
      'html',
      'markdown',
      'yaml',
      'graphql',
    ];
  }
}

describe('PrettierFormatter', () => {
  let formatter: PrettierFormatter;

  beforeEach(() => {
    formatter = new PrettierFormatter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when prettier is installed', async () => {
      const result = await formatter.isAvailable();
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when prettier is not installed', async () => {
      // Mock dynamic import failure
      vi.doMock('prettier', () => {
        throw new Error('Cannot find module');
      });

      const result = await formatter.isAvailable();
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('getVersion', () => {
    it('should return prettier version', async () => {
      const result = await formatter.getVersion();
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    it('should handle missing prettier gracefully', async () => {
      vi.doMock('prettier', () => {
        throw new Error('Cannot find module');
      });

      const result = await formatter.getVersion();
      
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('FORMATTER_NOT_FOUND');
      }
    });
  });

  describe('format', () => {
    it('should format JavaScript code', async () => {
      const code = 'const x=1;const y=2;';
      const result = await formatter.format(code, 'javascript');
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('const x = 1;\nconst y = 2;\n');
      }
    });

    it('should format TypeScript code', async () => {
      const code = 'interface User{name:string;age:number}';
      const result = await formatter.format(code, 'typescript');
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toContain('interface User {\n');
        expect(result.data).toContain('  name: string;\n');
        expect(result.data).toContain('  age: number;\n');
      }
    });

    it('should format JSON', async () => {
      const code = '{"name":"test","value":123}';
      const result = await formatter.format(code, 'json');
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('{\n  "name": "test",\n  "value": 123\n}\n');
      }
    });

    it('should use custom options', async () => {
      const code = 'const x = 1;';
      const options = {
        semi: false,
        singleQuote: true,
        tabWidth: 4,
      };
      
      const result = await formatter.format(code, 'javascript', options);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('const x = 1\n');
      }
    });

    it('should handle syntax errors', async () => {
      const code = 'const x = {';
      const result = await formatter.format(code, 'javascript');
      
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('FORMATTER_FAILED');
        expect(result.error.message).toContain('Unexpected end of input');
      }
    });

    it('should handle unsupported languages', async () => {
      const code = 'SELECT * FROM users;';
      const result = await formatter.format(code, 'sql');
      
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('FORMATTER_FAILED');
        expect(result.error.message).toContain('Unsupported language');
      }
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = formatter.getSupportedLanguages();
      
      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('html');
      expect(languages).toContain('css');
      expect(languages).toContain('json');
      expect(languages).toContain('yaml');
      expect(languages).toContain('markdown');
    });
  });

  describe('ESM import handling', () => {
    it('should handle Prettier v3 ESM-only import', async () => {
      // Prettier v3 is ESM-only, requiring dynamic import
      const code = 'const x = 1;';
      const result = await formatter.format(code, 'javascript');
      
      expect(isSuccess(result)).toBe(true);
    });

    it('should provide helpful error for Node.js version issues', async () => {
      // Mock import error for old Node.js
      vi.doMock('prettier', () => {
        const error = new Error('Cannot use import statement outside a module');
        error.code = 'ERR_REQUIRE_ESM';
        throw error;
      });

      const result = await formatter.format('const x = 1;', 'javascript');
      
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.message).toContain('Node.js');
        expect(result.error.message).toContain('18.12');
      }
    });
  });
});