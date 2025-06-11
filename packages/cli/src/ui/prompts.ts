import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { Package } from '../types/index.js';
import type { FieldguideRecommendation } from '../config/fieldguide-mappings.js';

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

export async function confirmGitHooks(): Promise<boolean> {
  return confirm({
    message: 'Initialize git hooks?',
    default: true,
  });
}

export function showRecommendedFieldguides(fieldguides: FieldguideRecommendation[]): void {
  console.log(chalk.cyan('\n📚 Recommended fieldguides for your terrain:'));
  fieldguides.forEach(fg => {
    const icon = fg.priority === 'essential' ? '⭐' : 
                 fg.priority === 'recommended' ? '👍' : '📖';
    console.log(`  ${icon} ${fg.name} - ${fg.description}`);
  });
}