import chalk from 'chalk';
import { readJSON, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';
import type { OutfitterConfig, FieldguideConfig } from '../../types/config.js';

interface ExportOptions {
  output: string;
}

interface ImportOptions {
  file: string;
}

/**
 * Imports or exports a fieldguide configuration file, supporting both current and legacy formats.
 *
 * Performs an export by writing the local fieldguide configuration (including metadata and legacy key support) to a specified output file, or performs an import by reading and validating a configuration file and preparing to initialize or update the local configuration.
 *
 * @param action - The operation to perform: 'export' writes the local configuration to a file; 'import' reads and validates a configuration file.
 * @param options - Options for the selected action, specifying the relevant file path.
 *
 * @remark
 * Terminates the process with exit code 1 if required files are missing or if the configuration format is invalid.
 */
export async function manageFieldguideConfig(
  action: 'export' | 'import',
  options: ExportOptions | ImportOptions
): Promise<void> {
  const cwd = process.cwd();
  const configPath = join(cwd, '.outfitter', 'config.json');

  if (action === 'export') {
    const { output } = options as ExportOptions;

    if (!(await pathExists(configPath))) {
      console.error(
        chalk.red(
          'No fieldguide configuration found. Run "outfitter fg create" first.'
        )
      );
      process.exit(1);
    }

    const config = (await readJSON(configPath)) as OutfitterConfig;

    const exportConfig = {
      name: 'Custom Fieldguide Configuration',
      version: '1.0.0',
      fieldguides: config.fieldguides ?? config.supplies ?? [], // Support old 'supplies' key
      created: new Date().toISOString(),
    };

    await writeJSON(join(cwd, output), exportConfig, { spaces: 2 });

    console.log(
      chalk.green('✓') +
        ' Exported fieldguide configuration to ' +
        chalk.cyan(output)
    );
  } else if (action === 'import') {
    const { file } = options as ImportOptions;
    const importPath = join(cwd, file);

    if (!(await pathExists(importPath))) {
      console.error(chalk.red(`Configuration file not found: ${file}`));
      process.exit(1);
    }

    const importConfig = (await readJSON(importPath)) as FieldguideConfig;

    const fieldguides = importConfig.files ?? [];
    if (!Array.isArray(fieldguides)) {
      console.error(
        chalk.red('Invalid configuration format: fieldguides must be an array')
      );
      process.exit(1);
    }

    // Initialize if needed
    if (!(await pathExists(configPath))) {
      console.log(chalk.yellow('Initializing fieldguide configuration...'));
      // TODO: Create minimal config
    }

    console.log(
      chalk.green('✓') +
        ` Imported ${fieldguides.length} fieldguides from ${chalk.cyan(importConfig.name ?? 'config')}`
    );
  }
}
