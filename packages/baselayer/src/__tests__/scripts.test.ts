import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setup } from '../index.js';
import type { OutfitterConfig } from '../types/index.js';

describe('package.json scripts generation', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'baselayer-scripts-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should include markdown-medic in lint scripts when markdown tool is markdown-medic', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });
    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          typescript: 'biome',
          markdown: 'markdown-medic',
        },
      },
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.generatedFiles).toContain('package.json (scripts updated)');

      // Check that package.json was updated with markdown-medic scripts
      const updatedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf-8'));
      expect(updatedPackageJson.scripts.lint).toContain('mdmedic');
      expect(updatedPackageJson.scripts['lint:fix']).toContain('mdmedic --fix');
    }
  });

  it('should not include markdown-medic in scripts when markdown tool is prettier', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });
    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          typescript: 'biome',
          markdown: 'prettier',
        },
      },
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      // Check that package.json was updated but without markdown-medic
      const updatedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf-8'));
      expect(updatedPackageJson.scripts.lint).not.toContain('mdmedic');
      expect(updatedPackageJson.scripts['lint:fix']).not.toContain('mdmedic');
    }
  });

  it('should include markdown-medic in ESLint-based scripts', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });
    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          typescript: 'eslint',
          markdown: 'markdown-medic',
        },
      },
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      // Check that package.json was updated with ESLint + markdown-medic scripts
      const updatedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf-8'));
      expect(updatedPackageJson.scripts.lint).toContain('eslint');
      expect(updatedPackageJson.scripts.lint).toContain('mdmedic');
      expect(updatedPackageJson.scripts['lint:fix']).toContain('eslint');
      expect(updatedPackageJson.scripts['lint:fix']).toContain('mdmedic --fix');
    }
  });
});
