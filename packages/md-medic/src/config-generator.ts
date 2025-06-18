import { getPresetConfig } from './presets.js';
import type { PresetName } from './presets.js';

export interface MdlintConfig {
  preset?: PresetName;
  terminology?: Array<{
    incorrect: string;
    correct: string;
  }>;
  customRules?: Array<string>;
  ignores?: Array<string>;
}

export function generateConfig(options: MdlintConfig = {}): string {
  const {
    preset = 'standard',
    terminology = [],
    customRules = [],
    ignores = [],
  } = options;

  // Start with preset
  let config = getPresetConfig(preset);

  // Add terminology section if provided
  if (terminology.length > 0) {
    config += '\n# Terminology enforcement\nterminology:\n';
    terminology.forEach(term => {
      config += `  - { incorrect: "${term.incorrect}", correct: "${term.correct}" }\n`;
    });
  }

  // Add custom rules if provided
  if (customRules.length > 0) {
    config += '\n# Custom rules\ncustomRules:\n';
    customRules.forEach(rule => {
      config += `  - ${rule}\n`;
    });
  }

  // Add additional ignores if provided
  if (ignores.length > 0) {
    config += '\n# Additional ignore patterns\n';
    ignores.forEach(pattern => {
      config += `ignores:\n  - ${pattern}\n`;
    });
  }

  return config;
}

// Default terminology for technical documentation
export const defaultTerminology = [
  { incorrect: 'NPM', correct: 'npm' },
  { incorrect: 'Javascript', correct: 'JavaScript' },
  { incorrect: 'Typescript', correct: 'TypeScript' },
  { incorrect: 'VSCode', correct: 'VS Code' },
  { incorrect: 'MacOS', correct: 'macOS' },
  { incorrect: 'Github', correct: 'GitHub' },
  { incorrect: 'gitlab', correct: 'GitLab' },
  { incorrect: 'nodejs', correct: 'Node.js' },
  { incorrect: 'react native', correct: 'React Native' },
];
