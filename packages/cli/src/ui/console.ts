import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import type { PackageSelection } from '../types/index.js';
import { getTerrainSummary, type TerrainFeatures } from '../utils/detect-terrain.js';

export function showWelcome(): void {
  console.log(chalk.cyan('🎒 Welcome to Outfitter! Let\'s equip your project.\n'));
}

export function showTerrainSummary(terrain: TerrainFeatures): void {
  const summary = getTerrainSummary(terrain);
  if (summary.length > 0) {
    console.log(chalk.cyan('\n🗻 Detected terrain:'));
    summary.forEach(feature => {
      console.log(`  • ${feature}`);
    });
  }
}

export function showPackageManager(manager: string): void {
  console.log(chalk.gray(`\n📦 Using ${manager}`));
}

export function showNextSteps(packageManager: string, selection: PackageSelection): void {
  console.log(chalk.green('\n🎉 Your project is now equipped with Outfitter!\n'));
  
  console.log(chalk.cyan('Next steps:'));
  console.log(`  • Run '${packageManager} run lint' to check your code`);
  console.log(`  • Check CLAUDE.md for AI assistant instructions`);
  
  if (selection.fieldguides.length > 0) {
    console.log(`  • Explore fieldguides with 'outfitter fieldguides list'`);
  }
}

export function createSpinner(text: string): Ora {
  return ora(text);
}