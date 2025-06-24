/**
 * YAML preset configuration system
 * Loads and processes YAML-based presets with "common" and "raw" sections
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { PresetConfig } from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';

/**
 * YAML preset structure with common formatting concepts and raw tool-specific configs
 */
export interface YamlPreset {
  name: string;
  description?: string;
  extends?: string;
  common?: {
    indentation?: {
      style?: 'space' | 'tab';
      width?: number;
    };
    lineWidth?: number;
    quotes?: {
      style?: 'single' | 'double';
      jsx?: 'single' | 'double';
    };
    semicolons?: 'always' | 'asNeeded';
    trailingComma?: 'all' | 'es5' | 'none';
    bracketSpacing?: boolean;
    arrowParens?: 'always' | 'asNeeded';
    endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';
  };
  raw?: {
    prettier?: Record<string, unknown>;
    biome?: Record<string, unknown>;
    remark?: Record<string, unknown>;
    eslint?: Record<string, unknown>;
    markdownlint?: Record<string, unknown>;
  };
}

/**
 * Load a YAML preset file
 */
export async function loadYamlPreset(path: string): Promise<Result<YamlPreset, Error>> {
  try {
    const content = await readFile(path, 'utf-8');
    const preset = parseYaml(content) as YamlPreset;
    
    if (!preset.name) {
      return failure(makeError('VALIDATION_ERROR', 'Preset must have a name'));
    }
    
    return success(preset);
  } catch (error) {
    return failure(
      makeError('INTERNAL_ERROR', `Failed to load preset: ${path}`, { cause: error })
    );
  }
}

/**
 * Convert YAML preset to PresetConfig
 */
export function yamlPresetToConfig(preset: YamlPreset): PresetConfig {
  const { common = {} } = preset;
  
  return {
    name: preset.name as 'standard' | 'strict' | 'relaxed',
    lineWidth: common.lineWidth ?? 80,
    indentation: {
      style: common.indentation?.style ?? 'space',
      width: common.indentation?.width ?? 2,
    },
    quotes: {
      style: common.quotes?.style ?? 'single',
      jsx: common.quotes?.jsx ?? 'double',
    },
    semicolons: common.semicolons ?? 'always',
    trailingComma: common.trailingComma ?? 'all',
    bracketSpacing: common.bracketSpacing ?? true,
    arrowParens: common.arrowParens ?? 'always',
    endOfLine: common.endOfLine ?? 'lf',
  };
}

/**
 * Merge raw tool-specific configurations with generated configs
 */
export function mergeRawConfig(
  generated: Record<string, unknown>,
  raw?: Record<string, unknown>,
): Record<string, unknown> {
  if (!raw) {
    return generated;
  }
  
  // Deep merge with raw config taking precedence
  return deepMerge(generated, raw);
}

/**
 * Deep merge two objects (raw config takes precedence)
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Resolve preset inheritance (extends field)
 */
export async function resolvePresetInheritance(
  preset: YamlPreset,
  presetsDir: string,
): Promise<Result<YamlPreset, Error>> {
  if (!preset.extends) {
    return success(preset);
  }
  
  // Load parent preset
  const parentPath = join(presetsDir, `${preset.extends}.yaml`);
  const parentResult = await loadYamlPreset(parentPath);
  
  if (!parentResult.success) {
    return failure(
      makeError('NOT_FOUND', `Parent preset not found: ${preset.extends}`, {
        cause: parentResult.error,
      })
    );
  }
  
  // Recursively resolve parent's inheritance
  const resolvedParentResult = await resolvePresetInheritance(parentResult.data, presetsDir);
  if (!resolvedParentResult.success) {
    return resolvedParentResult;
  }
  
  const parent = resolvedParentResult.data;
  
  // Merge with parent (child takes precedence)
  const merged: YamlPreset = {
    ...parent,
    ...preset,
    common: deepMerge(parent.common || {}, preset.common || {}) as YamlPreset['common'],
    raw: {
      prettier: deepMerge(parent.raw?.prettier || {}, preset.raw?.prettier || {}),
      biome: deepMerge(parent.raw?.biome || {}, preset.raw?.biome || {}),
      remark: deepMerge(parent.raw?.remark || {}, preset.raw?.remark || {}),
      eslint: deepMerge(parent.raw?.eslint || {}, preset.raw?.eslint || {}),
      markdownlint: deepMerge(parent.raw?.markdownlint || {}, preset.raw?.markdownlint || {}),
    },
  };
  
  return success(merged);
}