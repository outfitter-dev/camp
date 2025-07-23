import { Result, success, failure, makeError, isSuccess, isFailure } from '@outfitter/contracts';
import { confirm } from '@inquirer/prompts';
import * as pc from 'picocolors';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { InitOptions } from '../types.js';
import { detectExistingTools, type DetectedTools } from '../core/detector.js';
import { createBackup } from '../core/backup.js';
import { cleanupOldConfigs } from '../core/cleanup.js';
import { cleanupDependencies } from '../core/dependency-cleanup.js';
import { installDependencies } from '../core/installer.js';
import { generateOxlintConfig } from '../generators/oxlint.js';
import { generateBiomeConfig } from '../generators/biome.js';
import { generatePrettierConfig } from '../generators/prettier.js';
import { generateStylelintConfig } from '../generators/stylelint.js';
import { generateMarkdownlintConfig } from '../generators/markdownlint.js';
import { generateLefthookConfig } from '../generators/lefthook.js';
import { generateCommitlintConfig } from '../generators/commitlint.js';
import { generateEditorconfigConfig } from '../generators/editorconfig.js';
import { generateVSCodeSettings } from '../generators/vscode.js';
import { updatePackageScripts } from '../generators/package-scripts.js';
import { generateMigrationReport } from '../core/migration-report.js';

interface InitContext {
  projectRoot: string;
  packageJson: any;
  detectedTools: DetectedTools;
  isMonorepo: boolean;
  hasTypeScript: boolean;
  hasCSSFiles: boolean;
  framework?: string;
}

/**
 * Initialize Flint formatting and linting setup
 */
