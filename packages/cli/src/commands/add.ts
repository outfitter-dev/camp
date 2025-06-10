import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readJSON, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';

export const addCommand = new Command('add')
  .description('Add specific supplies to your project')
  .argument('<supplies...>', 'Supplies to add (e.g., react-patterns typescript-standards)')
  .action(async (supplies: string[]) => {
    const cwd = process.cwd();
    const configPath = join(cwd, '.outfitter', 'config.json');
    
    // Check if initialized
    if (!await pathExists(configPath)) {
      console.error(chalk.red('Project not initialized. Run "outfitter init" first.'));
      process.exit(1);
    }

    const spinner = ora('Adding supplies...').start();

    try {
      // Read current config
      const config = await readJSON(configPath);
      
      // Add new supplies (avoiding duplicates)
      const newSupplies = supplies.filter(s => !config.supplies.includes(s));
      config.supplies = [...config.supplies, ...newSupplies];
      
      // TODO: In real implementation, fetch actual files from supplies repo
      // For now, just update config
      
      await writeJSON(configPath, config, { spaces: 2 });
      
      spinner.succeed(`Added ${newSupplies.length} new supplies`);
      
      if (newSupplies.length > 0) {
        console.log('\n' + chalk.green('Added:'));
        newSupplies.forEach(s => console.log('  • ' + s));
      }
      
      const skipped = supplies.length - newSupplies.length;
      if (skipped > 0) {
        console.log('\n' + chalk.yellow(`Skipped ${skipped} already installed supplies`));
      }
      
    } catch (error) {
      spinner.fail('Failed to add supplies');
      throw error;
    }
  });