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

    // Rules that Biome doesn't support yet
    {
      rules: {
        // Currently empty - reserved for future rules that Biome doesn't support
        // Example: 'import/no-restricted-imports': ['error', {...}]
      },
    },
  ];

  // Apply tool-specific overrides safely
  if (overrides?.eslint) {
    return applyESLintOverrides(baseConfig, overrides.eslint);
  }

  return baseConfig;
}

/**
 * Apply ESLint overrides to base configuration safely
 */
function applyESLintOverrides(
  baseConfig: Array<ESLintConfig>,
  eslintOverrides: NonNullable<OutfitterConfig['overrides']>['eslint']
): Array<ESLintConfig> {
  if (!eslintOverrides) {
    return baseConfig;
  }

  const result = [...baseConfig];

  // Handle additional ignores
  if (eslintOverrides.ignores && eslintOverrides.ignores.length > 0) {
    result.unshift({
      ignores: eslintOverrides.ignores,
    });
  }

  // Safely merge rules into the last config object that has rules
  const rulesConfigIndex = result.findIndex(config => 'rules' in config);
  if (rulesConfigIndex !== -1 && eslintOverrides.rules) {
    const existingRulesConfig = result[rulesConfigIndex];
    result[rulesConfigIndex] = {
      ...existingRulesConfig,
      rules: {
        ...existingRulesConfig.rules,
        ...eslintOverrides.rules,
      },
    };
  } else if (eslintOverrides.rules) {
    // If no rules config exists, create one
    result.push({
      rules: eslintOverrides.rules,
    });
  }

  // Handle any other ESLint config properties that might be added in the future
  const { ignores, rules, ...otherOverrides } = eslintOverrides;
  if (Object.keys(otherOverrides).length > 0) {
    result.push(otherOverrides);
  }

  return result;
}

/**
 * Generate ignore patterns based on tool assignments
 * Patterns are deduplicated to avoid redundancy
 */
function generateIgnorePatterns(config: OutfitterConfig): Array<string> {
  const patternSet = new Set<string>([
    // Always ignore generated files and common build directories
    '**/dist/**',
    '**/build/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/.output/**',
    '**/.turbo/**',
    '**/.vercel/**',
    '**/.netlify/**',
    '**/.tmp/**',
    '**/.temp/**',
    '**/.DS_Store',
    '**/Thumbs.db',
  ]);

  const { tools } = config.baselayer;

  // Ignore files handled by Biome for JavaScript/TypeScript
  if (tools.typescript === 'biome' || tools.javascript === 'biome') {
    patternSet.add('**/*.{js,jsx,ts,tsx,mjs,cjs}');
  }

  // Ignore JSON files handled by Biome
  if (tools.json === 'biome') {
    patternSet.add('**/*.{json,jsonc}');
  }

  // Ignore CSS files if handled by Biome (future support)
  if (tools.css === 'biome') {
    patternSet.add('**/*.{css,scss,sass,less}');
  }

  // Ignore Markdown files handled by markdown-medic
  if (tools.markdown === 'markdown-medic') {
    patternSet.add('**/*.{md,mdx}');
  }

  // Ignore YAML files if handled by other tools
  if (tools.yaml && tools.yaml !== 'eslint') {
    patternSet.add('**/*.{yml,yaml}');
  }

  // Convert Set back to Array and sort for consistent output
  return Array.from(patternSet).sort();
}