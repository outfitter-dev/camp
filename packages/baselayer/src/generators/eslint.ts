import type { OutfitterConfig, ESLintConfig } from '../types/index.js';

/**
 * Generates ESLint bridge configuration from OutfitterConfig
 * This handles rules that Biome doesn't support yet
 */
export function generateESLintConfig(config: OutfitterConfig): Array<ESLintConfig> {
  const { overrides } = config;

  // Base ESLint bridge configuration
  const baseConfig: Array<ESLintConfig> = [
    // Global ignores for files handled by other tools
    {
      ignores: generateIgnorePatterns(config),
    },

    // TODO: Add eslint-config-biome preset support
    // This would require extending the type system to support preset strings

    // Rules that Biome doesn't support yet
    {
      rules: {
        // Currently empty - reserved for future rules that Biome doesn't support
        // Example: 'import/no-restricted-imports': ['error', {...}]
      },
    },
  ];

  // Apply tool-specific overrides
  if (overrides?.eslint) {
    // Merge the override rules into the last config object
    const lastConfig = baseConfig[baseConfig.length - 1] as ESLintConfig;
    lastConfig.rules = {
      ...lastConfig.rules,
      ...overrides.eslint.rules,
    };

    // Handle other ESLint config properties
    if (overrides.eslint.ignores) {
      baseConfig.unshift({
        ignores: overrides.eslint.ignores,
      });
    }
  }

  return baseConfig;
}

/**
 * Generate ignore patterns based on tool assignments
 */
function generateIgnorePatterns(config: OutfitterConfig): Array<string> {
  const patterns: Array<string> = [
    // Always ignore generated files
    '**/dist/**',
    '**/build/**',
    '**/node_modules/**',
  ];

  const { tools } = config.baselayer;

  // Ignore files handled by Biome
  if (tools.typescript === 'biome' || tools.javascript === 'biome') {
    patterns.push('**/*.{js,jsx,ts,tsx}');
  }

  if (tools.json === 'biome') {
    patterns.push('**/*.{json,jsonc}');
  }

  // Ignore files handled by other tools
  if (tools.markdown === 'markdown-medic') {
    patterns.push('**/*.md');
  }

  return patterns;
}
