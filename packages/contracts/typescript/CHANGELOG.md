# @maybegood/typescript-utils

## 0.1.2

### Patch Changes

- chore: prepare initial npm publication

  Bump all packages to 1.0.1 for initial npm publication

- 4350dd6: feat(cli): add terrain detection and comprehensive improvements

  ### Minor Changes - outfitter

  - Added terrain detection system to automatically identify project frameworks, languages, and tools
  - Enhanced fieldguides commands with terrain-aware functionality
  - Improved configuration applier with better error handling and interactive prompts
  - Fixed Prettier configuration to use .prettierrc.cjs with proper CommonJS exports
  - Added lint script to package.json for better developer experience

  ### Patch Changes - @outfitter/contracts

  - Fixed humanize.test.ts to pass Error objects correctly to formatForDevelopers
  - Improved type safety in error handling

  ### Patch Changes - @outfitter/changeset-config

  - Updated ChangesetConfig interface to support false and tuple types for changelog field
  - Added support for more flexible changelog configurations

## 0.1.0

### Minor Changes

- Initial release of Outfitter Packlist shared development configurations

  - **@repo/eslint-config**: Shared ESLint configuration with TypeScript support
  - **@repo/typescript-config**: Base TypeScript configurations for different
    project types
  - **@repo/typescript-utils**: Common TypeScript utility functions including
    Result pattern
  - **@repo/husky-config**: Shareable git hooks configuration with husky
  - **@repo/changeset-config**: Shareable changesets configuration for
    versioning
  - **@outfitter/packlist**: Unified development configuration manager CLI tool

## 0.0.0-test-20250530024305

### Major Changes

- 4b46b9a: Initial release of Maybe Good Starter v0.1.0

  This is the first release of the Maybe Good Starter, a Bun-powered TypeScript
  monorepo with:

  - **@maybegood/typescript-utils**: Result pattern, AppError, and utility types
    for type-safe error handling
  - **@maybegood/react-ui**: shadcn/ui components with Tailwind CSS theme system
  - **@maybegood/eslint-config**: Comprehensive ESLint configuration for
    TypeScript + React
  - **@maybegood/tailwind-config**: Shared Tailwind CSS configuration with
    design tokens
  - **@maybegood/typescript-config**: TypeScript configurations for different
    project types

  All packages follow semantic versioning and use independent release cycles via
  Changesets.
