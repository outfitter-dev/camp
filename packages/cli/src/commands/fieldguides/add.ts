import chalk from 'chalk';
import ora from 'ora';
import { readJSON, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';

export async function addFieldguides(fieldguides: Array<string>): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.outfitter', 'config.json');

  // Check if initialized
  if (!(await pathExists(configPath))) {
    console.error(
      chalk.red('No fieldguide configuration found. Run "outfitter fg create" first.')
    );
    process.exit(1);
  }

  const spinner = ora('Adding fieldguides...').start();

  try {
    // Read current config
    const config = await readJSON(configPath);

    // Get existing fieldguides (support old 'supplies' key)
    const existingFieldguides = config.fieldguides || config.supplies || [];

    // Add new fieldguides (avoiding duplicates)
    const newFieldguides = fieldguides.filter(
      f => !existingFieldguides.includes(f)
    );
    config.fieldguides = [...existingFieldguides, ...newFieldguides];

    // Remove old supplies key if it exists
    if (config.supplies) {
      delete config.supplies;
    }

    // TODO: In real implementation, fetch actual files from fieldguides package
    // For now, just update config

    await writeJSON(configPath, config, { spaces: 2 });

    spinner.succeed(`Added ${newFieldguides.length} new fieldguides`);

    if (newFieldguides.length > 0) {
      console.log('\n' + chalk.green('Added:'));
      newFieldguides.forEach(f => console.log('  • ' + f));
    }

    const skipped = fieldguides.length - newFieldguides.length;
    if (skipped > 0) {
      console.log(
        '\n' +
          chalk.yellow(`Skipped ${skipped} already installed fieldguides`)
      );
    }
  } catch (error) {
    spinner.fail('Failed to add fieldguides');
    throw error;
  }
}