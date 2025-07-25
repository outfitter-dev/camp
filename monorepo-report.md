# Outfitter Monorepo Structure Report

## Overview

This report provides a comprehensive analysis of the `@outfitter/monorepo` structure, including all packages, build tools, dependencies, and the overall build pipeline.

## Directory Structure

```text
.
├── ai/                     # AI agent prompts, memory, and rules
│   ├── memory/            # Migration and update analysis docs
│   ├── prompts/           # AI persona definitions (Max)
│   └── rules/             # Tech stack preferences
├── docs/                   # Documentation and proposals
│   ├── architecture/      # System design documents
│   ├── contributing/      # Development guidelines
│   ├── decisions/         # Architecture Decision Records
│   ├── migration/         # Migration guides
│   ├── proposals/         # Feature proposals
│   └── research/          # Research documents
├── packages/               # Main package directory
│   ├── baselayer/         # Config orchestrator (NEW)
│   ├── biome-config/      # Biome linter config
│   ├── changeset-config/  # Release management
│   ├── cli/               # Main CLI tool
│   ├── contracts/         # Core utilities
│   │   └── typescript/    # Zero-dependency utils
│   ├── contracts-zod/     # Zod integration
│   ├── eslint-config/     # ESLint config (DEPRECATED)
│   ├── fieldguides/       # Documentation system
│   ├── flint/             # Unified formatter/linter (NEW)
│   ├── formatting/        # Markdown formatter
│   ├── husky-config/      # Git hooks
│   ├── packlist/          # Config manager
│   ├── prettier-config/   # Prettier config (PRIVATE)
│   ├── remark-config/     # Markdown processor (NEW)
│   ├── rightdown/         # Markdown linter
│   └── typescript-config/ # TS configurations
├── scripts/                # Build and utility scripts
├── shared/                 # Shared configurations (NEW)
│   ├── build/             # Shared build configs
│   ├── configs/           # Migrated config packages
│   └── testing/           # Shared test configs
├── CLAUDE.md              # AI agent instructions
├── README.md              # Project overview
├── biome.json             # Biome configuration
├── bunfig.toml            # Bun configuration
├── package.json           # Root package.json
└── tsconfig.json          # Root TypeScript config
```

## Package Descriptions and Status

### Core Packages

#### 1. **@outfitter/contracts** (v1.1.0) - ✅ Stable

- **Purpose**: Zero-dependency core utilities providing Result pattern for error handling, branded types, and assertions
- **State**: Production-ready, well-tested, foundational package
- **Key exports**: Result, AppError, success, failure, makeError, assert functions
- **Why**: Ensures type-safe error handling across all packages without external dependencies

#### 2. **@outfitter/contracts-zod** (v1.1.0) - ✅ Stable

- **Purpose**: Bridges Zod validation with the Result pattern from contracts
- **State**: Production-ready, integrates Zod validation into the Result pattern
- **Key features**: fromZod, validateEnv, schema validation utilities
- **Why**: Provides type-safe runtime validation while maintaining Result pattern consistency

### Configuration Packages

#### 3. **@outfitter/typescript-config** (v1.0.2) - ✅ Stable

- **Purpose**: Shared TypeScript configurations for different project types
- **State**: Mature, provides base, next, and vite configurations
- **Files**: base.json, next.json, vite.json
- **Why**: Ensures consistent TypeScript settings across all packages

#### 4. **@outfitter/biome-config** (v0.1.0) - 🟡 Private/Experimental

- **Purpose**: Shared Biome linter/formatter configuration
- **State**: Private package, experimental
- **Why**: Centralizes Biome configuration for the monorepo

#### 5. **@outfitter/eslint-config** (v1.0.2) - ⚠️ Deprecated

- **Purpose**: ESLint configuration (being replaced by Biome)
- **State**: Deprecated, scheduled for removal
- **Why**: Legacy, being replaced by Biome for better performance

#### 6. **@outfitter/prettier-config** (v0.1.0) - 🟡 Private

- **Purpose**: Prettier formatter configuration
- **State**: Private package, basic config only
- **Why**: Provides consistent code formatting (may be replaced by Biome)

