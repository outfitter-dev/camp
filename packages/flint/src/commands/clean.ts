import type { Result } from '@outfitter/contracts';
import { success, failure, makeError, isSuccess, isFailure } from '@outfitter/contracts';
import { confirm, select } from '@inquirer/prompts';
import * as pc from 'picocolors';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CleanOptions } from '../types.js';
import { detectExistingTools, type DetectedConfig } from '../core/detector.js';
import { createBackup } from '../core/backup.js';
import { removeOldConfigs } from '../core/cleanup.js';
import { cleanupDependencies } from '../core/dependency-cleanup.js';

/**
 * Clean up old configuration files
 */
export async function clean(options: CleanOptions): Promise<Result<void, Error>> {
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = join(projectRoot, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return failure(makeError('NOT_FOUND', 'No package.json found. Please run this command in a project root.'));
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // 1. Detect old configuration files
    console.log(pc.gray('Detecting configuration files...'));
    const detectionResult = await detectExistingTools(projectRoot);
    if (isFailure(detectionResult)) {
      return failure(makeError('INTERNAL_ERROR', `Detection failed: ${detectionResult.error.message}`));
    }
    const detectedTools = detectionResult.data;

    // Check for Flint-generated configs
    const flintConfigs = [
      'biome.json',
      'oxlint.json',
      '.markdownlint.json',
      '.stylelintrc.json',
      'lefthook.yml',
      'commitlint.config.js',
      '.editorconfig',
    ];

    const flintGeneratedConfigs = detectedTools.configs.filter(config => 
      flintConfigs.some(flintConfig => config.path.endsWith(flintConfig))
    );

    const oldToolConfigs = detectedTools.configs.filter(config =>
      ['eslint', 'prettier', 'husky'].includes(config.tool)
    );

    if (detectedTools.configs.length === 0) {
      console.log(pc.green('✨ No configuration files found to clean up.'));
      return success(undefined);
    }

    // Show what we found
    console.log(pc.yellow(`\nFound ${detectedTools.configs.length} configuration file(s):`));
    
    if (oldToolConfigs.length > 0) {
      console.log(pc.bold('\nOld tool configurations:'));
      oldToolConfigs.forEach(config => {
        console.log(pc.gray(`  - ${config.tool} (${config.path})`));
      });
    }

    if (flintGeneratedConfigs.length > 0) {
      console.log(pc.bold('\nFlint-generated configurations:'));
      flintGeneratedConfigs.forEach(config => {
        console.log(pc.gray(`  - ${config.path}`));
      });
    }

    // Ask what to clean
    let configsToClean: DetectedConfig[] = [];
    
    if (!options.force) {
      const cleanupMode = await select({
        message: 'What would you like to clean?',
        choices: [
          {
            name: 'All configurations',
            value: 'all',
            description: 'Remove all detected configuration files',
          },
          {
            name: 'Old tools only (ESLint, Prettier, Husky)',
            value: 'old',
            description: 'Remove only old tool configurations',
          },
          {
            name: 'Flint configurations only',
            value: 'flint',
            description: 'Remove only Flint-generated configurations',
          },
          {
            name: 'Select individually',
            value: 'select',
            description: 'Choose which configurations to remove',
          },
          {
            name: 'Cancel',
            value: 'cancel',
            description: 'Exit without making changes',
          },
        ],
      });

      switch (cleanupMode) {
        case 'all':
          configsToClean = detectedTools.configs;
          break;
        case 'old':
          configsToClean = oldToolConfigs;
          break;
        case 'flint':
          configsToClean = flintGeneratedConfigs;
          break;
        case 'select':
          // Individual selection
          for (const config of detectedTools.configs) {
            const remove = await confirm({
              message: `Remove ${config.path}?`,
              default: oldToolConfigs.includes(config),
            });
            if (remove) {
              configsToClean.push(config);
            }
          }
          break;
        case 'cancel':
          console.log(pc.yellow('Cleanup cancelled.'));
          return success(undefined);
      }

      if (configsToClean.length === 0) {
        console.log(pc.yellow('No configurations selected for cleanup.'));
        return success(undefined);
      }

      // Confirm cleanup
      console.log(pc.bold('\nThe following files will be removed:'));
      configsToClean.forEach(config => {
        console.log(pc.red(`  - ${config.path}`));
      });

      const proceed = await confirm({
        message: 'Continue with cleanup?',
        default: true,
      });

      if (!proceed) {
        console.log(pc.yellow('Cleanup cancelled.'));
        return success(undefined);
      }
    } else {
      // Force mode - clean all
      configsToClean = detectedTools.configs;
    }

    // 2. Create backup
    console.log('\n' + pc.gray('Creating backup...'));
    const backupResult = await createBackup(configsToClean);
    if (!backupResult.success) {
      return failure(makeError('INTERNAL_ERROR', `Backup failed: ${backupResult.error.message}`));
    }
    console.log(pc.green(`✓ Backup created: ${backupResult.data}`));

    // 3. Remove old files
    console.log('\n' + pc.gray('Removing configuration files...'));
    const cleanupResult = await removeOldConfigs(configsToClean.map(c => c.path));
    if (!cleanupResult.success) {
      console.error(pc.red('❌ Some files could not be removed:'), cleanupResult.error.message);
      console.log(pc.yellow('Note: Your backup is available at:'), backupResult.data);
      return failure(makeError('INTERNAL_ERROR', `Cleanup failed: ${cleanupResult.error.message}`));
    }

    // 4. Clean up dependencies if old tools were removed
    const removedOldTools = configsToClean.some(config => 
      ['eslint', 'prettier', 'husky'].includes(config.tool)
    );

    if (removedOldTools && !options.force) {
      const cleanDeps = await confirm({
        message: 'Also remove related dependencies from package.json?',
        default: true,
      });

      if (cleanDeps) {
        console.log('\n' + pc.gray('Cleaning up dependencies...'));
        const depCleanupResult = await cleanupDependencies();
        if (!depCleanupResult.success) {
          console.warn(pc.yellow('Warning: Some dependencies could not be removed:'), depCleanupResult.error.message);
        } else {
          console.log(pc.green('✓ Dependencies cleaned up'));
        }
      }
    } else if (removedOldTools && options.force) {
      // In force mode, always clean dependencies
      console.log('\n' + pc.gray('Cleaning up dependencies...'));
      const depCleanupResult = await cleanupDependencies(packageJson, projectRoot);
      if (isFailure(depCleanupResult)) {
        console.warn(pc.yellow('Warning: Some dependencies could not be removed:'), depCleanupResult.error.message);
      }
    }

    console.log('\n' + pc.green('✨ Cleanup completed successfully!'));
    console.log(pc.gray(`Removed ${configsToClean.length} configuration file(s).`));
    console.log(pc.gray(`Backup available at: ${backupResult.data}`));

    // Suggest next steps
    if (removedOldTools) {
      console.log('\n' + pc.bold('Next steps:'));
      console.log('  1. Run ' + pc.cyan('flint init') + ' to set up modern tools');
      console.log('  2. Or manually configure your preferred tools');
    }

    return success(undefined);
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', `Clean failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}