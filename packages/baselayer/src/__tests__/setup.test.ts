import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setup } from '../index.js';
import type { OutfitterConfig } from '../types/index.js';

describe('baselayer setup', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'baselayer-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should generate default configuration when no config file exists', async () => {
    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.config.environment).toBe('typescript-library');
      expect(result.data.config.codeStyle.lineWidth).toBe(100);
      expect(result.data.generatedFiles).toContain('biome.json');
      expect(result.data.generatedFiles).toContain('eslint.config.js');
    }
  });

  it('should use custom configuration when config file exists', async () => {
    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const customConfig: Partial<OutfitterConfig> = {
      codeStyle: {
        indentWidth: 4,
        lineWidth: 120,
        quoteStyle: 'double',
        trailingCommas: 'none',
        semicolons: 'never',
      },
      strictness: 'relaxed',
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.config.codeStyle.indentWidth).toBe(4);
      expect(result.data.config.codeStyle.lineWidth).toBe(120);
      expect(result.data.config.codeStyle.quoteStyle).toBe('double');
      expect(result.data.config.strictness).toBe('relaxed');
    }
  });

  it('should handle dry run mode', async () => {
    const result = await setup({ cwd: tempDir, dryRun: true });

    expect(result.success).toBe(true);
    if (result.success) {
      // Should report files that would be generated
      expect(result.data.generatedFiles.length).toBeGreaterThan(0);
    }
  });

  it('should validate configuration and reject invalid values', async () => {
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const invalidConfig = {
      codeStyle: {
        indentWidth: 20, // Invalid - too large
        lineWidth: 300, // Invalid - too large
      },
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(invalidConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
