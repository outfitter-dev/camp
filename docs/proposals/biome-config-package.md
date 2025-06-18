# Centralized Biome Configuration Package

- **Status**: Proposed
- **Date**: 2025-01-18
- **Deciders**: Team

---

## Context and Problem Statement

Our current development toolchain relies on multiple, separate tools for code quality and formatting: ESLint for linting and Prettier for formatting. This setup has several drawbacks:

1. **Performance Overhead**: Running multiple tools (ESLint, Prettier, and their various plugins) on every file is slow, impacting developer feedback loops, especially on pre-commit hooks and CI.
2. **Configuration Complexity**: We maintain configurations for ESLint (`@outfitter/eslint-config`), Prettier (`prettier.config.js`), and various plugins (`eslint-plugin-import`, `eslint-plugin-react`, etc.). This increases maintenance overhead and can lead to conflicts.
3. **Dependency Sprawl**: Our `package.json` files are cluttered with numerous dev dependencies for these tools, making dependency management more complex.

BiomeJS is a modern, all-in-one toolchain written in Rust that provides extremely fast formatting, linting, import sorting, and more. Recent versions of Biome introduce significant features, including type-aware linting (without depending on the TS compiler), robust monorepo support, and a plugin system, making it a viable and compelling alternative to our current setup.

This proposal outlines the creation of a centralized Biome configuration package, `@outfitter/biome-config`, to streamline our development tooling, improve performance, and simplify configuration management.

## Decision Drivers

- **Performance**: Biome is significantly faster than our current ESLint + Prettier setup.
- **Simplicity**: A single tool and configuration file for formatting, linting, and import sorting.
- **Unified Experience**: Consistent tooling and rules across the entire monorepo.
- **Modern Features**: Biome offers advanced import sorting, VCS integration for partial checks, and CI integration.
- **Reduced Dependencies**: Consolidate multiple dev dependencies into a single tool.

## Considered Options

1. **Stick with ESLint + Prettier**: Continue with the current setup. This is the "do nothing" option, which fails to address the performance and complexity issues.
2. **Introduce Biome alongside ESLint**: Use Biome for formatting only, keeping ESLint for linting. This adds another tool and more complexity, defeating the purpose.
3. **Adopt Biome and create a shared configuration package**: This option fully leverages Biome's benefits, addresses our current pain points, and establishes a clean, maintainable pattern for the future.

## Decision

We will adopt Biome as our primary tool for formatting and linting and create a new package, `@outfitter/biome-config`, to house our shared, monorepo-wide configuration.

### Technical Design

A new package will be created at `packages/biome-config`.

#### 1. `@outfitter/biome-config` Package Structure

The package will be very simple:

```
packages/biome-config/
├── biome.json
├── package.json
└── README.md
```

#### 2. Shared `biome.json`

The core of the package will be its `biome.json` file. This file will define our base rules for formatting, linting, and organizing imports.

