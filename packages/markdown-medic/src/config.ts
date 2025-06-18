import { readFile } from 'fs/promises';
import * as yaml from 'js-yaml';
import { existsSync } from 'fs';
import { presets } from './presets.js';

export interface Config {
  preset?: 'strict' | 'standard' | 'relaxed';
  rules?: RuleSet;
  ignore?: string[];
  terminology?: Array<{
    incorrect: string;
    correct: string;
  }>;
}

export interface RuleSet {
  // Standard markdownlint rules
  'line-length'?: number | false;
  'heading-style'?: 'atx' | 'atx_closed' | 'setext';
  'list-marker-space'?: boolean;
  'no-inline-html'?: boolean;
  'no-trailing-punctuation'?: boolean;
  
  // Custom rules
  'no-dead-links'?: boolean;
  'consistent-terminology'?: boolean;
  'frontmatter-required'?: boolean;
  'toc-required'?: boolean | { minHeadings: number };
  'code-block-language'?: boolean;
  
  // Allow any other rules
  [key: string]: any;
}

export async function loadConfig(
  configPath: string = '.mdlint.yaml',
  defaultPreset: string = 'standard'
): Promise<Config> {
  let config: Config = { preset: defaultPreset as any };
  
  // Try to load config file
  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8');
      const parsed = yaml.load(content) as Config;
      config = { ...config, ...parsed };
    } catch (error) {
      console.warn(`Warning: Failed to load config from ${configPath}:`, error);
    }
  }
  
  // Apply preset rules
  const presetName = config.preset || 'standard';
  const preset = presets[presetName];
  
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }
  
  // Merge preset rules with custom rules
  config.rules = {
    ...preset.rules,
    ...(config.rules || {})
  };
  
  // Merge ignore patterns
  config.ignore = [
    ...(preset.ignore || []),
    ...(config.ignore || [])
  ];
  
  return config;
}

export function getRuleValue(config: Config, ruleName: string): any {
  return config.rules?.[ruleName];
}