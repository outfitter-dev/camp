/**
 * Shared type definitions for Outfitter CLI configuration
 */

export interface OutfitterConfig {
  fieldguides?: Array<string>;
  supplies?: Array<string>; // Legacy field for backward compatibility
  version?: string;
  [key: string]: unknown;
}

export interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface FieldguideConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  files?: Array<string>;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface TerrainFeatures {
  frameworks: Array<string>;
  languages: Array<string>;
  tools: Array<string>;
  testingFrameworks: Array<string>;
  hasTypeScript: boolean;
  hasReact: boolean;
  hasNext: boolean;
  hasVue: boolean;
  hasAngular: boolean;
  hasSvelte: boolean;
  hasVite: boolean;
  hasWebpack: boolean;
  hasJest: boolean;
  hasVitest: boolean;
  hasCypress: boolean;
  hasPlaywright: boolean;
  hasEslint: boolean;
  hasPrettier: boolean;
  hasTailwind: boolean;
  hasDocker: boolean;
  hasGit: boolean;
  isMonorepo: boolean;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

/**
 * Determines whether a value is an {@link OutfitterConfig} object.
 *
 * Returns true if the value is a non-null object containing either the `fieldguides` or `supplies` property.
 */
export function isOutfitterConfig(value: unknown): value is OutfitterConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('fieldguides' in value || 'supplies' in value)
  );
}

/**
 * Determines whether a value is a non-null object, indicating it could be a {@link PackageJson}.
 *
 * @returns `true` if {@link value} is a non-null object; otherwise, `false`.
 */
export function isPackageJson(value: unknown): value is PackageJson {
  return typeof value === 'object' && value !== null;
}
