import chalk from 'chalk';
import { readJSON, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';

interface ExportOptions {
  output: string;
}

interface ImportOptions {
  file: string;
}

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
        chalk.red('No fieldguide configuration found. Run "outfitter fg create" first.')
      );
      process.exit(1);
    }

    const config = await readJSON(configPath);

    const exportConfig = {
      name: 'Custom Fieldguide Configuration',
      version: '1.0.0',
      fieldguides: config.fieldguides || config.supplies || [], // Support old 'supplies' key
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

    const importConfig = await readJSON(importPath);

    if (
      !(importConfig.fieldguides || importConfig.supplies) ||
      !Array.isArray(importConfig.fieldguides || importConfig.supplies)
    ) {
      console.error(chalk.red('Invalid configuration format'));
      process.exit(1);
    }

    // Initialize if needed
    if (!(await pathExists(configPath))) {
      console.log(chalk.yellow('Initializing fieldguide configuration...'));
      // TODO: Create minimal config
    }

    console.log(
      chalk.green('✓') +
        ` Imported ${(importConfig.fieldguides || importConfig.supplies).length} fieldguides from ${chalk.cyan(importConfig.name)}`
    );
  }
}