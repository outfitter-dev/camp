/**
 * Smart config merging utilities
 */
import { Result, success, failure, makeError, isSuccess, isFailure, ErrorCode } from '@outfitter/contracts';
import { readJSON, writeJSON, fileExists } from '../utils/file-system';

export interface MergeOptions {
  strategy?: 'merge' | 'replace' | 'preserve';
  arrays?: 'concat' | 'replace' | 'unique';
  backup?: boolean;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
  options: MergeOptions = {}
): T {
  const { strategy = 'merge', arrays = 'unique' } = options;

  if (strategy === 'replace') {
    return source as T;
  }

  if (strategy === 'preserve') {
    return target;
  }

  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      switch (arrays) {
        case 'concat':
          result[key] = [...targetValue, ...sourceValue] as any;
          break;
        case 'replace':
          result[key] = sourceValue as any;
          break;
        case 'unique':
          result[key] = [...new Set([...targetValue, ...sourceValue])] as any;
          break;
      }
    } else if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue, options) as any;
    } else {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

/**
 * Merge JSON file with new data
 */
export async function mergeJSONFile(
  filePath: string,
  newData: any,
  options: MergeOptions = {}
): Promise<Result<void, any>> {
  const existsResult = await fileExists(filePath);
  if (isFailure(existsResult)) {
    return failure(existsResult.error);
  }

  let existingData = {};
  if (existsResult.data) {
    const readResult = await readJSON(filePath);
    if (isFailure(readResult)) {
      return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read existing file: ${readResult.error.message}`));
    }
    existingData = readResult.data;
  }

  const merged = deepMerge(existingData, newData, options);

  const writeResult = await writeJSON(filePath, merged);
  if (isFailure(writeResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to write merged file: ${writeResult.error.message}`));
  }

  return success(undefined);
}

/**
 * Merge VS Code settings
 */
export async function mergeVSCodeSettings(
  newSettings: any,
  options: MergeOptions = {}
): Promise<Result<void, any>> {
  return mergeJSONFile('.vscode/settings.json', newSettings, {
    ...options,
    arrays: 'unique',
  });
}

/**
 * Merge VS Code extensions
 */
export async function mergeVSCodeExtensions(
  newExtensions: { recommendations: string[] },
  options: MergeOptions = {}
): Promise<Result<void, any>> {
  return mergeJSONFile('.vscode/extensions.json', newExtensions, {
    ...options,
    arrays: 'unique',
  });
}

/**
 * Merge package.json scripts
 */
export async function mergePackageScripts(
  newScripts: Record<string, string>,
  options: { overwrite?: boolean } = {}
): Promise<Result<void, any>> {
  const { overwrite = false } = options;

  const pkgResult = await readJSON<any>('package.json');
  if (isFailure(pkgResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read package.json: ${pkgResult.error.message}`));
  }

  const pkg = pkgResult.data;
  pkg.scripts = pkg.scripts || {};

  for (const [name, command] of Object.entries(newScripts)) {
    if (!pkg.scripts[name] || overwrite) {
      pkg.scripts[name] = command;
    }
  }

  const writeResult = await writeJSON('package.json', pkg);
  if (isFailure(writeResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to write package.json: ${writeResult.error.message}`));
  }

  return success(undefined);
}

/**
 * Remove fields from JSON file
 */
export async function removeJSONFields(
  filePath: string,
  fields: string[]
): Promise<Result<void, any>> {
  const existsResult = await fileExists(filePath);
  if (isFailure(existsResult)) {
    return failure(existsResult.error);
  }

  if (!existsResult.data) {
    return success(undefined); // File doesn't exist, nothing to remove
  }

  const readResult = await readJSON<any>(filePath);
  if (isFailure(readResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read file: ${readResult.error.message}`));
  }

  const data = readResult.data;
  for (const field of fields) {
    delete data[field];
  }

  const writeResult = await writeJSON(filePath, data);
  if (isFailure(writeResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to write file: ${writeResult.error.message}`));
  }

  return success(undefined);
}

/**
 * Remove embedded configs from package.json
 */
export async function removeEmbeddedConfigs(): Promise<Result<void, any>> {
  const embeddedConfigs = [
    'eslintConfig',
    'prettier',
    'stylelint',
    'xo',
    'standard',
    'jest',
  ];

  return removeJSONFields('package.json', embeddedConfigs);
}