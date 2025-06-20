import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import type { ArgumentsCamelCase } from 'yargs';
import { colors } from '../utils/colors.js';

interface LintCommandArgs {
  files?: string[];
  fix?: boolean;
  config?: string;
  quiet?: boolean;
  verbose?: boolean;
}

// Create require for markdownlint-cli2
const require = createRequire(import.meta.url);

export async function lintCommand(argv: ArgumentsCamelCase<LintCommandArgs>): Promise<void> {
  const { files = ['.'], fix, config, quiet, verbose } = argv;
  
  try {
    // Import markdownlint-cli2
    const { main: markdownlintCli2Main } = require('markdownlint-cli2');
    
    // Build arguments for markdownlint-cli2
    const args: string[] = [];
    
    // Add files
    args.push(...files);
    
    // Add options
    if (fix) args.push('--fix');
    if (config) args.push('--config', config);
    
    // Check if we have a config file
    const hasConfig = config || 
      existsSync('.markdownlint-cli2.yaml') ||
      existsSync('.markdownlint-cli2.jsonc') ||
      existsSync('.markdownlint-cli2.json') ||
      existsSync('.markdownlint.yaml') ||
      existsSync('.markdownlint.json');
    
    if (!hasConfig && !quiet) {
      console.log(colors.warning('No configuration file found. Run "mdmedic init" to create one.'));
    }
    
    // Call markdownlint-cli2
    const params = {
      argv: args,
      logMessage: quiet ? () => {} : console.log,
      logError: console.error
    };
    
    if (verbose && !quiet) {
      console.log(colors.dim(`Running markdownlint-cli2 with args: ${args.join(' ')}`));
    }
    
    const result = await markdownlintCli2Main(params);
    
    if (result !== 0) {
      process.exit(result);
    }
  } catch (error) {
    console.error(colors.error('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}