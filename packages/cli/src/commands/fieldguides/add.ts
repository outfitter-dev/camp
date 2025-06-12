import chalk from 'chalk';
import ora from 'ora';
import { readJSON, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';

interface OutfitterConfig {
  fieldguides?: Array<string>;
  supplies?: Array<string>; // Legacy field
  [key: string]: unknown;
}

/**
 * Adds the given fieldguides to the local `.outfitter/config.json` file, ensuring no duplicates.
 *
 * Only fieldguides not already present in the configuration are appended to the `fieldguides` array. If the legacy `supplies` key exists, it is cleared. The configuration file must already exist.
 *
 * @param fieldguides - Names of fieldguides to add.
 *
 * @throws {Error} If the configuration file does not exist.
 */
export async function addFieldguides(
  fieldguides: Array<string>
): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.outfitter', 'config.json');

  // Check if initialized
  if (!(await pathExists(configPath))) {
    const message =
      'No fieldguide configuration found. Run "outfitter fg create" first.';
    // Let the top-level CLI handler decide what to do
    throw new Error(message);
  }

  const spinner = ora('Adding fieldguides...').start();

  try {
    // Read current config
    const config = (await readJSON(configPath)) as OutfitterConfig;

    // Get existing fieldguides (support old 'supplies' key)
    const existingFieldguides = Array.isArray(config.fieldguides)
      ? config.fieldguides
      : Array.isArray(config.supplies)
        ? config.supplies
        : [];

    // Add new fieldguides (avoiding duplicates)
    const newFieldguides = fieldguides.filter(
      f => !existingFieldguides.includes(f)
    );
    config.fieldguides = [...existingFieldguides, ...newFieldguides];

    // drop legacy key without `delete`
    if ('supplies' in config) {
      config.supplies = undefined;
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
        '\n' + chalk.yellow(`Skipped ${skipped} already installed fieldguides`)
      );
    }
  } catch (error) {
    spinner.fail('Failed to add fieldguides');
    throw error;
  }
}
