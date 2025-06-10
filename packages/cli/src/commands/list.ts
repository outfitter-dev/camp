import { Command } from 'commander';
import chalk from 'chalk';
import { readJSON, pathExists } from 'fs-extra';
import { join } from 'path';

// TODO: This would come from a registry or the supplies repo
const availableSupplies = {
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

export const listCommand = new Command('list')
  .description('List available supplies')
  .option('-i, --installed', 'Show only installed supplies')
  .action(async options => {
    const cwd = process.cwd();
    const configPath = join(cwd, '.outfitter', 'config.json');

    let installedSupplies: Array<string> = [];

    if (await pathExists(configPath)) {
      const config = await readJSON(configPath);
      installedSupplies = config.supplies || [];
    }

    if (options.installed) {
      if (installedSupplies.length === 0) {
        console.log(chalk.yellow('No supplies installed yet.'));
        return;
      }

      console.log(chalk.cyan('Installed supplies:\n'));
      installedSupplies.forEach(supply => {
        console.log('  ' + chalk.green('✓') + ' ' + supply);
      });
    } else {
      console.log(chalk.cyan('Available supplies:\n'));

      Object.entries(availableSupplies).forEach(([name, description]) => {
        const isInstalled = installedSupplies.includes(name);
        const status = isInstalled ? chalk.green('✓') : chalk.gray('○');
        const nameColor = isInstalled ? chalk.green : chalk.white;

        console.log(`  ${status} ${nameColor(name)}`);
        console.log(`    ${chalk.gray(description)}\n`);
      });

      console.log(
        chalk.gray('\nUse "outfitter add <supply>" to install supplies')
      );
    }
  });
