/**
 * Init command - Sets up complete formatting stack
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';
import { detectPackageManager } from '../utils/detect-pm.js';
import type { InitOptions } from '../types/simplified.js';
import {
  generatePrettierConfig,
  generatePrettierIgnore,
  generateMarkdownlintConfig,
  generateEditorConfig,
  generateGitAttributes,
  generateAdditionalVSCodeSettings,
  generateVSCodeExtensions,
} from '../generators/configs.js';

const execAsync = promisify(exec);

/**
 * Initialize Outfitter formatting setup
 */
export async function init(options: InitOptions = {}): Promise<Result<void, Error>> {
  const {
    skipUltracite = false,
    skipInstall = false,
    includeMarkdownLint = true,
    includeEditorConfig = true,
    cwd = process.cwd(),
    dryRun = false,
  } = options;

  const pm = detectPackageManager(cwd);

  console.log('🚀 Initializing Outfitter formatting setup...\n');
  console.log(`📦 Detected package manager: ${pm.name}\n`);

  try {
    // Step 1: Run ultracite init
    if (!skipUltracite) {
      console.log('⚡ Setting up Ultracite (Biome) for TypeScript/JavaScript...');
      if (!dryRun) {
        try {
          await execAsync(`${pm.dlx} ultracite init`, { cwd });
          console.log('✅ Ultracite initialized successfully\n');
        } catch (error) {
          console.log('❌ Failed to initialize Ultracite');
          console.log(
            '   You can run it manually later with: ' + `${pm.dlx} ultracite init` + '\n',
          );
        }
      } else {
        console.log(`   Would run: ${pm.dlx} ultracite init`);
        console.log('   (dry run - skipping)\n');
      }
    }

    // Step 2: Install additional dependencies
    if (!skipInstall) {
      const deps = ['prettier'];
      if (includeMarkdownLint) {
        deps.push('markdownlint-cli2');
      }

      console.log('📦 Installing additional formatters...');
      console.log(`   ${deps.join(', ')}`);

      if (!dryRun) {
        try {
          await execAsync(`${pm.install} -D ${deps.join(' ')}`, { cwd });
          console.log('✅ Dependencies installed successfully\n');
        } catch (error) {
          console.log('⚠️  Failed to install dependencies automatically');
          console.log(`   Run manually: ${pm.install} -D ${deps.join(' ')}\n`);
        }
      } else {
        console.log(`   Would run: ${pm.install} -D ${deps.join(' ')}`);
        console.log('   (dry run - skipping)\n');
      }
    }

    // Step 3: Configure Prettier for non-JS/TS files
    console.log('🎨 Configuring Prettier for non-JS/TS files...');
    await writeConfig(join(cwd, '.prettierrc.json'), generatePrettierConfig().content, dryRun);
    await writeConfig(join(cwd, '.prettierignore'), generatePrettierIgnore().content, dryRun);

    // Step 4: Configure markdownlint
    if (includeMarkdownLint) {
      console.log('📝 Setting up markdown linting...');
      await writeConfig(
        join(cwd, '.markdownlint-cli2.yaml'),
        generateMarkdownlintConfig().content,
        dryRun,
      );
    }

    // Step 5: Add EditorConfig
    if (includeEditorConfig) {
      console.log('📝 Creating EditorConfig...');
      await writeConfig(join(cwd, '.editorconfig'), generateEditorConfig().content, dryRun);
    }

    // Step 6: Add git attributes
    console.log('📄 Creating git attributes...');
    await writeConfig(join(cwd, '.gitattributes'), generateGitAttributes().content, dryRun);

    // Step 7: Update VS Code settings
    console.log('🔧 Updating VS Code settings...');
    const vsCodeSettings = generateAdditionalVSCodeSettings();
    const vsCodeDir = join(cwd, '.vscode');

    if (!dryRun) {
      // Ensure .vscode directory exists
      if (!existsSync(vsCodeDir)) {
        await mkdir(vsCodeDir, { recursive: true });
      }

      // Merge VS Code settings
      await mergeJsonFile(
        join(vsCodeDir, 'settings.json'),
        JSON.parse(vsCodeSettings.content),
        dryRun,
      );

      // Add extensions recommendations
      await writeConfig(
        join(vsCodeDir, 'extensions.json'),
        generateVSCodeExtensions().content,
        dryRun,
      );
    } else {
      console.log('   Would update .vscode/settings.json');
      console.log('   Would create .vscode/extensions.json');
    }

    // Step 8: Update package.json scripts
    console.log('\n📜 Updating package.json scripts...');
    await updatePackageJsonScripts(cwd, includeMarkdownLint, dryRun);

    console.log('\n✨ Outfitter formatting setup complete!');
    console.log('\nAvailable commands:');
    console.log('  • pnpm format        - Format all files');
    console.log('  • pnpm format:check  - Check formatting');
    console.log('  • pnpm lint          - Run linters');
    console.log('  • pnpm lint:fix      - Fix lint issues');
    console.log('  • pnpm ci            - Run all checks (for CI/CD)\n');

    return success(undefined);
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', 'Failed to initialize formatting', { cause: error }));
  }
}

