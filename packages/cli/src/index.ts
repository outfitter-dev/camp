#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { updateCommand } from './commands/update.js';
import { packCommand } from './commands/pack.js';

const program = new Command();

program
  .name('outfitter')
  .description(
    'CLI tool for equipping your development journey with configurations and fieldguides'
  )
  .version('0.1.0');

// Add commands
program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(listCommand);
program.addCommand(updateCommand);
program.addCommand(packCommand);

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
