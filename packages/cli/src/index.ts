#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { equipCommand } from './commands/equip-refactored.js';
import { fieldguidesCommand } from './commands/fieldguides.js';

const program = new Command();

program
  .name('outfitter')
  .description(
    'CLI tool for equipping your development journey with configurations and fieldguides'
  )
  .version('1.0.2');

// Add commands
program.addCommand(equipCommand);
program.addCommand(fieldguidesCommand);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  if (error.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
}
