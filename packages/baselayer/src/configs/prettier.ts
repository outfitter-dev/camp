/**
 * Prettier configuration for Outfitter projects
 * Consistent with Biome formatting but covers files Biome doesn't handle
 */
export const prettierConfig = {
  semi: true,
  singleQuote: true,
  proseWrap: 'preserve' as const,
  printWidth: 80,
  tabWidth: 2,
  trailingComma: 'all' as const,
  useTabs: false,
  endOfLine: 'lf' as const,
  arrowParens: 'always' as const,
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'never' as const,
      },
    },
  ],
};

export default prettierConfig;
