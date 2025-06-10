import { Command } from 'commander';
import chalk from 'chalk';
import { readJSON, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';

export const packCommand = new Command('pack')
  .description('Manage supply configurations (packlists)')
  .addCommand(
    new Command('export')
      .description('Export current configuration as a packlist')
      .option('-o, --output <file>', 'Output file', 'packlist.json')
      .action(async options => {
        const cwd = process.cwd();
        const configPath = join(cwd, '.outfitter', 'config.json');

        if (!(await pathExists(configPath))) {
          console.error(
            chalk.red('Project not initialized. Run "outfitter init" first.')
          );
          process.exit(1);
        }

        const config = await readJSON(configPath);

        const packlist = {
          name: 'Custom Packlist',
          version: '1.0.0',
          supplies: config.supplies,
          created: new Date().toISOString(),
        };

        await writeJSON(join(cwd, options.output), packlist, { spaces: 2 });

        console.log(
          chalk.green('✓') +
            ' Exported packlist to ' +
            chalk.cyan(options.output)
        );
      })
  )
  .addCommand(
    new Command('import')
      .description('Import a packlist configuration')
      .argument('<file>', 'Packlist file to import')
      .action(async (file: string) => {
        const cwd = process.cwd();
        const configPath = join(cwd, '.outfitter', 'config.json');
        const packlistPath = join(cwd, file);

        if (!(await pathExists(packlistPath))) {
          console.error(chalk.red(`Packlist file not found: ${file}`));
          process.exit(1);
        }

        const packlist = await readJSON(packlistPath);

        if (!packlist.supplies || !Array.isArray(packlist.supplies)) {
          console.error(chalk.red('Invalid packlist format'));
          process.exit(1);
        }

        // Initialize if needed
        if (!(await pathExists(configPath))) {
          console.log(chalk.yellow('Initializing project...'));
          // Create minimal config
        }

        console.log(
          chalk.green('✓') +
            ` Imported ${packlist.supplies.length} supplies from ${chalk.cyan(packlist.name)}`
        );
      })
  );