#### 7. **@outfitter/changeset-config** (v1.0.1) - ✅ Stable

- **Purpose**: Configuration for changesets version management
- **State**: Stable, used for coordinated releases
- **Why**: Manages versioning and changelogs across packages

#### 8. **@outfitter/husky-config** (v1.0.1) - ✅ Stable

- **Purpose**: Git hooks configuration using Husky
- **State**: Stable, provides pre-commit and commit-msg hooks
- **Why**: Ensures code quality checks before commits

### Tool Packages

#### 9. **@outfitter/cli** (v1.0.6) - ✅ Stable

- **Purpose**: Main command-line interface for Outfitter tools
- **State**: Production-ready, actively maintained
- **Key commands**: init, update, doctor, git-prune
- **Why**: User-facing tool for managing Outfitter configurations

#### 10. **@outfitter/packlist** (v1.0.5) - ✅ Stable

- **Purpose**: Configuration manager that orchestrates package installation
- **State**: Stable, core library used by CLI
- **Why**: Handles the complex logic of setting up development environments

#### 11. **@outfitter/flint** (v0.1.0) - 🟢 New/Active

- **Purpose**: Unified formatter and linter setup tool
- **State**: New package, actively being developed
- **Key features**: Orchestrates Biome, Oxlint, Prettier, and other tools
- **Why**: Simplifies the complex landscape of formatting/linting tools

#### 12. **@outfitter/formatting** (v1.2.2) - ✅ Stable

- **Purpose**: Intelligent Markdown formatting with code block preservation
- **State**: Stable, specialized for markdown processing
- **Why**: Handles complex markdown formatting scenarios

#### 13. **@outfitter/rightdown** (v0.1.0) - 🟢 Active Development

- **Purpose**: Opinionated Markdown linter with terminology enforcement
- **State**: Under development, growing feature set
- **Why**: Enforces consistent writing style and terminology

#### 14. **@outfitter/remark-config** (v0.1.0) - 🟢 New

- **Purpose**: Remark processor configuration for markdown
- **State**: New package, part of markdown processing pipeline
- **Why**: Provides advanced markdown processing capabilities

#### 15. **@outfitter/baselayer** (v1.0.0) - 🟢 New

- **Purpose**: Declarative toolchain configuration orchestrator
- **State**: New package, aims to simplify tool configuration
- **Why**: Provides a higher-level abstraction for development setup

### Documentation

#### 16. **@outfitter/fieldguides** (v1.0.4) - ✅ Stable

- **Purpose**: Living documentation system for AI agents and developers
- **State**: Stable, contains extensive guides and standards
- **Key content**: Coding standards, patterns, guides, templates
- **Why**: Ensures consistent development practices across projects

## Root Package Configuration

```json
{
  "name": "@outfitter/monorepo",
  "version": "0.0.0",
  "description": "Core shared configurations and utilities for Outfitter projects",
  "private": true,
  "engines": {
    "node": ">=20",
    "bun": ">=1.2.0"
  },
  "packageManager": "bun@1.2.19",
  "workspaces": ["packages/*", "packages/contracts/*", "shared"],
  "scripts": {
    "dev": "echo 'Use bun run dev in specific package directory'",
    "build": "bun run -F '@outfitter/contracts' build && bun run -F '@outfitter/*' build",
    "build:all": "bun run -F '@outfitter/*' build",
    "test:all": "bun run -F '@outfitter/*' test",
    "test": "bun test",
    "lint": "biome lint .",
    "lint:fix": "biome lint . --write",
    "lint:md": "markdownlint-cli2 .",
    "format": "biome format .",
    "format:fix": "biome format . --write",
    "type-check": "tsc --noEmit",
    "check": "biome check . --write",
    "check:ci": "biome check .",
    "ci": "bun run format && bun run lint && bun run lint:md && bun run type-check && bun test",
    "ci:local": "bun run format:fix && bun run lint && bun run lint:md && bun run type-check && bun test",
    "changeset": "changeset",
    "changeset:version": "changeset version",
    "changeset:publish": "changeset publish",
    "check:all": "bun run format && bun run lint && bun run lint:md && bun run type-check",
    "config:mdlint": "bun ./scripts/generate-mdlint-config.mjs",
    "check:imports": "bun ./scripts/check-contracts-imports.ts",
    "prepare": "lefthook install && bun config:mdlint"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.1.2",
    "@changesets/cli": "^2.27.1",
    "@types/glob": "^8.1.0",
    "@types/node": "^20.10.4",
    "glob": "^11.0.2",
    "lefthook": "^1.12.2",
    "markdownlint-cli2": "^0.15.0",
    "typescript": "^5.8.3",
    "ultracite": "5.0.47",
    "vitest": "^1.6.1",
    "@types/bun": "latest"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo#readme",
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  }
}
```

