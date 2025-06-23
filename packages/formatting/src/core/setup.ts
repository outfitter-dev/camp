/**
 * Main setup orchestration
 */

import { readFile, writeFile, access, constants } from 'node:fs/promises';
import { join } from 'node:path';
import type { SetupOptions, SetupResult } from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';
import { detectAvailableFormatters } from '../utils/detection.js';
import { getPreset } from './presets.js';
import { generateConfigs, generatePackageJsonScripts } from './generator.js';

/**
 * Main setup function - orchestrates the entire formatting setup process
 */
export async function setup(options: SetupOptions = {}): Promise<Result<SetupResult, Error>> {
  const {
    preset = 'standard',
    presetConfig,
    formatters: requestedFormatters,
    installMissing = false,
    updateScripts = true,
    targetDir = process.cwd(),
    dryRun = false,
    verbose = false,
  } = options;

  const result: SetupResult = {
    success: false,
    configs: [],
    scripts: {},
    errors: [],
    warnings: [],
    info: [],
  };

  try {
    // Step 1: Get preset configuration
    const basePreset = getPreset(preset);
    const presetConfigResolved = presetConfig 
      ? { ...basePreset, ...presetConfig }
      : basePreset;
    if (verbose) {
      result.info.push(`Using preset: ${presetConfigResolved.name}`);
    }

    // Step 2: Detect available formatters
    const detectionResult = await detectAvailableFormatters();
    if (!detectionResult.success) {
      result.errors.push(`Failed to detect formatters: ${detectionResult.error.message}`);
      return success(result);
    }

    const { available, missing } = detectionResult.data;
    
    if (verbose) {
      result.info.push(`Available formatters: ${available.join(', ') || 'none'}`);
      if (missing.length > 0) {
        result.info.push(`Missing formatters: ${missing.join(', ')}`);
      }
    }

    // Step 3: Determine which formatters to configure
    const formattersToSetup = requestedFormatters 
      ? requestedFormatters.filter(f => available.includes(f))
      : available;

    if (formattersToSetup.length === 0) {
      result.warnings.push('No formatters available for setup');
      if (missing.length > 0 && !installMissing) {
        result.info.push('Consider installing formatters or use --install-missing flag');
      }
      return success(result);
    }

    if (verbose) {
      result.info.push(`Setting up formatters: ${formattersToSetup.join(', ')}`);
    }

    // Step 4: Generate configuration files
    const configsResult = await generateConfigs(formattersToSetup, presetConfigResolved);
    if (!configsResult.success) {
      result.errors.push(`Failed to generate configs: ${configsResult.error.message}`);
      return success(result);
    }

    // Step 5: Write configuration files
    for (const config of configsResult.data) {
      const filePath = join(targetDir, config.path);
      
      // Check if file already exists
      const exists = await fileExists(filePath);
      if (exists) {
        result.warnings.push(`File already exists: ${config.path} (skipping)`);
        continue;
      }

      if (!dryRun) {
        try {
          await writeFile(filePath, config.content, 'utf-8');
          result.info.push(`Generated: ${config.path}`);
        } catch (error) {
          result.errors.push(`Failed to write ${config.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }
      } else {
        result.info.push(`Would generate: ${config.path}`);
      }

      result.configs.push(config);
    }

    // Step 6: Update package.json scripts
    if (updateScripts) {
      const scripts = generatePackageJsonScripts(formattersToSetup);
      result.scripts = scripts;

      if (!dryRun) {
        const updateResult = await updatePackageJsonScripts(targetDir, scripts);
        if (updateResult.success) {
          result.info.push('Updated package.json scripts');
        } else {
          result.warnings.push(`Failed to update package.json: ${updateResult.error.message}`);
        }
      } else {
        result.info.push('Would update package.json scripts');
      }
    }

    // Step 7: Final success check
    result.success = result.errors.length === 0;
    
    if (result.success) {
      result.info.push(`Setup completed successfully for ${formattersToSetup.length} formatter(s)`);
    }

    return success(result);
  } catch (error) {
    result.errors.push(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return success(result);
  }
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update package.json with new scripts
 */
async function updatePackageJsonScripts(
  targetDir: string,
  scripts: Record<string, string>
): Promise<Result<void, Error>> {
  try {
    const packageJsonPath = join(targetDir, 'package.json');
    
    // Check if package.json exists
    if (!(await fileExists(packageJsonPath))) {
      return failure(makeError('VALIDATION_ERROR', 'package.json not found'));
    }

    // Read and parse package.json
    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      ...scripts,
    };

    // Write back to file
    const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
    await writeFile(packageJsonPath, updatedContent, 'utf-8');

    return success(undefined);
  } catch (error) {
    return failure(makeError(
      'OPERATION_FAILED',
      'Failed to update package.json',
      { cause: error }
    ));
  }
}