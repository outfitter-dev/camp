import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ArgumentsCamelCase } from 'yargs';
import { select, confirm, input } from '../utils/prompts.js';
import { colors } from '../utils/colors.js';
import { generateConfig, defaultTerminology } from '../config-generator.js';
import type { PresetName } from '../types.js';

interface InitCommandArgs {
  preset?: PresetName;
  quiet?: boolean;
}

export async function initCommand(argv: ArgumentsCamelCase<InitCommandArgs>): Promise<void> {
  const { quiet } = argv;
  let { preset } = argv;
  
  // Check if config already exists
  const configPath = '.markdownlint-cli2.yaml';
  if (existsSync(configPath)) {
    const overwrite = await confirm({
      message: `${configPath} already exists. Overwrite?`,
      default: false
    });
    
    if (!overwrite) {
      console.log(colors.warning('Init cancelled.'));
      return;
    }
  }
  
  // Interactive mode if no preset specified
  if (!preset) {
    preset = await select({
      message: 'Choose a preset:',
      choices: [
        { name: 'strict   - Enforce consistent markdown style', value: 'strict' },
        { name: 'standard - Balanced rules for technical docs', value: 'standard' },
        { name: 'relaxed  - Minimal rules focusing on consistency', value: 'relaxed' }
      ],
      default: 'standard'
    }) as PresetName;
    
    const enableTerminology = await confirm({
      message: 'Enable custom terminology checking?',
      default: true
    });
    
    let ignores: string[] = [];
    const addCustomIgnores = await confirm({
      message: 'Add custom ignore patterns?',
      default: false
    });
    
    if (addCustomIgnores) {
      const patternsInput = await input({
        message: 'Enter ignore patterns (comma-separated):',
        default: ''
      });
      ignores = patternsInput.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // Generate config
    const config = generateConfig({
      preset,
      terminology: enableTerminology ? defaultTerminology : [],
      customRules: enableTerminology ? ['./node_modules/markdown-medic/dist/rules/consistent-terminology.js'] : [],
      ignores
    });
    
    writeFileSync(configPath, config);
  } else {
    // Direct mode with preset
    const config = generateConfig({
      preset,
      terminology: defaultTerminology,
      customRules: ['./node_modules/markdown-medic/dist/rules/consistent-terminology.js']
    });
    
    writeFileSync(configPath, config);
  }
  
  if (!quiet) {
    console.log(colors.success('✅'), `Created ${configPath} with ${preset} preset`);
    console.log(colors.dim('\nNext steps:'));
    console.log(colors.dim('  • Run "mdmedic" to lint your markdown files'));
    console.log(colors.dim('  • Run "mdmedic --fix" to automatically fix issues'));
    console.log(colors.dim('  • Run "mdmedic rules list" to see available rules'));
  }
}