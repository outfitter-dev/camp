import { describe, it, expect } from 'vitest';
import {
  generateBiomeConfig,
  generatePrettierConfig,
  generateESLintConfig,
} from '../generators/index.js';
import { DEFAULT_CONFIG } from '../types/index.js';
import type { OutfitterConfig } from '../types/index.js';

describe('configuration generators', () => {
  describe('generateBiomeConfig', () => {
    it('should generate base configuration from defaults', () => {
      const config = generateBiomeConfig(DEFAULT_CONFIG);

      expect(config.formatter?.indentWidth).toBe(2);
      expect(config.formatter?.lineWidth).toBe(100);
      expect(config.javascript?.formatter?.quoteStyle).toBe('single');
      expect(config.javascript?.formatter?.semicolons).toBe('always');
      expect(config.javascript?.formatter?.trailingCommas).toBe('all');
    });

    it('should apply custom code style preferences', () => {
      const customConfig: OutfitterConfig = {
        ...DEFAULT_CONFIG,
        codeStyle: {
          indentWidth: 4,
          lineWidth: 120,
          quoteStyle: 'double',
          trailingCommas: 'es5',
          semicolons: 'never',
        },
      };

      const config = generateBiomeConfig(customConfig);

      expect(config.formatter?.indentWidth).toBe(4);
      expect(config.formatter?.lineWidth).toBe(120);
      expect(config.javascript?.formatter?.quoteStyle).toBe('double');
      expect(config.javascript?.formatter?.semicolons).toBe('never');
      expect(config.javascript?.formatter?.trailingCommas).toBe('es5');
    });

    it('should apply tool-specific overrides', () => {
      const configWithOverrides: OutfitterConfig = {
        ...DEFAULT_CONFIG,
        overrides: {
          biome: {
            linter: {
              rules: {
                suspicious: {
                  noConsole: 'error',
                },
              },
            },
          },
        },
      };

      const config = generateBiomeConfig(configWithOverrides);

      expect(config.linter?.rules?.suspicious?.noConsole).toBe('error');
    });

    it('should adjust rules based on strictness level', () => {
      const pedanticConfig: OutfitterConfig = {
        ...DEFAULT_CONFIG,
        strictness: 'pedantic',
      };

      const config = generateBiomeConfig(pedanticConfig);

      expect(config.linter?.rules?.suspicious?.noExplicitAny).toBe('error');
    });
  });

  describe('generatePrettierConfig', () => {
    it('should generate configuration with markdown overrides', () => {
      const config = generatePrettierConfig(DEFAULT_CONFIG);

      expect(config.printWidth).toBe(100);
      expect(config.singleQuote).toBe(true);
      expect(config.overrides).toBeDefined();

      const markdownOverride = config.overrides?.find((o) => o.files === '*.md');
      expect(markdownOverride?.options.printWidth).toBe(80);
      expect(markdownOverride?.options.proseWrap).toBe('always');
    });
  });

  describe('generateESLintConfig', () => {
    it('should generate bridge configuration with ignores', () => {
      const config = generateESLintConfig(DEFAULT_CONFIG);

      expect(Array.isArray(config)).toBe(true);
      expect(config.length).toBeGreaterThan(0);

      // Should include ignore patterns for files handled by Biome
      const ignoreConfig = config.find((c) => c.ignores);
      expect(ignoreConfig?.ignores).toContain('**/*.{js,jsx,ts,tsx}');
    });
  });
});
