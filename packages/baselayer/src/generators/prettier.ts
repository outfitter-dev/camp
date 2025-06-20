import type { OutfitterConfig, PrettierConfig } from '../types/index.js';

/**
 * Generates Prettier configuration from OutfitterConfig
 */
export function generatePrettierConfig(config: OutfitterConfig): PrettierConfig {
  const { codeStyle, overrides } = config;

  // Base configuration from declarative preferences
  const baseConfig: PrettierConfig = {
    printWidth: codeStyle.lineWidth,
    tabWidth: codeStyle.indentWidth,
    useTabs: false,
    semi: codeStyle.semicolons === 'always',
    singleQuote: codeStyle.quoteStyle === 'single',
    trailingComma: codeStyle.trailingCommas,
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
  };

  // The 'overrides' array in Prettier needs special handling. We can't just spread it.
  // We'll merge the base overrides with any user-provided overrides.
  const baseOverrides = [
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: '*.{yml,yaml}',
      options: {
        printWidth: 120,
      },
    },
  ];

  const userOverrides = overrides?.prettier?.overrides ?? [];

  return {
    ...baseConfig,
    ...(overrides?.prettier ?? {}),
    overrides: [...baseOverrides, ...userOverrides],
  };
}
