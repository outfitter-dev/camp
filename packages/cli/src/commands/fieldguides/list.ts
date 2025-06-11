import chalk from 'chalk';
import { readJSON, pathExists } from 'fs-extra';
import { join } from 'path';

// TODO: This would come from a registry or the fieldguides package
const availableFieldguides = {
  'typescript-standards': 'Core TypeScript patterns and conventions',
  'react-patterns': 'React component and hook patterns',
  'nextjs-patterns': 'Next.js specific patterns and best practices',
  'testing-standards': 'Comprehensive testing methodology',
  'security-standards': 'Security baseline and best practices',
  'react-hook-form': 'Form handling with React Hook Form',
  'react-query': 'Data fetching with React Query',
  'zustand-guide': 'State management with Zustand',
  'vitest-guide': 'Testing with Vitest',
  'playwright-guide': 'E2E testing with Playwright',
};

export async function listFieldguides(options: { installed?: boolean }): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.outfitter', 'config.json');

  let installedFieldguides: Array<string> = [];

  if (await pathExists(configPath)) {
    const config = await readJSON(configPath);
    installedFieldguides = config.fieldguides || config.supplies || []; // Support old 'supplies' key for backwards compatibility
  }

  if (options.installed) {
    if (installedFieldguides.length === 0) {
      console.log(chalk.yellow('No fieldguides installed yet.'));
      return;
    }

    console.log(chalk.cyan('Installed fieldguides:\n'));
    installedFieldguides.forEach(fieldguide => {
      console.log('  ' + chalk.green('✓') + ' ' + fieldguide);
    });
  } else {
    console.log(chalk.cyan('Available fieldguides:\n'));
    Object.entries(availableFieldguides).forEach(([fieldguide, description]) => {
      const isInstalled = installedFieldguides.includes(fieldguide);
      const status = isInstalled ? chalk.green('✓') : chalk.gray('○');
      const name = isInstalled ? chalk.green(fieldguide) : fieldguide;
      console.log(`  ${status} ${name}`);
      console.log(`    ${chalk.gray(description)}\n`);
    });

    if (installedFieldguides.length === 0) {
      console.log(
        chalk.yellow('\nNo fieldguides installed yet. Run "outfitter fg add <fieldguide>" to get started.')
      );
    }
  }
}