/**
 * Write a configuration file
 */
async function writeConfig(path: string, content: string, dryRun: boolean): Promise<void> {
  const filename = path.split('/').pop();

  if (existsSync(path)) {
    console.log(`   ⚠️  ${filename} already exists (skipping)`);
    return;
  }

  if (!dryRun) {
    await writeFile(path, content, 'utf-8');
    console.log(`   ✅ Created ${filename}`);
  } else {
    console.log(`   Would create ${filename}`);
  }
}

/**
 * Merge JSON configuration files
 */
async function mergeJsonFile(
  path: string,
  newConfig: Record<string, unknown>,
  dryRun: boolean,
): Promise<void> {
  let existing: Record<string, unknown> = {};

  if (existsSync(path)) {
    try {
      const content = await readFile(path, 'utf-8');
      existing = JSON.parse(content);
    } catch {
      console.log('   ⚠️  Failed to parse existing settings.json');
    }
  }

  // Deep merge with new config taking precedence
  const merged = deepMerge(existing, newConfig);

  if (!dryRun) {
    await writeFile(path, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    console.log('   ✅ Updated settings.json');
  } else {
    console.log('   Would merge settings.json');
  }
}

/**
 * Simple deep merge for objects
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>,
      );
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Update package.json scripts
 */
async function updatePackageJsonScripts(
  cwd: string,
  includeMarkdownLint: boolean,
  dryRun: boolean,
): Promise<void> {
  const packageJsonPath = join(cwd, 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.log('   ⚠️  No package.json found (skipping script update)');
    return;
  }

  try {
    const content = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    packageJson.scripts = packageJson.scripts || {};

    // Define scripts
    const markdownLintCommands = includeMarkdownLint
      ? {
          lint: ' && markdownlint-cli2',
          'lint:fix': ' && markdownlint-cli2 --fix',
          ci: ' && markdownlint-cli2',
        }
      : { lint: '', 'lint:fix': '', ci: '' };

    const scripts = {
      format: "biome check --write . && prettier --write '**/*.{yml,yaml,json,md,css,html}'",
      'format:check': "biome check . && prettier --check '**/*.{yml,yaml,json,md,css,html}'",
      lint: `biome lint .${markdownLintCommands.lint}`,
      'lint:fix': `biome lint --write .${markdownLintCommands['lint:fix']}`,
      ci: `biome ci . && prettier --check '**/*.{yml,yaml,json,md,css,html}'${markdownLintCommands.ci}`,
    };

    // Merge scripts
    Object.assign(packageJson.scripts, scripts);

    if (!dryRun) {
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
      console.log('   ✅ Updated package.json scripts');
    } else {
      console.log('   Would update package.json scripts');
    }
  } catch (error) {
    console.log('   ⚠️  Failed to update package.json scripts');
  }
}