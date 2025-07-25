# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `@outfitter/packlist` package - a unified development configuration manager for Outfitter projects. It orchestrates the installation and configuration of other Outfitter packages (TypeScript, utilities) and provides both a CLI and programmatic API for project setup.

## Key Commands

### Development

```bash
# Build the package
bun run build

# Watch mode for development
bun run dev

# Run tests
bun run test              # Watch mode
bun run test --run        # Single run

# Type checking
bun run type-check
```

### CLI Usage (when installed)

```bash
# Initialize a project with default configurations
packlist init

# Initialize with specific options
packlist init --force --no-eslint
```

## Architecture

### Package Structure

- `src/index.ts` - Main exports and configuration registry
- `src/init.ts` - Project initialization logic
- `src/config.ts` - Configuration types and defaults
- `src/cli.ts` - Command-line interface (if present)

### Core Functionality

- **Project Initialization**: Sets up TypeScript and other configurations
- **Package Manager Detection**: Automatically detects npm, yarn, pnpm, or bun
- **Configuration Generation**: Creates config files for various tools
- **Dependency Management**: Installs required Outfitter packages

### Dependencies

This package orchestrates the installation of:

- `@outfitter/typescript-config` - TypeScript configurations
- `@outfitter/contracts` - Utility functions with Result pattern
- `@outfitter/husky-config` - Git hooks setup
- `@outfitter/changeset-config` - Changesets configuration

### Configuration Options

```typescript
interface PacklistConfig {
  typescript?: boolean; // Include TypeScript config
  utils?: boolean; // Include utilities
  biome?: boolean; // Include Biome config
}
```

## Usage Patterns

### Programmatic API

```typescript
import { init } from '@outfitter/packlist';

// Initialize with defaults
await init();

// Initialize with options
await init({
  force: true, // Overwrite existing configs
  typescript: true, // Include TypeScript
  utils: true, // Include utilities
  biome: true, // Include Biome
});
```

### Configuration Files Created

- `tsconfig.json` - TypeScript configuration
- `biome.json` - Biome configuration (if enabled)

## Build Configuration

Uses `tsup` to build:

- Both CJS and ESM formats
- TypeScript declarations included
- CLI executable included in `bin`

## Important Notes

- This is the core library used by `@outfitter/cli` for supply management
- It provides the low-level APIs for configuration setup
- All error handling uses the Result pattern from `@outfitter/contracts`
- The package is designed to be idempotent - running init multiple times is safe
