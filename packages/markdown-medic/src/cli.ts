#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { checkMarkdown, fixMarkdown } from './index.js';
import { loadConfig } from './config.js';
import type { Config } from './config.js';

const program = new Command();

program
  .name('mdlint')
  .description('Opinionated markdown linting and formatting')
  .version('1.0.4')
  .argument('[files...]', 'Files or glob patterns to check', ['**/*.md'])
  .option('-f, --fix', 'Fix auto-fixable issues')
  .option('-p, --preset <preset>', 'Use a preset (strict, standard, relaxed)', 'standard')
  .option('-c, --config <path>', 'Path to config file', '.mdlint.yaml')
  .option('--init', 'Create a default config file')
  .action(async (files: string[], options) => {
    try {
      // Handle --init
      if (options.init) {
        await createDefaultConfig();
        console.log(chalk.green('✅ Created .mdlint.yaml'));
        return;
      }

      // Load config
      const config = await loadConfig(options.config, options.preset);
      
      // Find files
      const filePaths = await findFiles(files, config);
      
      if (filePaths.length === 0) {
        console.log(chalk.yellow('No markdown files found'));
        return;
      }

      console.log(chalk.blue(`Checking ${filePaths.length} files...`));
      
      let hasErrors = false;
      let fixedCount = 0;

      for (const filePath of filePaths) {
        const content = await readFile(filePath, 'utf-8');
        
        if (options.fix) {
          const fixed = await fixMarkdown(content, { 
            config,
            filePath 
          });
          
          if (fixed !== content) {
            await writeFile(filePath, fixed);
            fixedCount++;
            console.log(chalk.green(`✅ Fixed ${filePath}`));
          }
        } else {
          const results = await checkMarkdown(content, { 
            config,
            filePath 
          });
          
          if (results.length > 0) {
            hasErrors = true;
            console.log(chalk.red(`\n❌ ${filePath}`));
            
            for (const result of results) {
              const location = result.line ? `:${result.line}` : '';
              const column = result.column ? `:${result.column}` : '';
              console.log(
                chalk.gray(`  ${location}${column}`) + 
                ' ' + 
                chalk.yellow(result.rule) + 
                ' ' + 
                result.message
              );
            }
          } else {
            console.log(chalk.green(`✅ ${filePath}`));
          }
        }
      }

      if (options.fix) {
        console.log(chalk.green(`\n✅ Fixed ${fixedCount} files`));
      } else if (hasErrors) {
        console.log(chalk.red('\n❌ Issues found. Run with --fix to auto-fix.'));
        process.exit(1);
      } else {
        console.log(chalk.green('\n✅ All files are healthy!'));
      }

    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

async function findFiles(patterns: string[], config: Config): Promise<string[]> {
  const files = new Set<string>();
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: config.ignore || ['node_modules/**', '.git/**'],
      nodir: true
    });
    
    for (const match of matches) {
      if (match.endsWith('.md')) {
        files.add(resolve(match));
      }
    }
  }
  
  return Array.from(files);
}

async function createDefaultConfig(): Promise<void> {
  const defaultConfig = `# Markdown Medic Configuration
# See: https://github.com/outfitter-dev/monorepo/tree/main/packages/markdown-medic

# Preset: strict, standard, or relaxed
preset: standard

# Custom rule overrides
rules:
  # Standard markdownlint rules
  line-length: 100
  heading-style: atx
  list-marker-space: true
  
  # Custom markdown-medic rules
  no-dead-links: true
  consistent-terminology: true
  code-block-language: true

# Files to ignore
ignore:
  - node_modules/**
  - .git/**
  - CHANGELOG.md
  - '**/node_modules/**'
  - '**/dist/**'

# Terminology enforcement
terminology:
  - { incorrect: "NPM", correct: "npm" }
  - { incorrect: "Javascript", correct: "JavaScript" }
  - { incorrect: "Typescript", correct: "TypeScript" }
  - { incorrect: "VSCode", correct: "VS Code" }
  - { incorrect: "MacOS", correct: "macOS" }
`;

  await writeFile('.mdlint.yaml', defaultConfig);
}