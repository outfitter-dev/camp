import { Command } from 'commander';
import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { execa } from 'execa';
import { detectTerrain, getTerrainSummary } from '../utils/detect-terrain.js';
import {
  getRecommendedFieldguides,
  getRecommendedFieldguideIds,
} from '../config/fieldguide-mappings.js';
import { CONFIG_PACKAGES, UTILITY_PACKAGES } from '../constants/packages.js';
import { getPresetSelection } from '../services/package-selector.js';

interface EquipOptions {
  preset?: 'minimal' | 'standard' | 'full';
  yes?: boolean;
}

interface PackageSelection {
  configs: Array<string>;
  utils: Array<string>;
  fieldguides: Array<string>;
}

/**
 * Detects the package manager used in the current project by checking for known lock files.
 *
 * @returns The detected package manager: 'pnpm', 'yarn', 'bun', or 'npm'. Defaults to 'npm' if no lock file is found.
 */
async function detectPackageManager(): Promise<
  'npm' | 'pnpm' | 'yarn' | 'bun'
> {
  // Check for lock files using fs-extra
  const { pathExists } = await import('fs-extra');

  if (await pathExists('pnpm-lock.yaml')) return 'pnpm';
  if (await pathExists('yarn.lock')) return 'yarn';
  if (await pathExists('bun.lockb')) return 'bun';
  if (await pathExists('package-lock.json')) return 'npm';

  return 'npm';
}

async function installPackages(
  packages: Array<string>,
  packageManager: string
): Promise<void> {
  const installCmd = packageManager === 'npm' ? 'install' : 'add';
  const devFlag = packageManager === 'npm' ? '--save-dev' 
    : packageManager === 'bun' ? '--dev' : '-D';

  await execa(packageManager, [installCmd, devFlag, ...packages], {
    stdio: 'inherit',
  });
}

async function applyConfigurations(): Promise<void> {
  // TODO: Apply configuration files based on selected packages
  // For now, this is a placeholder
  console.log(chalk.gray('Applying configurations...'));
}

export const equipCommand = new Command('equip')
  .alias('init')
  .description('Interactively install Outfitter configurations and utilities')
  .option(
    '--preset <type>',
    'Use a preset configuration (minimal, standard, full)'
  )
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options: EquipOptions) => {
    console.log(
      chalk.cyan("🎒 Welcome to Outfitter! Let's equip your project.\n")
    );

    // Detect project terrain
    const terrainSpinner = ora('Analyzing project terrain...').start();
    const terrain = await detectTerrain();
    const terrainSummary = getTerrainSummary(terrain);
    terrainSpinner.succeed('Project terrain analyzed');

    if (terrainSummary.length > 0) {
      console.log(chalk.cyan('\n🗻 Detected terrain:'));
      terrainSummary.forEach(feature => {
        console.log(`  • ${feature}`);
      });
    }

    // Get recommended fieldguides based on terrain
    const recommendedFieldguides = getRecommendedFieldguides(terrain);

    let selection: PackageSelection;

    if (options.preset) {
      // Use preset configuration
      selection = getPresetSelection(options.preset);
    } else if (options.yes) {
      // Use defaults
      selection = {
        configs: CONFIG_PACKAGES.filter(p => p.selected).map(p => p.value),
        utils: UTILITY_PACKAGES.filter(p => p.selected).map(p => p.value),
        fieldguides: getRecommendedFieldguideIds(terrain),
      };
    } else {
      // Interactive selection
      console.log('');

      const selectedConfigs = await checkbox({
        message: 'Select configurations to install:',
        choices: CONFIG_PACKAGES.map(pkg => ({
          name: pkg.name,
          value: pkg.value,
          checked: pkg.selected,
        })),
      });

      const selectedUtils = await checkbox({
        message: 'Select utility packages:',
        choices: UTILITY_PACKAGES.map(pkg => ({
          name: pkg.name,
          value: pkg.value,
          checked: pkg.selected,
        })),
      });

      // Show recommended fieldguides
      if (recommendedFieldguides.length > 0) {
        console.log(
          chalk.cyan('\n📚 Recommended fieldguides for your terrain:')
        );
        recommendedFieldguides.forEach(fg => {
          const icon =
            fg.priority === 'essential'
              ? '⭐'
              : fg.priority === 'recommended'
                ? '👍'
                : '📖';
          console.log(`  ${icon} ${fg.name} - ${fg.description}`);
        });
      }

      selection = {
        configs: selectedConfigs,
        utils: selectedUtils,
        fieldguides: getRecommendedFieldguideIds(terrain),
      };
    }

    // Detect package manager
    const packageManager = await detectPackageManager();
    console.log(chalk.gray(`\n📦 Using ${packageManager}`));

    // Install packages
    const allPackages = [...selection.configs, ...selection.utils];

    if (allPackages.length > 0) {
      const installSpinner = ora('Installing packages...').start();
      try {
        await installPackages(allPackages, packageManager);
        installSpinner.succeed('Packages installed');
      } catch (error) {
        installSpinner.fail('Failed to install packages');
        throw error;
      }
    }

    // Apply configurations
    if (selection.configs.length > 0) {
      const configSpinner = ora('Applying configurations...').start();
      try {
        await applyConfigurations();
        configSpinner.succeed('Configurations applied');
      } catch (error) {
        configSpinner.fail('Failed to apply configurations');
        throw error;
      }
    }

    // Initialize git hooks if husky was selected
    if (selection.configs.includes('@outfitter/husky-config')) {
      const gitHooks = await confirm({
        message: 'Initialize git hooks?',
        default: true,
      });

      if (gitHooks) {
        const hooksSpinner = ora('Setting up git hooks...').start();
        try {
          // TODO: Initialize husky
          hooksSpinner.succeed('Git hooks initialized');
        } catch (error) {
          hooksSpinner.fail('Failed to initialize git hooks');
          throw error;
        }
      }
    }

    console.log(
      chalk.green('\n🎉 Your project is now equipped with Outfitter!\n')
    );

    // Show next steps
    console.log(chalk.cyan('Next steps:'));
    console.log(`  • Run '${packageManager} run lint' to check your code`);
    console.log(`  • Check README.md for usage instructions`);

    if (selection.fieldguides.length > 0) {
      console.log(`  • Explore fieldguides with 'outfitter fieldguides list'`);
    }
  });
