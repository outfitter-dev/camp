#!/usr/bin/env node

/**
 * CLI for @outfitter/formatting
 */

import { program } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { init } from './commands/init.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('outfitter-formatting')
  .description('Modern formatting setup that leverages Ultracite (Biome) and complementary tools')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize complete formatting setup with Ultracite, Prettier, and more')
  .option('--skip-ultracite', 'Skip running ultracite init')
  .option('--skip-install', 'Skip installing dependencies')
  .option('--no-markdown-lint', 'Skip markdownlint-cli2 setup')
  .option('--no-editor-config', 'Skip EditorConfig creation')
  .option('--dry-run', "Show what would be done but don't write files")
  .action(async (options) => {
    const initOptions = {
      skipUltracite: options.skipUltracite || false,
      skipInstall: options.skipInstall || false,
      includeMarkdownLint: options.markdownLint !== false,
      includeEditorConfig: options.editorConfig !== false,
      dryRun: options.dryRun || false,
    };

    const result = await init(initOptions);

    if (!result.success) {
      console.error('\n❌ Initialization failed:', result.error.message);
      process.exit(1);
    }
  });

// Legacy setup command - redirect to init
program
  .command('setup')
  .description('(Deprecated) Use "init" instead')
  .action(() => {
    console.log('The "setup" command has been replaced with "init".');
    console.log('Run: outfitter-formatting init');
    process.exit(1);
  });

program.parse();