export async function init(options: InitOptions): Promise<Result<void, Error>> {
  try {
    // Validate we're in a project with package.json
    const projectRoot = process.cwd();
    const packageJsonPath = join(projectRoot, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return failure(makeError('NOT_FOUND', 'No package.json found. Please run this command in a project root.'));
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    // 1. Detect existing configurations
    console.log(pc.gray('Detecting existing configurations...'));
    const detectionResult = await detectExistingTools(projectRoot);
    if (isFailure(detectionResult)) {
      return failure(makeError('INTERNAL_ERROR', `Detection failed: ${detectionResult.error.message}`));
    }
    const detectedTools = detectionResult.data;

    // Detect project characteristics
    const context: InitContext = {
      projectRoot,
      packageJson,
      detectedTools,
      isMonorepo: options.monorepo || existsSync(join(projectRoot, 'pnpm-workspace.yaml')) || 
                  existsSync(join(projectRoot, 'lerna.json')) || 
                  (packageJson.workspaces && Array.isArray(packageJson.workspaces)),
      hasTypeScript: existsSync(join(projectRoot, 'tsconfig.json')) || 
                     packageJson.devDependencies?.typescript || 
                     packageJson.dependencies?.typescript,
      hasCSSFiles: await detectCSSFiles(projectRoot),
      framework: detectFramework(packageJson),
    };

    // Show what we found
    if (detectedTools.hasConfigs) {
      console.log(pc.yellow(`Found ${detectedTools.configs.length} existing configuration(s):`));
      detectedTools.configs.forEach(config => {
        console.log(pc.gray(`  - ${config.tool} (${config.path})`));
      });
    }

    // 2. Create backup if needed
    if (detectedTools.hasConfigs && !options.keepExisting) {
      console.log(pc.gray('\nCreating backup of existing configurations...'));
      const backupResult = await createBackup(detectedTools.configs);
      if (!backupResult.success) {
        return failure(makeError('INTERNAL_ERROR', `Backup failed: ${backupResult.error.message}`));
      }
      console.log(pc.green(`✓ Backup created: ${backupResult.data}`));
    }

    // 3. Confirm with user (unless --yes flag is used)
    if (!options.yes && !options.dryRun) {
      const actions = [];
      if (detectedTools.hasConfigs && !options.keepExisting) {
        actions.push('Remove existing ESLint, Prettier, and other old configs');
      }
      actions.push('Install Ultracite (Biome wrapper), Oxlint, and other tools');
      actions.push('Set up modern formatting and linting');
      if (!options.noGitHooks) {
        actions.push('Configure git hooks with Lefthook');
      }
      actions.push('Update package.json scripts');
      actions.push('Configure VS Code settings');

      console.log('\n' + pc.cyan('Flint will:'));
      actions.forEach(action => console.log(`  • ${action}`));

      const proceed = await confirm({
        message: 'Continue with setup?',
        default: true,
      });

      if (!proceed) {
        console.log(pc.yellow('Setup cancelled.'));
        return success(undefined);
      }
    }

    // In dry-run mode, just show what would be done
    if (options.dryRun) {
      console.log('\n' + pc.cyan('Dry run mode - no changes will be made.'));
      console.log('\nWould perform the following actions:');
      
      // Show cleanup
      if (detectedTools.hasConfigs && !options.keepExisting) {
        console.log('\n' + pc.bold('Remove old configurations:'));
        detectedTools.configs.forEach(config => {
          console.log(`  - ${config.path}`);
        });
      }

      // Show new tools
      console.log('\n' + pc.bold('Install new tools:'));
      const dependencies = await gatherDependencies(context, options);
      dependencies.forEach(dep => console.log(`  - ${dep}`));

      // Show new configs
      console.log('\n' + pc.bold('Create new configurations:'));
      const configs = await gatherConfigs(context, options);
      configs.forEach(config => console.log(`  - ${config}`));

      return success(undefined);
    }

    // 4. Clean up old tools (if not keeping existing)
    if (detectedTools.hasConfigs && !options.keepExisting) {
      console.log('\n' + pc.gray('Removing old configurations...'));
      const cleanupResult = await cleanupOldConfigs(detectedTools.configs);
      if (!cleanupResult.success) {
        console.warn(pc.yellow('Warning: Some configs could not be removed:'), cleanupResult.error.message);
      }

      // Clean up old dependencies
      console.log(pc.gray('Cleaning up old dependencies...'));
      const depCleanupResult = await cleanupDependencies(packageJson, projectRoot);
      if (!depCleanupResult.success) {
        console.warn(pc.yellow('Warning: Some dependencies could not be removed:'), depCleanupResult.error.message);
      }
    }

    // 5. Install new tools
    console.log('\n' + pc.gray('Installing new tools...'));
    const dependencies = await gatherDependencies(context, options);
    const installResult = await installDependencies(dependencies, projectRoot);
    if (!installResult.success) {
      return failure(makeError('EXTERNAL_SERVICE_ERROR', `Installation failed: ${installResult.error.message}`));
    }

    // 6. Generate configurations
    console.log('\n' + pc.gray('Generating configurations...'));

    // Ultracite (Biome) - always install for JS/TS formatting
    console.log(pc.gray('  • Setting up Ultracite (Biome)...'));
    const biomeResult = await generateBiomeConfig(projectRoot, context.isMonorepo);
    if (!biomeResult.success) {
      return failure(makeError('INTERNAL_ERROR', `Biome setup failed: ${biomeResult.error.message}`));
    }

    // Initialize Ultracite
    try {
      execSync('npx ultracite format', { 
        cwd: projectRoot, 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    } catch (error) {
      console.warn(pc.yellow('Warning: Could not initialize Ultracite:'), error instanceof Error ? error.message : 'Unknown error');
    }

    // Oxlint - always install for JS/TS linting
    console.log(pc.gray('  • Setting up Oxlint...'));
    const oxlintResult = await generateOxlintConfig(projectRoot);
    if (!oxlintResult.success) {
      return failure(makeError('INTERNAL_ERROR', `Oxlint setup failed: ${oxlintResult.error.message}`));
    }

    // Prettier - for non-JS/TS files (unless keepPrettier is true)
    if (!options.keepPrettier || detectedTools.configs.some(c => c.tool === 'prettier')) {
      console.log(pc.gray('  • Setting up Prettier for non-JS/TS files...'));
      const prettierResult = await generatePrettierConfig(projectRoot, options.keepPrettier || false);
      if (!prettierResult.success) {
        return failure(makeError('INTERNAL_ERROR', `Prettier setup failed: ${prettierResult.error.message}`));
      }
    }

    // Markdownlint
    console.log(pc.gray('  • Setting up markdownlint...'));
    const markdownlintResult = await generateMarkdownlintConfig(projectRoot);
    if (!markdownlintResult.success) {
      return failure(makeError('INTERNAL_ERROR', `Markdownlint setup failed: ${markdownlintResult.error.message}`));
    }

    // Stylelint (if CSS files exist and not disabled)
    if (context.hasCSSFiles && !options.noStylelint) {
      console.log(pc.gray('  • Setting up Stylelint...'));
      const stylelintResult = await generateStylelintConfig(projectRoot, context.framework);
      if (!stylelintResult.success) {
        return failure(makeError('INTERNAL_ERROR', `Stylelint setup failed: ${stylelintResult.error.message}`));
      }
    }

    // Git hooks (if not disabled)
    if (!options.noGitHooks) {
      console.log(pc.gray('  • Setting up Lefthook...'));
      const lefthookResult = await generateLefthookConfig(projectRoot);
      if (!lefthookResult.success) {
        return failure(makeError('INTERNAL_ERROR', `Lefthook setup failed: ${lefthookResult.error.message}`));
      }

      console.log(pc.gray('  • Setting up commitlint...'));
      const commitlintResult = await generateCommitlintConfig(projectRoot);
      if (!commitlintResult.success) {
        return failure(makeError('INTERNAL_ERROR', `Commitlint setup failed: ${commitlintResult.error.message}`));
      }

      // Install Lefthook
      try {
        execSync('npx lefthook install', { cwd: projectRoot, stdio: 'pipe' });
      } catch (error) {
        console.warn(pc.yellow('Warning: Could not install Lefthook git hooks:'), error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // EditorConfig
    console.log(pc.gray('  • Setting up EditorConfig...'));
    const editorconfigResult = await generateEditorconfigConfig(projectRoot);
    if (!editorconfigResult.success) {
      return failure(makeError('INTERNAL_ERROR', `EditorConfig setup failed: ${editorconfigResult.error.message}`));
    }

    // VS Code settings
    console.log(pc.gray('  • Configuring VS Code...'));
    const vscodeResult = await generateVSCodeSettings(projectRoot, {
      hasPrettier: !options.keepPrettier || detectedTools.configs.some(c => c.tool === 'prettier'),
      hasStylelint: context.hasCSSFiles && !options.noStylelint,
    });
    if (!vscodeResult.success) {
      console.warn(pc.yellow('Warning: Could not create VS Code settings:'), vscodeResult.error.message);
    }

    // 7. Update package.json scripts
    console.log('\n' + pc.gray('Updating package.json scripts...'));
    const scriptsResult = await updatePackageScripts(projectRoot, {
      hasPrettier: !options.keepPrettier || detectedTools.configs.some(c => c.tool === 'prettier'),
      hasStylelint: context.hasCSSFiles && !options.noStylelint,
      isMonorepo: context.isMonorepo,
    });
    if (!scriptsResult.success) {
      return failure(makeError('INTERNAL_ERROR', `Scripts update failed: ${scriptsResult.error.message}`));
    }

    // 8. Generate migration report
    console.log('\n' + pc.gray('Generating migration report...'));
    const reportResult = await generateMigrationReport({
      detectedTools,
      backedUp: detectedTools.hasConfigs && !options.keepExisting,
      installedTools: dependencies,
      createdConfigs: await gatherConfigs(context, options),
    });
    if (!reportResult.success) {
      console.warn(pc.yellow('Warning: Could not generate migration report:'), reportResult.error.message);
    } else {
      console.log(pc.green(`✓ Migration report saved: ${reportResult.data}`));
    }

    console.log('\n' + pc.green('✨ Flint setup complete!'));
    console.log('\n' + pc.bold('Next steps:'));
    console.log('  1. Review the generated configurations');
    console.log('  2. Run ' + pc.cyan('pnpm check') + ' to verify your setup');
    console.log('  3. Commit the changes to version control');
    if (!options.noGitHooks) {
      console.log('  4. Git hooks are now active - commits will be checked automatically');
    }

    return success(undefined);
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

async function detectCSSFiles(projectRoot: string): Promise<boolean> {
  try {
    // Check for common CSS file patterns
    const patterns = ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'];
    for (const pattern of patterns) {
      const result = execSync(`find . -name "${pattern.replace('**/', '')}" -type f | head -1`, {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      if (result) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function detectFramework(packageJson: any): string | undefined {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps.next) return 'next';
  if (deps.react) return 'react';
  if (deps.vue) return 'vue';
  if (deps.svelte) return 'svelte';
  if (deps.angular) return 'angular';
  
  return undefined;
}

async function gatherDependencies(context: InitContext, options: InitOptions): Promise<string[]> {
  const deps = [
    'ultracite',
    'oxlint',
    'markdownlint-cli2',
  ];

  if (!options.keepPrettier) {
    deps.push('prettier');
  }

  if (context.hasCSSFiles && !options.noStylelint) {
    deps.push('stylelint', 'stylelint-config-standard');
    if (context.framework === 'next' || context.framework === 'react') {
      deps.push('stylelint-config-standard-scss');
    }
  }

  if (!options.noGitHooks) {
    deps.push('lefthook', '@commitlint/cli', '@commitlint/config-conventional');
  }

  return deps;
}

async function gatherConfigs(context: InitContext, options: InitOptions): Promise<string[]> {
  const configs = [
    'biome.json',
    'oxlint.json',
    '.markdownlint.json',
    '.editorconfig',
    '.vscode/settings.json',
  ];

  if (!options.keepPrettier) {
    configs.push('.prettierrc.json', '.prettierignore');
  }

  if (context.hasCSSFiles && !options.noStylelint) {
    configs.push('.stylelintrc.json');
  }

  if (!options.noGitHooks) {
    configs.push('lefthook.yml', 'commitlint.config.js');
  }

  return configs;
}