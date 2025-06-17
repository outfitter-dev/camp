# outfitter

## 1.1.0

### Minor Changes

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

### Patch Changes

- chore: prepare initial npm publication

  Bump all packages to 1.0.1 for initial npm publication

## 1.0.0

### Major Changes

- 3b35272: Initial release of the Outfitter CLI

  - Command-line tool for equipping development projects with configurations and
    fieldguides
  - Supports `outfitter equip` for interactive project setup
  - Supports `outfitter fieldguides` for managing documentation and patterns
  - Ready for npm publishing with proper TypeScript compilation and executable
    permissions
