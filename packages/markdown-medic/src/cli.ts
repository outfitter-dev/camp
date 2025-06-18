#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import markdownlintCli2 from 'markdownlint-cli2';
import type { MarkdownlintOptions } from 'markdownlint-cli2';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getPresetConfig } from './presets.js';
import type { PresetName } from './presets.js';
import { generateConfig, defaultTerminology } from './config-generator.js';

const program = new Command();

program
  .name('mdic')
  .description(
    'Markdown Inspect & Correct - Opinionated markdown linting powered by markdownlint-cli2'
  )
  .version('1.0.4')
  .argument('[files...]', 'Files or glob patterns to check')
  .option('-f, --fix', 'Fix auto-fixable issues')
  .option(
    '-p, --preset <preset>',
    'Use a preset (strict, standard, relaxed)',
    'standard'
  )
  .option('-c, --config <path>', 'Path to config file')
  .option('--init [preset]', 'Create a default config file')
  .action(async (files: Array<string>, options) => {
    try {
      // Handle --init
      if (options.init !== undefined) {
        const preset = options.init || 'standard';
        await createConfigFile(preset);
        console.log(
          chalk.green(`✅ Created .mdic.yaml with ${preset} preset`)
        );
        return;
      }

      // Build markdownlint-cli2 options
      const cli2Options: Record<string, unknown> = {
        fix: options.fix || false,
      };

      // If files provided, use them; otherwise use default globs
      if (files.length > 0) {
        cli2Options['argv'] = files;
      } else {
        cli2Options['argv'] = ['**/*.md'];
      }

      // Handle config
      if (options.config) {
        cli2Options['config'] = options.config;
      } else if (
        !existsSync('.mdlint.yaml') &&
        !existsSync('.markdownlint.yaml') &&
        !existsSync('.markdownlint.json')
      ) {
        // Create temporary config with preset
        const tempConfigPath = resolve(process.cwd(), '.mdlint-temp.yaml');
        const presetConfig = getPresetConfig(options.preset as PresetName);
        writeFileSync(tempConfigPath, presetConfig);
        cli2Options['config'] = tempConfigPath;

        // Clean up temp file on exit
        process.on('exit', () => {
          try {
            if (existsSync(tempConfigPath)) {
              require('fs').unlinkSync(tempConfigPath);
            }
          } catch {}
        });
      }

      // Run markdownlint-cli2
      const result = await markdownlintCli2.main(
        cli2Options as MarkdownlintOptions
      );

      if (result === 0) {
        console.log(chalk.green('\n✅ All files are healthy!'));
      } else {
        if (options.fix) {
          console.log(
            chalk.yellow('\n⚠️  Some issues could not be auto-fixed')
          );
        } else {
          console.log(
            chalk.red('\n❌ Issues found. Run with --fix to auto-fix.')
          );
        }
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red('Error:'),
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

program.parse();

async function createConfigFile(presetName: string): Promise<void> {
  // Generate config with default terminology and custom rules
  const config = generateConfig({
    preset: presetName as PresetName,
    terminology: defaultTerminology,
    customRules: [
      './node_modules/@outfitter/markdown-medic/dist/rules/consistent-terminology.js',
    ],
  });
  writeFileSync('.mdic.yaml', config);
}
