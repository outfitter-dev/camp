import type { OutfitterConfig } from '../types/index.js';

interface VSCodeSettings {
  [key: string]: unknown;
}

/**
 * Generates VS Code settings from OutfitterConfig
 */
export function generateVSCodeSettings(config: OutfitterConfig): VSCodeSettings {
  const { tools } = config.baselayer;

  const settings: VSCodeSettings = {
    // Base settings for all projects
    'editor.formatOnSave': true,
    'editor.codeActionsOnSave': {},
    'files.eol': '\n',
    'files.insertFinalNewline': true,
    'files.trimTrailingWhitespace': true,
  };

  // Configure based on tool selection
  if (tools.typescript === 'biome' || tools.javascript === 'biome') {
    settings['biome.enabled'] = true;
    settings['editor.defaultFormatter'] = 'biomejs.biome';

    // Language-specific settings for JS/TS files
    const jstsSettings = {
      'editor.defaultFormatter': 'biomejs.biome',
    };

    settings['[javascript]'] = jstsSettings;
    settings['[typescript]'] = jstsSettings;
    settings['[javascriptreact]'] = jstsSettings;
    settings['[typescriptreact]'] = jstsSettings;

    // Biome code actions
    const codeActions = settings['editor.codeActionsOnSave'] as Record<string, string>;
    codeActions['quickfix.biome'] = 'explicit';
    codeActions['source.organizeImports.biome'] = 'explicit';
  }

  if (tools.json === 'biome') {
    settings['[json]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
    settings['[jsonc]'] = {
      'editor.defaultFormatter': 'biomejs.biome',
    };
  }

  // Configure Prettier for files not handled by Biome
  const prettierFiles: Array<string> = [];

  if (tools.css === 'prettier') {
    prettierFiles.push('css', 'scss', 'less');
  }

  if (tools.yaml === 'prettier') {
    prettierFiles.push('yaml', 'yml');
  }

  if (tools.markdown === 'prettier') {
    prettierFiles.push('markdown');
  }

  // Set Prettier as formatter for its assigned file types
  for (const fileType of prettierFiles) {
    settings[`[${fileType}]`] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
  }

  // TypeScript settings
  settings['typescript.preferences.includePackageJsonAutoImports'] = 'auto';
  settings['typescript.suggest.autoImports'] = true;

  return settings;
}
