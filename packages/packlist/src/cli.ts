#!/usr/bin/env node

import { program } from 'commander';
import { init } from './init';

const version = '0.0.0'; // TODO: Import from package.json when resolveJsonModule works

program
  .name('packlist')
  .description('Unified development configuration manager for Outfitter projects')
  .version(version);

program
  .command('init')
  .description('Initialize packlist configuration in your project')
  .option('-f, --force', 'Overwrite existing configuration files')
  .option('--no-eslint', 'Skip ESLint configuration')
  .option('--no-typescript', 'Skip TypeScript configuration')
  .option('--no-utils', 'Skip TypeScript utilities')
  .action(async (options) => {
    // TODO: Update once init returns Result type
    await init(options);
  });

program.parse();
