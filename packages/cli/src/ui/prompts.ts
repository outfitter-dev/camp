import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { Package } from '../types/index.js';
import type { FieldguideRecommendation } from '../config/fieldguide-mappings.js';

/**
 * Prompts the user to select configuration packages to install from a list.
 *
 * @param packages - The available configuration packages to choose from.
 * @returns A promise that resolves to an array of selected package values.
 */
export async function selectConfigurations(packages: Package[]): Promise<string[]> {
  return checkbox({
    message: 'Select configurations to install:',
    choices: packages.map(pkg => ({
      name: pkg.name,
      value: pkg.value,
      checked: pkg.selected,
    })),
  });
}

/**
 * Prompts the user to select utility packages from a list.
 *
 * @param packages - The available utility packages to choose from.
 * @returns A promise that resolves to an array of selected package values.
 */
export async function selectUtilities(packages: Package[]): Promise<string[]> {
  return checkbox({
    message: 'Select utility packages:',
    choices: packages.map(pkg => ({
      name: pkg.name,
      value: pkg.value,
      checked: pkg.selected,
    })),
  });
}

/**
 * Prompts the user to confirm whether to initialize git hooks.
 *
 * @returns A promise that resolves to true if the user confirms, or false otherwise.
 */
export async function confirmGitHooks(): Promise<boolean> {
  return confirm({
    message: 'Initialize git hooks?',
    default: true,
  });
}

/**
 * Displays a formatted list of recommended fieldguides in the console, including icons based on their priority.
 *
 * @param fieldguides - An array of fieldguide recommendations to display.
 */
export function showRecommendedFieldguides(fieldguides: FieldguideRecommendation[]): void {
  console.log(chalk.cyan('\n📚 Recommended fieldguides for your terrain:'));
  fieldguides.forEach(fg => {
    const icon = fg.priority === 'essential' ? '⭐' : 
                 fg.priority === 'recommended' ? '👍' : '📖';
    console.log(`  ${icon} ${fg.name} - ${fg.description}`);
  });
}