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
  "root": true,
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
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noConsole": "warn",
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
  "root": false,
  "extends": [
    "@outfitter/biome-config"
  ]
}
```

*Note: After publishing the config package, consumer packages can use the cleaner Node-style module specifier `@outfitter/biome-config`. The `"root": false` setting is required in nested configs to prevent Biome from treating each package as an independent root.*

#### 4. `package.json` scripts

We will update the `lint` and `format` scripts in our root `package.json` and individual packages to use Biome.

**Root `package.json`:**

```json
{
  "scripts": {
    "format": "biome format . --write",
    "format:check": "biome format .",
    "lint": "biome lint . && eslint . --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js",
    "lint:fix": "biome lint . --write && eslint . --fix --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js",
    "check": "biome check . --write && eslint . --fix --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js",
    "check:ci": "biome check . && eslint . --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js",
    "ci": "biome ci . && eslint . --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js"
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
    - Use `npx @biomejs/biome migrate eslint` to automatically convert existing ESLint ignores and rules.
    - Select a few non-critical packages as canaries for the full migration.
    - In these packages, run `biome lint --write` to auto-fix violations. Manually fix the remaining issues.
    - Consider setting `"diagnosticLevel": "error"` in canary packages to silence warnings during transition.
    - Enable Biome to fail CI for these canary packages.

3. **Phase 3: Full Migration**
    - Once confident, roll out the migration across the entire monorepo.
    - Run a monorepo-wide `biome check --write` to apply all fixes.
    - Run `pnpm migrate prettier` to strip old `prettier-ignore` comments.
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

- **Rule Parity**: Biome does not have a 1:1 mapping for every ESLint rule we currently use. We will need to evaluate which, if any, critical rules are missing and whether Biome's existing rules are sufficient. Biome's plugin system is still nascent, so custom rules are not as mature as ESLint's ecosystem. **See [Rule Parity Analysis](#rule-parity-analysis) for a detailed breakdown and migration strategy.**
- **Initial Churn**: The initial migration will require a large, monorepo-wide code modification to align with Biome's formatting and rules. This will be a one-time cost.
- **Learning Curve**: Developers will need to familiarize themselves with Biome's rules and CLI. IDE integration needs to be set up (e.g., installing the Biome VS Code extension).

### Rule Parity Analysis

A full migration requires confidence that we are not losing essential static analysis coverage. This analysis is based on our current `@outfitter/eslint-config` package and focuses on critical, build-blocking rules.

**The decision does not require a 100% rule-for-rule match.** The goal is to verify that Biome provides equivalent or better checks for correctness, security, and critical style conventions, while accepting that some stylistic or non-essential rules may be dropped in favor of Biome's defaults.

#### Key Rule Mapping & Gap Analysis

##### TypeScript Rules

**`no-explicit-any` (error)**

- **ESLint Plugin**: `@typescript-eslint`
- **Biome Equivalent**: `suspicious/noExplicitAny`
- **Gap/Difference**: ✅ **Exact Match.** Biome's rule is functionally identical.
- **Decision**: **Adopt.** Enforce as `error`.

**`no-non-null-assertion` (error)**

- **ESLint Plugin**: `@typescript-eslint`
- **Biome Equivalent**: `suspicious/noNonNullAssertion`
- **Gap/Difference**: ✅ **Exact Match.** Functionally identical.
- **Decision**: **Adopt.** Enforce as `error`.

##### React Rules

**`react-hooks/rules-of-hooks` (error)**

- **ESLint Plugin**: `react-hooks`
- **Biome Equivalent**: `react/useHookAtTopLevel`
- **Gap/Difference**: ✅ **Exact Match.** Biome's React rules cover this fundamental requirement.
- **Decision**: **Adopt.** Included in `recommended`.

**`react-hooks/exhaustive-deps` (warn)**

- **ESLint Plugin**: `react-hooks`
- **Biome Equivalent**: `react/useExhaustiveDependencies`
- **Gap/Difference**: ✅ **Exact Match.**
- **Decision**: **Adopt.** Enforce as `warn` to match current behavior.

##### Import Management

**`import/order` (warn)**

- **ESLint Plugin**: `import`
- **Biome Equivalent**: `organizeImports` (feature)
- **Gap/Difference**: ✅ **Functional Match.** Biome's `organizeImports` is an assist that handles grouping and sorting automatically. Unlike ESLint rules, `biome check` and `biome ci` fail by default when assists aren't applied (controlled by `--enforce-assist`, default `true`).
- **Decision**: **Adopt.** Import ordering is automatically enforced and will fail CI if not applied. This provides stronger guarantees than the ESLint warning while eliminating manual intervention.

**`import/no-unresolved` (error)**

- **ESLint Plugin**: `import`
- **Biome Equivalent**: N/A (Handled by TypeScript)
- **Gap/Difference**: 🚩 **Gap (by design).** This check is redundant with the TypeScript compiler (`tsc`). If an import cannot be resolved, `tsc` will fail. Relying on the compiler for this is more robust.
- **Decision**: **Delegate to TypeScript.** This is not a regression. The compiler is the source of truth for module resolution. No mitigation needed.

##### Accessibility

**`jsx-a11y/*` (error)**

- **ESLint Plugin**: `jsx-a11y`
- **Biome Equivalent**: `a11y/*`
- **Gap/Difference**: ✅ **High Parity.** Biome has a comprehensive suite of accessibility rules under the `a11y` group that covers the functionality of `eslint-plugin-jsx-a11y`.
- **Decision**: **Adopt.** Enable the `a11y` recommended rules and configure specific rules to `error` to match our current setup.

##### Future Considerations

**Custom Rules**

- **ESLint Plugin**: `eslint-plugin-outfitter`
- **Biome Equivalent**: N/A
- **Gap/Difference**: 🚩 **Critical Gap.** If we had custom, project-specific lint rules (we currently do not, but could in the future), Biome's nascent plugin system would be a significant blocker.
- **Decision**: **Acknowledge Future Risk.** For now, this is not an issue. If we need custom rules later, we would have to re-evaluate: use `eslint-plugin-biome` to run Biome via ESLint, or invest in Biome's Rust-based plugin ecosystem. This does not block the current decision.

#### Decision & Path Forward

Based on this analysis, the gaps are minimal and the trade-offs are acceptable. The most significant changes are relying on the formatter for import organization and the TypeScript compiler for module resolution, both of which are considered best practices.

**We will proceed with the migration.** The `Rule Parity Analysis` section of this document will serve as the single source of truth for this decision. No external tracking is necessary. The mitigation steps are clear and can be implemented as part of the phased migration plan outlined above.

## Next Steps & Implementation Considerations

### Immediate Actions

1. **Publish `@outfitter/biome-config`** package with the shared configuration
2. **Add CI job** using `biome ci --changed` to lint only PR diffs for faster feedback
3. **Pilot migration script** in one leaf package and capture diff stats (lines changed, runtime before/after)
4. **Schedule team training** on Biome's VS Code extension and CLI commands

### Performance Optimizations

- **Daemon mode**: Use `biome start`/`stop` to cache AST across runs, reducing pre-commit hook latency
- **CI caching**: Cache the Biome binary (~12MB) across CI jobs for faster setup
- **Staged checks**: Use `biome check --staged` in `lint-staged` for optimal pre-commit performance

### Edge Cases & Team Adoption

- **IDE setup**: Install Biome VS Code extension and disable ESLint/Prettier extensions to avoid conflicts
- **JetBrains support**: Community-maintained plugin may lag behind official releases
- **Third-party plugins**: If using tools like `prettier-plugin-tailwindcss`, evaluate Biome's upcoming plugin ecosystem or external sorting solutions
- **Quarterly reviews**: Re-evaluate rule parity as Biome's rule corpus evolves rapidly

## Bridging Strategy for Missing ESLint Rules

While Biome covers the majority of our current ESLint rules, some gaps may require a transitional "bridge ESLint" approach until Biome's plugin ecosystem matures.

### Gap Analysis Process

**Step 1: Generate Migration Report**

```bash
# Run once per package to identify untranslatable rules
npx @biomejs/biome migrate eslint --report ./rule-parity.json
```

**Step 2: Triage Missing Rules**

| Priority | Criteria | Action |
|----------|----------|---------|
| ✅ **Drop** | Handled by TypeScript compiler, Biome formatter, or obsolete | Remove entirely |
| 🟡 **Nice-to-have** | Style/DX preferences, non-blocking | Consider keeping in bridge ESLint |
| 🔴 **Critical** | Prevents bugs, security issues, or contract violations | Must bridge with bridge ESLint |

### ESLint Bridge Integration

For critical gaps, `@outfitter/biome-config` will include an optional ESLint bridge configuration as an internal dependency.

**Updated Package Structure:**

```
packages/biome-config/
├── biome.json
├── eslint-bridge.config.js  # ESLint gap coverage
├── package.json
└── README.md
```

**`packages/biome-config/eslint-bridge.config.js`:**

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import biome from 'eslint-config-biome';

export default [
  // Use Biome's config to disable all rules already covered
  biome,
  
  // Only enable critical rules that Biome doesn't have
  {
    rules: {
      // Example: Import restrictions (until Biome v2 glob patterns)
      'import/no-restricted-imports': ['error', {
        patterns: ['**/internal/**', '!**/*.types']
      }],
      
      // Example: Custom project-specific rules
      '@typescript-eslint/restrict-template-expressions': 'error',
      
      // Add other critical gaps as needed
    }
  }
];
```

**Consumer Package Usage:**

```json
{
  "scripts": {
    "lint": "biome lint . && eslint . --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js",
    "lint:fix": "biome lint . --write && eslint . --fix --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js"
  },
  "devDependencies": {
    "@outfitter/biome-config": "workspace:*"
  }
}
```

*Note: The ESLint bridge is automatically available when you install `@outfitter/biome-config` - no separate package needed.*

### Migration Timeline

**Phase 1: Identify Gaps**

- Run migration reports across all packages
- Categorize missing rules by priority
- Add ESLint bridge configuration to `@outfitter/biome-config` with only 🔴 critical rules

**Phase 2: Deploy Bridge Configuration**

- Packages use `@outfitter/biome-config` for Biome rules and its built-in ESLint bridge for gaps
- CI runs: `biome ci . && eslint . --config=node_modules/@outfitter/biome-config/eslint-bridge.config.js --max-warnings 0`
- 95% of files skip ESLint processing (fast), only gaps are checked

**Phase 3: Reduce Bridge Over Time**

- Monitor Biome releases for new rule additions
- Port critical rules to Biome WASM plugins when needed
- Remove rules from ESLint bridge as Biome coverage improves
- Eventually remove `eslint-bridge.config.js` entirely when no gaps remain

### Expected Critical Gaps

Based on our current setup, these rules will likely need the ESLint bridge:

| Rule | Status | Bridge Strategy |
|------|--------|-----------------|
| `import/no-restricted-imports` (glob patterns) | Partial in Biome v2 | ESLint bridge until stable |
| Custom `@outfitter/*` rules | N/A | ESLint bridge or WASM plugin |
| `import/no-extraneous-dependencies` | Not planned | External tool (`depcheck`) or ESLint bridge |

### External Repository Deployment

When deploying to other repositories, only one package is needed:

**`@outfitter/biome-config`** includes:
- Primary Biome configuration (`biome.json`)
- ESLint bridge for gaps (`eslint-bridge.config.js`)
- All necessary ESLint dependencies

```json
{
  "name": "@outfitter/biome-config",
  "dependencies": {
    "eslint-config-biome": "^0.3.0",
    "@eslint/js": "^9.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

Teams can:
- Use **Biome only**: Reference `biome.json` and skip ESLint entirely
- Use **Biome + bridge**: Add ESLint bridge for full gap coverage
- **Transition cleanly**: When Biome coverage is complete, just stop using the ESLint bridge - no package changes needed

## Appendix: Current Tool Inventory

Based on the current monorepo state, the following tools and dependencies would be replaced after the migration:

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
