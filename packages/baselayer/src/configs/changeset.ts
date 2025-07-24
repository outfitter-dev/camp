/**
 * Changesets configuration for Outfitter projects
 * Standard configuration for version management and publishing
 */
export const changesetConfig = {
  $schema: 'https://unpkg.com/@changesets/config@2.3.1/schema.json',
  changelog: '@changesets/cli/changelog',
  commit: false,
  fixed: [],
  linked: [],
  access: 'public' as const,
  baseBranch: 'main',
  updateInternalDependencies: 'patch' as const,
  ignore: [],
};

export default changesetConfig;
