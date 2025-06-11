import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ensureDir, writeJSON, pathExists } from 'fs-extra';
import { join } from 'path';

interface InitOptions {
  preset?: string;
  withClaude?: boolean;
  force?: boolean;
}

const presets = {
  nextjs: [
    'typescript-standards',
    'react-patterns',
    'nextjs-patterns',
    'testing-standards',
  ],
  react: ['typescript-standards', 'react-patterns', 'testing-standards'],
  node: ['typescript-standards', 'testing-standards', 'security-standards'],
  minimal: ['typescript-standards'],
};

export const initCommand = new Command('init')
  .description('Initialize a project with Outfitter fieldguides')
  .option('-p, --preset <preset>', 'Use a preset configuration', 'minimal')
  .option('--with-claude', 'Include CLAUDE.md for AI assistance')
  .option('-f, --force', 'Force initialization even if .outfitter exists')
  .action(async (options: InitOptions) => {
    const cwd = process.cwd();
    const outfitterDir = join(cwd, '.outfitter');

    // Check if already initialized
    if ((await pathExists(outfitterDir)) && !options.force) {
      console.error(
        chalk.red('Project already initialized. Use --force to reinitialize.')
      );
      process.exit(1);
    }

    // Interactive setup if no preset
    let selectedPreset = options.preset;
    if (!selectedPreset || !presets[selectedPreset as keyof typeof presets]) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'preset',
          message: 'Select a project preset:',
          choices: [
            { name: 'Next.js Full Stack', value: 'nextjs' },
            { name: 'React SPA', value: 'react' },
            { name: 'Node.js Backend', value: 'node' },
            { name: 'Minimal (TypeScript only)', value: 'minimal' },
          ],
        },
      ]);
      selectedPreset = answers.preset;
    }

    const spinner = ora('Initializing Outfitter...').start();

    try {
      // Create .outfitter directory
      await ensureDir(outfitterDir);

      // Create config
      const config = {
        version: '1.0.0',
        preset: selectedPreset,
        fieldguides: presets[selectedPreset as keyof typeof presets],
        installed: new Date().toISOString(),
      };

      await writeJSON(join(outfitterDir, 'config.json'), config, { spaces: 2 });

      spinner.succeed('Outfitter initialized successfully!');

      console.log('\n' + chalk.green('✓') + ' Created .outfitter/config.json');
      console.log('\n' + chalk.cyan('Next steps:'));
      console.log(
        '  1. Run ' +
          chalk.yellow('outfitter add <fieldguide>') +
          ' to add specific fieldguides'
      );
      console.log(
        '  2. Run ' +
          chalk.yellow('outfitter list') +
          ' to see available fieldguides'
      );
    } catch (error) {
      spinner.fail('Failed to initialize Outfitter');
      throw error;
    }
  });