**`packages/biome-config/biome.json`:**

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "defaultBranch": "main",
    "useIgnoreFile": true
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100,
    "attributePosition": "auto"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "warn",
        "noArrayIndexKey": "error"
      },
      "style": {
        "useNamingConvention": {
          "level": "error",
          "options": {
            "enumMemberCase": "CONSTANT_CASE"
          }
        },
        "noParameterAssign": "error",
        "useConst": "error"
      },
      "complexity": {
        "noBannedTypes": "error",
        "noUselessConstructor": "error"
      },
      "correctness": {
        "noUnusedVariables": {
          "level": "error",
          "options": {
            "argsIgnorePattern": "^_"
          }
        },
        "useArrayLiterals": "error"
      },
      "performance": {
        "noAccumulatingSpread": "error",
        "noDelete": "error"
      },
      "security": {
        "noDangerouslySetInnerHtml": "error"
      },
      "nursery": {
        "useImportType": "error",
        "useExportType": "error"
      }
    },
    "ignore": ["**/dist", "**/build", "**/.next", "**/coverage"]
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    },
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  },
  "json": {
    "parser": {
      "allowComments": true,
      "allowTrailingCommas": true
    }
  },
  "files": {
    "ignore": [
      "**/node_modules",
      "**/.pnpm",
      "**/dist",
      "**/build",
      "**/.next",
      "**/coverage",
      "**/.changeset",
      "**/CHANGELOG.md"
    ]
  }
}
```

#### 3. Consumer Package Configuration

Individual packages within the monorepo will have their own `biome.json` file that simply extends the shared configuration. This is the key to Biome's monorepo support.

**Example: `packages/cli/biome.json`:**

```json
{
  "extends": [
    "../../packages/biome-config/biome.json"
  ]
}
```

*Note: Biome offers a cleaner path resolution syntax for monorepos, but for a shared package config, an explicit relative path ensures portability and clarity.*

#### 4. `package.json` scripts

We will update the `lint` and `format` scripts in our root `package.json` and individual packages to use Biome.

**Root `package.json`:**

```json
{
  "scripts": {
    "format": "biome format . --write",
    "format:check": "biome format .",
    "lint": "biome lint .",
    "lint:fix": "biome lint . --write",
    "check": "biome check .",
    "check:fix": "biome check . --write",
    "ci": "biome ci ."
  }
}
```

### Migration Plan

The migration will be phased to minimize disruption.

1. **Phase 1: Introduction & Coexistence**
    - Create the `@outfitter/biome-config` package.
    - Add `biome.json` files to all packages, extending the shared config.
    - Add Biome to CI to run in parallel with ESLint/Prettier, but do not fail the build on Biome errors yet. This allows us to assess the changes and required code modifications without blocking development.
    - Update `lint-staged` to run `biome check --staged` for fast pre-commit checks.
    - Add `biome` to `.gitignore` patterns for any generated files.

2. **Phase 2: Gradual Rollout**
    - Select a few non-critical packages as canaries for the full migration.
    - In these packages, run `biome lint --apply` to auto-fix violations. Manually fix the remaining issues.
    - Enable Biome to fail CI for these canary packages.

3. **Phase 3: Full Migration**
    - Once confident, roll out the migration across the entire monorepo.
    - Run a monorepo-wide `biome check --write` to apply all fixes.
    - Remove ESLint, Prettier, and all related configuration files and dependencies:
      - `@outfitter/eslint-config` package
      - `.eslintrc.js` files
      - `prettier.config.js` files
      - ESLint dependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-import-resolver-typescript`
      - Prettier dependencies: `prettier`
    - Update all `package.json` scripts to use Biome commands.
    - Update CI workflows to use `biome ci` command.

## Consequences

### Positive

- **Massively Improved Performance**: Linting and formatting will be an order of magnitude faster.
- **Simplified Toolchain**: A single dependency and configuration file for code quality.
- **Reduced Maintenance**: Less configuration to manage and fewer dependencies to update.
- **Consistent Code Style**: Enforced by a single, fast, and opinionated tool.
- **Better Developer Experience**: Faster feedback loops, cleaner `package.json`, and less cognitive overhead.

### Negative

- **Rule Parity**: Biome does not have a 1:1 mapping for every ESLint rule we currently use. We will need to evaluate which, if any, critical rules are missing and whether Biome's existing rules are sufficient. Biome's plugin system is still nascent, so custom rules are not as mature as ESLint's ecosystem.
- **Initial Churn**: The initial migration will require a large, monorepo-wide code modification to align with Biome's formatting and rules. This will be a one-time cost.
- **Learning Curve**: Developers will need to familiarize themselves with Biome's rules and CLI. IDE integration needs to be set up (e.g., installing the Biome VS Code extension).

## Appendix: Current Tool Inventory

Based on the current monorepo state, the following tools and dependencies would be replaced:

### Dependencies to Remove
- `eslint` (^8.55.0)
- `@eslint/js` (9.28.0)
- `typescript-eslint` (8.33.1)
- `eslint-import-resolver-typescript` (^4.4.1)
- `prettier` (^3.5.3)
- `@outfitter/eslint-config` (workspace package)

### Scripts to Update
- `lint`: `eslint . --max-warnings 0` → `biome lint .`
- `format`: `prettier --check .` → `biome format .`
- `format:fix`: `prettier --write .` → `biome format . --write`

### Configuration Files to Remove
- ESLint configurations in individual packages
- Prettier configuration files
- The entire `packages/eslint-config` directory