## Package Configurations

### 1. @outfitter/contracts (v1.1.0)

```json
{
  "name": "@outfitter/contracts",
  "version": "1.1.0",
  "description": "Core contracts for building type-safe applications, including Result, AppError, and domain types.",
  "keywords": [
    "typescript",
    "utilities",
    "result",
    "error-handling",
    "type-safe",
    "contracts"
  ],
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./error": {
      "types": "./dist/error.d.ts",
      "default": "./dist/error.js"
    },
    "./result": {
      "types": "./dist/result.d.ts",
      "default": "./dist/result.js"
    },
    "./assert": {
      "types": "./dist/assert.d.ts",
      "default": "./dist/assert.js"
    },
    "./branded": {
      "types": "./dist/types/branded.d.ts",
      "default": "./dist/types/branded.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/types/index.js"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": ["dist/**", "vitest.config.ts"],
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/contracts/typescript"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/contracts/typescript#readme",
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": ">=18.12"
  }
}
```

### 2. @outfitter/contracts-zod (v1.1.0)

```json
{
  "name": "@outfitter/contracts-zod",
  "version": "1.1.0",
  "description": "Zod helpers that integrate with @outfitter/contracts Result and AppError types.",
  "type": "module",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist/**", "vitest.config.ts"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@outfitter/contracts": "workspace:*"
  },
  "peerDependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "tsup": "^8.0.1",
    "typescript": "^5.8.3",
    "vitest": "^1.6.1"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/contracts-zod"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/contracts-zod#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

## Configuration Packages

### 3. @outfitter/typescript-config (v1.0.4)

```json
{
  "name": "@outfitter/typescript-config",
  "version": "1.0.4",
  "description": "Shared TypeScript configurations for Outfitter projects",
  "main": "./base.json",
  "exports": {
    "./base": "./base.json",
    "./base.json": "./base.json",
    "./next": "./next.json",
    "./next.json": "./next.json",
    "./vite": "./vite.json",
    "./vite.json": "./vite.json",
    "./package.json": "./package.json"
  },
  "files": ["*.json"],
  "scripts": {
    "build": "echo 'No build needed for JSON configs'",
    "type-check": "tsc --noEmit"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/typescript-config"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/typescript-config#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. @outfitter/eslint-config (v1.0.4)

```json
{
  "name": "@outfitter/eslint-config",
  "version": "1.0.4",
  "description": "Shared ESLint configuration for Outfitter projects",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist/**"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-import": "^2.29.0"
  },
  "peerDependencies": {
    "eslint": "^8.0.0 || ^9.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/eslint": "^8.0.0",
    "typescript": "^5.3.3"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/eslint-config"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/eslint-config#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 5. @outfitter/prettier-config (v0.1.0, private)

```json
{
  "name": "@outfitter/prettier-config",
  "version": "0.1.0",
  "private": true,
  "description": "Shared Prettier configuration for the Outfitter monorepo.",
  "main": "index.js",
  "exports": {
    ".": "./index.js"
  },
  "files": ["index.js"],
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["prettier", "config", "outfitter", "format"],
  "author": "Outfitter",
  "license": "ISC"
}
```

### 6. @outfitter/biome-config (v0.1.0, private)

```json
{
  "name": "@outfitter/biome-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Shared Biome configuration for the Outfitter monorepo.",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./biome.json": "./biome.config.json"
  },
  "files": ["dist", "biome.config.json"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {},
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "@types/node": "^22.7.4",
    "tsup": "^8.3.0",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  },
  "keywords": ["biome", "config", "outfitter", "lint", "format"],
  "author": "Outfitter",
  "license": "ISC"
}
```

### 7. @outfitter/changeset-config (v1.0.4)

```json
{
  "name": "@outfitter/changeset-config",
  "version": "1.0.4",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./config": "./config/config.json",
    "./package.json": "./package.json"
  },
  "files": ["dist", "config", "src"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@changesets/cli": "^2.27.11"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "tsup": "^8.3.5",
    "typescript": "^5.7.3"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/changeset-config"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/changeset-config#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 8. @outfitter/husky-config (v1.0.4)

```json
{
  "name": "@outfitter/husky-config",
  "version": "1.0.4",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./hooks/*": "./hooks/*",
    "./package.json": "./package.json"
  },
  "files": ["dist", "hooks", "src"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "husky": "^9.1.7"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "tsup": "^8.3.5",
    "typescript": "^5.7.3"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/husky-config"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/husky-config#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 9. @outfitter/remark-config (v0.1.0, private)

```json
{
  "name": "@outfitter/remark-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Shared Remark configuration for the Outfitter monorepo.",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./presets/standard": {
      "types": "./dist/presets/standard.d.ts",
      "import": "./dist/presets/standard.js",
      "require": "./dist/presets/standard.cjs"
    },
    "./presets/strict": {
      "types": "./dist/presets/strict.d.ts",
      "import": "./dist/presets/strict.js",
      "require": "./dist/presets/strict.cjs"
    },
    "./presets/relaxed": {
      "types": "./dist/presets/relaxed.d.ts",
      "import": "./dist/presets/relaxed.js",
      "require": "./dist/presets/relaxed.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "remark-preset-lint-recommended": "^7.0.1",
    "remark-lint-unordered-list-marker-style": "^4.0.1",
    "remark-lint-heading-style": "^4.0.1",
    "remark-lint-maximum-line-length": "^4.0.1",
    "remark-lint-no-duplicate-headings": "^4.0.1"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "@types/node": "^22.7.4",
    "tsup": "^8.3.0",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  },
  "keywords": ["remark", "config", "outfitter", "markdown", "lint"],
  "author": "Outfitter",
  "license": "ISC"
}
```

## CLI Tools

### 10. outfitter (v1.1.0)

```json
{
  "name": "outfitter",
  "version": "1.1.0",
  "description": "Command-line tool for equipping your development journey with configurations and fieldguides",
  "type": "module",
  "bin": {
    "outfitter": "./dist/index.js"
  },
  "files": ["dist", "templates"],
  "scripts": {
    "build": "tsc",
    "dev": "bun src/index.ts",
    "test": "bun test",
    "type-check": "tsc --noEmit",
    "prepare": "bun run build"
  },
  "dependencies": {
    "@outfitter/contracts": "workspace:*",
    "@inquirer/prompts": "^3.3.0",
    "semver": "^7.6.0",
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "execa": "^8.0.1",
    "fs-extra": "^11.2.0",
    "inquirer": "^9.2.12",
    "ora": "^8.0.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/inquirer": "^9.0.7",
    "@types/node": "^20.10.5",
    "@types/semver": "^7.5.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "cli",
    "outfitter",
    "developer-tools",
    "project-setup",
    "standards",
    "guidelines"
  ],
  "author": "Matt Galligan",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/cli"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/cli#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 11. @outfitter/packlist (v1.0.5)

```json
{
  "name": "@outfitter/packlist",
  "version": "1.0.5",
  "description": "Unified development configuration manager for Outfitter projects",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "bin": {
    "packlist": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist/**"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@outfitter/changeset-config": "workspace:*",
    "@outfitter/contracts": "workspace:*",
    "@outfitter/husky-config": "workspace:*",
    "@outfitter/typescript-config": "workspace:*",
    "commander": "^11.0.0",
    "execa": "^8.0.0",
    "picocolors": "^1.0.0",
    "zod": "^3.25.56"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "@types/node": "^20.10.4",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/packlist"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/packlist#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

## Formatting & Linting Tools

### 12. @outfitter/formatting (v0.1.0)

```json
{
  "name": "@outfitter/formatting",
  "version": "0.1.0",
  "type": "module",
  "description": "Modern formatting setup that leverages Ultracite (Biome) for JS/TS and complements it with Prettier and markdownlint-cli2",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "outfitter-formatting": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./cli": {
      "types": "./dist/cli.d.ts",
      "import": "./dist/cli.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "@outfitter/contracts": "workspace:*",
    "commander": "^12.0.0",
    "ultracite": "^5.0.0"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "@types/node": "^22.7.4",
    "@vitest/coverage-v8": "^2.1.9",
    "tsup": "^8.3.0",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  },
  "peerDependencies": {
    "@biomejs/biome": ">=1.8.0",
    "prettier": ">=3.0.0",
    "markdownlint-cli2": ">=0.10.0"
  },
  "peerDependenciesMeta": {
    "prettier": {
      "optional": true
    },
    "@biomejs/biome": {
      "optional": true
    },
    "markdownlint-cli2": {
      "optional": true
    }
  },
  "keywords": [
    "formatting",
    "ultracite",
    "biome",
    "prettier",
    "markdownlint",
    "editorconfig",
    "setup",
    "init",
    "outfitter"
  ],
  "author": "Outfitter",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/formatting"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/formatting"
}
```

### 13. @outfitter/flint (v0.0.0)

```json
{
  "name": "@outfitter/flint",
  "version": "0.0.0",
  "description": "Unified formatting and linting setup for JavaScript/TypeScript projects",
  "keywords": [
    "formatter",
    "linter",
    "biome",
    "oxlint",
    "prettier",
    "stylelint",
    "markdownlint",
    "developer-tools",
    "code-quality"
  ],
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "bin": {
    "flint": "./dist/cli.js"
  },
  "files": ["dist", "configs"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:run": "vitest run",
    "type-check": "tsc --noEmit",
    "lint": "oxlint",
    "format": "biome format --write .",
    "ci": "bun run type-check && bun run test:run",
    "prepublishOnly": "bun run build",
    "changeset": "changeset",
    "version": "changeset version && bun install --lockfile-only",
    "release": "bun run build && changeset publish"
  },
  "dependencies": {
    "@inquirer/prompts": "^3.3.0",
    "@outfitter/contracts": "workspace:*",
    "commander": "^12.0.0",
    "glob": "^10.3.10",
    "picocolors": "^1.1.0",
    "yaml": "^2.8.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@changesets/cli": "^2.27.1",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "@outfitter/typescript-config": "workspace:*",
    "@types/node": "^20.14.0",
    "lefthook": "^1.8.0",
    "markdownlint-cli2": "^0.14.0",
    "oxlint": "^0.10.0",
    "prettier": "^3.3.3",
    "stylelint": "^16.0.0",
    "stylelint-config-tailwindcss": "^0.0.7",
    "tsup": "^8.1.0",
    "typescript": "^5.4.5",
    "ultracite": "^4.1.1",
    "vitest": "^2.0.0"
  },
  "peerDependencies": {
    "bun": ">=1.0.0"
  },
  "author": "Matt Galligan",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/flint"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/flint",
  "publishConfig": {
    "access": "public"
  },
  "engines": {
    "node": ">=18.12"
  }
}
```

### 14. @outfitter/rightdown (v2.0.0)

```json
{
  "name": "@outfitter/rightdown",
  "version": "2.0.0",
  "description": "Opinionated Markdown linting and formatting for correct documentation",
  "keywords": [
    "markdown",
    "linting",
    "formatting",
    "documentation",
    "markdownlint",
    "md",
    "rightdown"
  ],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "bin": {
    "rightdown": "./dist/cli.js"
  },
  "files": ["dist", "configs"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "@outfitter/contracts": "workspace:*",
    "js-yaml": "^4.1.0",
    "markdownlint-cli2": "^0.15.0",
    "yargs": "^18.0.0"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.7.4",
    "@types/yargs": "^17.0.33",
    "markdownlint": "^0.34.0",
    "tsup": "^8.3.0",
    "typescript": "^5.6.3",
    "vitest": "^2.1.5"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/rightdown"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

## Orchestrator & Documentation

### 15. @outfitter/baselayer (v1.0.0)

```json
{
  "name": "@outfitter/baselayer",
  "version": "1.0.0",
  "description": "Declarative development toolchain configuration orchestrator - everything you need, nothing you don't",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist/**", "README.md"],
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly",
    "dev": "tsup --watch",
    "test": "vitest",
    "test:run": "vitest --run",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@outfitter/contracts": "workspace:*",
    "@outfitter/contracts-zod": "workspace:*",
    "comment-json": "^4.2.3"
  },
  "devDependencies": {
    "@outfitter/typescript-config": "workspace:*",
    "@types/node": "^20.10.4",
    "tsup": "^8.0.1",
    "typescript": "^5.8.3",
    "vitest": "^1.6.1"
  },
  "peerDependencies": {
    "@biomejs/biome": "^2.0.0",
    "prettier": "^3.5.3",
    "@outfitter/rightdown": "workspace:*",
    "zod": "^3.23.8"
  },
  "keywords": ["toolchain", "configuration", "biome", "prettier", "outfitter"],
  "author": "Outfitter",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/baselayer"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/baselayer#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

### 16. @outfitter/fieldguides (v1.0.4)

```json
{
  "name": "@outfitter/fieldguides",
  "version": "1.0.4",
  "description": "Living documentation system that equips AI agents with consistent development practices",
  "type": "module",
  "main": "./src/index.ts",
  "files": ["src/", "content/", "docs/", "scripts/", "*.md", "!node_modules/"],
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "prebuild": "bun run clean",
    "clean": "rm -f scripts/*.js scripts/*.js.map",
    "lint": "bun run lint:md && bun run lint:frontmatter",
    "lint:md": "markdownlint-cli2 \"**/*.md\" \"!node_modules/**\" \"!.bun/**\"",
    "lint:frontmatter": "node scripts/validate-frontmatter.js",
    "lint:fix": "bun run lint:md:fix",
    "lint:md:fix": "markdownlint-cli2 \"**/*.md\" \"!node_modules/**\" \"!.bun/**\" --fix",
    "format": "prettier --check \"**/*.md\"",
    "format:fix": "prettier --write \"**/*.md\"",
    "check": "bun run lint",
    "ci": "bun run check",
    "test": "echo 'No tests for documentation package'",
    "prepare": "bun run build",
    "postinstall": "bun run build"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "glob": "^11.0.2",
    "gray-matter": "^4.0.3",
    "markdownlint-cli2": "^0.15.0",
    "prettier": "^3.5.3",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20.0.0",
    "bun": ">=1.2.0"
  },
  "keywords": [
    "outfitter",
    "fieldguides",
    "documentation",
    "ai-agents",
    "development-standards",
    "coding-standards",
    "guidelines",
    "standards",
    "best-practices",
    "typescript",
    "react",
    "testing"
  ],
  "author": "Matt Galligan <mg@maybegoods.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/outfitter-dev/monorepo.git",
    "directory": "packages/fieldguides"
  },
  "bugs": {
    "url": "https://github.com/outfitter-dev/monorepo/issues"
  },
  "homepage": "https://github.com/outfitter-dev/monorepo/tree/main/packages/fieldguides#readme",
  "publishConfig": {
    "access": "public"
  }
}
```

## Build Tools and Scripts Analysis

### Primary Build Tools

1. **TypeScript Compiler (tsc)**
   - Used for: Type checking (`tsc --noEmit`), building type definitions (`tsc --emitDeclarationOnly`)
   - Packages using tsc: Most packages for type checking, some for building

2. **tsup**
   - Used for: Building JavaScript bundles with ESM and CJS support
   - Packages using tsup: contracts, contracts-zod, changeset-config, husky-config, biome-config, packlist, formatting, flint, rightdown, remark-config, baselayer
   - Configuration: Builds both ESM and CJS outputs

3. **Biome**
   - Used for: Linting and formatting JavaScript/TypeScript files
   - Root-level configuration with workspace support

4. **markdownlint-cli2**
   - Used for: Linting markdown files
   - Used across multiple packages

5. **Vitest**
   - Used for: Unit testing
   - Packages with tests: contracts, contracts-zod, biome-config, packlist, formatting, flint, rightdown, remark-config, baselayer

### Package Management

- **Package Manager**: Bun (v1.2.19)
- **Workspace Structure**: Bun workspaces with packages in `packages/*`, `packages/contracts/*`, and `shared`
- **Version Management**: Changesets for coordinated releases

### Common Scripts Patterns

1. **build**: Usually runs tsup, sometimes with additional tsc for type definitions
2. **dev**: Usually runs tsup in watch mode
3. **test**: Runs vitest
4. **type-check**: Runs tsc --noEmit
5. **lint/format**: Various linting and formatting commands

## Dependency Relationships

### Core Dependencies Flow

```
@outfitter/contracts (zero dependencies)
    ↓
@outfitter/contracts-zod (depends on contracts + zod as peer)
    ↓
Multiple packages depend on contracts:
- @outfitter/packlist
- @outfitter/cli (outfitter)
- @outfitter/formatting
- @outfitter/flint
- @outfitter/rightdown
- @outfitter/baselayer
```

### Configuration Dependencies

```
@outfitter/typescript-config
    ↓
Used as devDependency by almost all packages

@outfitter/packlist depends on:
- @outfitter/changeset-config
- @outfitter/husky-config
- @outfitter/typescript-config
- @outfitter/contracts
```

### Shared Tooling and Configurations

1. **TypeScript Configuration**
   - Base configuration shared via @outfitter/typescript-config
   - Provides base.json, next.json, and vite.json variants

2. **Linting & Formatting**
   - Biome for JS/TS (root level configuration)
   - markdownlint-cli2 for Markdown
   - ESLint configuration via @outfitter/eslint-config (currently with relaxed rules)
   - Prettier configuration via @outfitter/prettier-config (private package)

3. **Git Hooks & CI**
   - Husky configuration via @outfitter/husky-config
   - Lefthook at root level
   - Changesets for version management

4. **Testing**
   - Vitest across all packages requiring tests
   - Test files in `src/__tests__/` directories

## Build Pipeline Flow

### 1. Initial Setup

```bash
bun install  # Install all dependencies
bun run prepare  # Runs lefthook install && bun config:mdlint
```

### 2. Build Order (Critical)

```bash
# Must build contracts first (zero dependencies)
bun run -F '@outfitter/contracts' build

# Then build all other packages
bun run -F '@outfitter/*' build
```

### 3. Development Workflow

```bash
# Type checking
bun run type-check

# Linting
bun run lint        # Biome lint
bun run lint:md     # Markdown lint

# Formatting
bun run format:fix  # Biome format
bun run lint:fix    # Biome lint with fixes

# Testing
bun test            # Run tests
bun test:all        # Run tests in all packages

# Full CI check
bun run ci:local    # Format, lint, type-check, and test
```

### 4. Publishing Workflow

```bash
# Create changeset
bun run changeset

# Version packages
bun run changeset:version

# Publish to npm
bun run changeset:publish
```

## Key Observations

1. **Monorepo Structure**: Well-organized with clear separation between core libraries, configuration packages, CLI tools, and formatting/linting utilities.

2. **Build Tools Consistency**: Most packages use tsup for building, providing consistent ESM/CJS outputs.

3. **Zero-Dependency Core**: The @outfitter/contracts package has zero runtime dependencies, serving as a foundation for other packages.

4. **Workspace Protocol**: Uses `workspace:*` for internal dependencies, ensuring version consistency.

5. **Type Safety**: Strong emphasis on TypeScript with strict type checking across all packages.

6. **Testing Infrastructure**: Comprehensive testing setup with Vitest, though some packages (like fieldguides) are documentation-only.

7. **Publishing Strategy**: All public packages are published to npm under the @outfitter scope, with some packages remaining private for internal use.

8. **Modern Tooling**: Uses modern tools like Biome, tsup, and Bun for improved performance and developer experience.
