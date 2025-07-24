#!/usr/bin/env node
import { Command } from 'commander';
import * as pc from 'picocolors';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { init } from './commands/init.js';
import { clean } from './commands/clean.js';
import { doctor } from './commands/doctor.js';

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const version = packageJson.version;

const program = new Command();

program
  .name('flint')
  .description('Unified formatting and linting setup for JavaScript/TypeScript projects')
  .version(version);

// Init command
program
  .command('init')
  .description('Initialize formatting and linting tools')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--dry-run', 'Show what would happen without making changes')
  .option('--keep-existing', 'Keep existing configurations')
  .option('--no-stylelint', 'Skip Stylelint setup')
  .option('--no-git-hooks', 'Skip git hooks setup')
  .option('--monorepo', 'Configure for monorepo structure')
  .option('--keep-prettier', 'Keep Prettier for all files (not just non-JS/TS)')
  .action(async (options) => {
    console.log(pc.cyan('🔥 Initializing Flint...'));
    
    const result = await init(options);
    
    if (!result.success) {
      console.error(pc.red('❌ Initialization failed:'), result.error.message);
      process.exit(1);
    }
    
    console.log(pc.green('✨ Flint initialized successfully!'));
    console.log(pc.gray('Run `bun run check` to verify your setup.'));
  });

// Clean command
program
  .command('clean')
  .description('Remove old configs (creates backup first)')
  .option('--force', 'Skip confirmation prompt')
  .action(async (options) => {
    console.log(pc.cyan('🧹 Cleaning up old configurations...'));
    
    const result = await clean(options);
    
    if (!result.success) {
      console.error(pc.red('❌ Cleanup failed:'), result.error.message);
      process.exit(1);
    }
    
    console.log(pc.green('✨ Cleanup completed!'));
  });

// Doctor command
program
  .command('doctor')
  .description('Diagnose configuration issues')
  .action(async () => {
    console.log(pc.cyan('🩺 Running diagnostics...'));
    
    const result = await doctor();
    
    if (!result.success) {
      console.error(pc.red('❌ Diagnostics failed:'), result.error.message);
      process.exit(1);
    }
    
    const report = result.data;
    
    if (report.issues.length === 0) {
      console.log(pc.green('✨ No issues found!'));
    } else {
      console.log(pc.yellow(`⚠️  Found ${report.issues.length} issue(s):`));
      report.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.description}`);
        if (issue.fix) {
          console.log(pc.gray(`   Fix: ${issue.fix}`));
        }
      });
    }
  });

program.parse();