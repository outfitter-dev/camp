# @outfitter/flint - Unified Formatting & Linting Package

## Executive Summary

`@outfitter/flint` is a comprehensive formatting and linting setup tool that brings together best-in-class tools for JavaScript/TypeScript projects. It provides a zero-config initialization experience that sets up Biome (via Ultracite), Oxlint, Prettier, markdownlint-cli2, Stylelint, and Lefthook with sensible defaults and no overlapping responsibilities.

## Motivation

Currently, the Outfitter monorepo uses separate packages (`@outfitter/formatting` and `@outfitter/packlist`) to manage development tooling. This proposal consolidates formatting and linting into a single, cohesive package that:

- Eliminates tool overlap and conflicts
- Provides a one-command setup experience
- Uses the fastest available tools (Biome, Oxlint)
- Maintains compatibility with existing workflows
- Supports both monorepo and standalone project usage

## Architecture Overview

### Package Structure

```
packages/flint/
├── src/
│   ├── cli.ts                    # CLI entry point with commander
│   ├── index.ts                  # Programmatic API exports
│   ├── commands/
│   │   ├── init.ts               # Main initialization command
│   │   ├── clean.ts              # Remove old configs with backup
│   │   └── doctor.ts             # Diagnose configuration issues
│   ├── core/
│   │   ├── backup.ts             # Backup existing configs to markdown
│   │   ├── detector.ts           # Detect existing tools/configs
│   │   ├── installer.ts          # Bun-based dependency installation
│   │   └── merger.ts             # Smart config merging utilities
│   ├── generators/
│   │   ├── biome.ts              # Biome config via Ultracite
│   │   ├── oxlint.ts             # Oxlint configuration
│   │   ├── prettier.ts           # Prettier for non-JS/TS files
│   │   ├── markdownlint.ts       # markdownlint-cli2 config
│   │   ├── stylelint.ts          # Stylelint + Tailwind config
│   │   ├── lefthook.ts           # Git hooks configuration
│   │   ├── editorconfig.ts       # Cross-editor settings
│   │   ├── commitlint.ts         # Conventional commits
│   │   ├── vscode.ts             # VS Code settings/extensions
│   │   └── package-scripts.ts    # npm/bun script injection
│   ├── schemas/
│   │   └── config.ts             # Zod schemas for validation
│   └── utils/
│       ├── console.ts            # Formatted console output
│       ├── file-system.ts        # File operations with Result
│       └── package-manager.ts    # Detect npm/yarn/pnpm/bun
├── configs/
│   └── base/                     # Pre-built configurations
│       ├── biome.json
│       ├── oxlint.json
│       └── prettier.json
├── docs/
│   ├── migration-guide.md        # From ESLint/Prettier
│   └── tool-matrix.md            # Which tool handles what
├── CHANGELOG.md                  # Managed by changesets
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

### Tool Responsibilities

| Tool | Purpose | File Types | Key Features |
|------|---------|------------|--------------|
| **Biome** (via Ultracite) | Format JS/TS | `.js`, `.jsx`, `.ts`, `.tsx` | Rust-based, 10x faster than Prettier |
| **Oxlint** | Lint JS/TS | `.js`, `.jsx`, `.ts`, `.tsx` | Rust-based, 50-100x faster than ESLint |
| **Prettier** | Format other files | `.md`, `.css`, `.json`, `.yaml`, `.html` | Industry standard, prose wrap preserve |
| **markdownlint-cli2** | Lint Markdown | `.md`, `.mdx` | Configurable rules, auto-fix support |
| **Stylelint** | Lint CSS | `.css`, `.scss`, `.less` | Tailwind-aware, modern CSS support |
| **Lefthook** | Git hooks | All staged files | Parallel execution, Bun-powered |

## Implementation Details

### CLI Interface

```bash
# Basic initialization (interactive)
bunx @outfitter/flint init

# Non-interactive with all defaults
bunx @outfitter/flint init --yes

# Skip specific tools
bunx @outfitter/flint init --no-stylelint --no-git-hooks

# Clean up old configs (creates backup first)
bunx @outfitter/flint clean

# Diagnose issues
bunx @outfitter/flint doctor

# Dry run to see what would happen
bunx @outfitter/flint init --dry-run
```

### Core Features

#### 1. Smart Initialization

```typescript
// src/commands/init.ts
import { Result, success, failure, makeError } from '@outfitter/contracts';
import { detectExistingTools } from '../core/detector';
import { createBackup } from '../core/backup';
import { cleanupOldTools, removeOldConfigs } from '../core/cleanup';
import { cleanupDependencies } from '../core/dependency-cleanup';
import { installDependencies, getMissingDependencies } from '../core/installer';
import { 
  generateBiomeConfig,
  generateOxlintConfig,
  generatePrettierConfig,
  generateMarkdownlintConfig,
  generateStylelintConfig,
  generateLefthookConfig,
  generateEditorconfigConfig,
  generateCommitlintConfig
} from '../generators';
import { updatePackageScripts } from '../generators/package-scripts';
import { enhanceVSCodeSettings, hasVSCode } from '../generators/vscode';
import { MigrationReporter } from '../core/migration-report';
import * as pc from 'picocolors';

// Type definitions
interface InitOptions {
  yes?: boolean;
  dryRun?: boolean;
  keepExisting?: boolean;
  noStylelint?: boolean;
  noGitHooks?: boolean;
  monorepo?: boolean;
  keepPrettier?: boolean;
}

interface DetectedConfig {
  tool: string;
  path: string;
  content: string;
}

interface DetectedTools {
  hasConfigs: boolean;
  configs: DetectedConfig[];
}

export async function init(options: InitOptions): Promise<Result<void, Error>> {
  // 1. Detect existing configurations and tools
  const detected = await detectExistingTools();
  const configsToRemove = await cleanupOldTools();
  
  // 2. Create backup of existing configs before any changes
  if (detected.hasConfigs || configsToRemove.length > 0) {
    await createBackup([...detected.configs, ...configsToRemove]);
  }
  
  // 3. Run tool initialization (leveraging their built-in capabilities)
  // Ultracite handles: biome install, config creation, VS Code setup
  await generateBiomeConfig(); // Runs ultracite init
  
  // Oxlint handles: config creation, ESLint migration if applicable
  await generateOxlintConfig(); // Runs oxlint --init or oxlint-migrate
  
  // 4. Clean up old tools (what Ultracite/Oxlint don't do)
  if (!options.keepExisting) {
    await removeOldConfigs(configsToRemove);
    await cleanupDependencies(options); // Remove ESLint, old Prettier, etc.
  }
  
  // 5. Set up complementary tools
  await generatePrettierConfig(); // For non-JS/TS files
  await generateMarkdownlintConfig();
  await generateStylelintConfig();
  await generateLefthookConfig();
  await generateEditorconfigConfig();
  
  // 6. Install any missing dependencies
  await installDependencies(getMissingDependencies());
  
  // 7. Update package.json scripts
  await updatePackageScripts();
  
  // 8. Final VS Code adjustments (merge with Ultracite's setup)
  if (await hasVSCode()) {
    await enhanceVSCodeSettings();
  }
  
  return success(undefined);
}
```

#### 2. Configuration Generation

```typescript
// src/generators/biome.ts
export async function generateBiomeConfig(): Promise<Result<void, Error>> {
  const { execSync } = await import('node:child_process');
  
  try {
    // Ultracite init handles:
    // - Installing biome and ultracite
    // - Creating biome.jsonc with extends: ["ultracite"]
    // - Setting up VS Code integration
    // - Configuring git hooks if husky exists
    execSync('bunx ultracite init --yes', { stdio: 'inherit' });
    
    // No need to create our own config - ultracite already does this!
    return success(undefined);
  } catch (error) {
    return failure(makeError('BIOME_SETUP_FAILED', error.message));
  }
}
```

#### Leveraging Existing Tool Capabilities

Since both Ultracite and Oxlint have their own initialization processes, Flint focuses on:
1. **Orchestration**: Running the right init commands in the right order
2. **Cleanup**: Removing old configs and dependencies (which tools don't do)
3. **Integration**: Ensuring all tools work together harmoniously
4. **Backup**: Creating restoration points before making changes

```typescript
// src/generators/oxlint.ts
export async function generateOxlintConfig(): Promise<Result<void, Error>> {
  const { execSync } = await import('node:child_process');
  
  try {
    // Check if ESLint config exists for migration
    const hasEslintConfig = await detectEslintConfig();
    
    if (hasEslintConfig) {
      // Use oxlint-migrate to convert ESLint config
      execSync('npx @oxlint/migrate', { stdio: 'inherit' });
    } else {
      // Create new config with oxlint --init
      execSync('bunx oxlint --init', { stdio: 'inherit' });
    }
    
    // Enhance the generated config with our recommended settings
    const existingConfig = await readJSON('.oxlintrc.json');
    const enhancedConfig = {
      ...existingConfig,
      plugins: [...new Set([
        ...(existingConfig.plugins || []),
        "import", "jest", "vitest", "typescript", "react"
      ])],
      env: {
        browser: true,
        es2024: true,
        node: true,
        ...(existingConfig.env || {})
      },
      rules: {
        ...(existingConfig.rules || {}),
        // Add our recommended rules that don't conflict with Biome
      // Correctness
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-constructor-return": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-ex-assign": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error",
      "no-obj-calls": "error",
      "no-promise-executor-return": "error",
      "no-prototype-builtins": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "no-setter-return": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unmodified-loop-condition": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": ["error", { 
        "varsIgnorePattern": "^_",
        "argsIgnorePattern": "^_",
        "caughtErrors": "none"
      }],
      "no-use-before-define": "error",
      "no-useless-assignment": "error",
      "no-useless-backreference": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      
      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        "varsIgnorePattern": "^_",
        "argsIgnorePattern": "^_"
      }],
      
      // React
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "error",
      "react/no-unknown-property": "error",
      "react/require-render-return": "error",
      
      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
      }
    },
    overrides: [
      {
        files: ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"],
        rules: {
          "no-console": "off"
        }
      }
    ]
  };
  
  await writeJSON('.oxlintrc.json', enhancedConfig);
  return success(undefined);
}
```

```typescript
// src/generators/prettier.ts
export async function generatePrettierConfig(): Promise<Result<void, Error>> {
  const config = {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 80,
    "endOfLine": "lf",
    "arrowParens": "always",
    "proseWrap": "preserve", // Important for markdown
    "overrides": [
      {
        "files": "*.md",
        "options": {
          "proseWrap": "preserve"
        }
      },
      {
        "files": "*.json",
        "options": {
          "singleQuote": false
        }
      }
    ]
  };
  
  const ignore = [
    "# Dependencies",
    "node_modules/",
    "bun.lockb",
    "",
    "# Build outputs", 
    "dist/",
    "build/",
    ".next/",
    "out/",
    "",
    "# Test coverage",
    "coverage/",
    "",
    "# Biome handles these",
    "*.js",
    "*.jsx",
    "*.ts",
    "*.tsx",
    "",
    "# Generated files",
    "*.min.js",
    "*.min.css"
  ];
  
  await writeJSON('.prettierrc.json', config);
  await writeFile('.prettierignore', ignore.join('\n'));
  
  return success(undefined);
}
```

```typescript
// src/generators/markdownlint.ts
export async function generateMarkdownlintConfig(): Promise<Result<void, Error>> {
  const config = {
    config: {
      "default": true,
      "MD013": { "line_length": 120 },
      "MD033": false,  // Allow inline HTML
      "no-trailing-spaces": false
    },
    globs: ["**/*.md"],
    ignores: ["**/node_modules", "**/dist", "**/coverage"]
  };
  
  await writeYAML('.markdownlint-cli2.yaml', config);
  return success(undefined);
}
```

```typescript
// src/generators/stylelint.ts
export async function generateStylelintConfig(): Promise<Result<void, Error>> {
  const config = {
    extends: ["stylelint-config-tailwindcss"],
    rules: {
      "at-rule-no-unknown": [true, {
        ignoreAtRules: ["tailwind", "apply", "screen", "layer"]
      }]
    }
  };
  
  await writeJSON('.stylelintrc.json', config);
  return success(undefined);
}
```

```typescript
// src/generators/editorconfig.ts
export async function generateEditorconfigConfig(): Promise<Result<void, Error>> {
  const config = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
`;
  
  await writeFile('.editorconfig', config);
  return success(undefined);
}
```

```typescript
// src/generators/commitlint.ts
export async function generateCommitlintConfig(): Promise<Result<void, Error>> {
  const config = {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'type-enum': [
        2,
        'always',
        [
          'build',
          'chore',
          'ci',
          'docs',
          'feat',
          'fix',
          'perf',
          'refactor',
          'revert',
          'style',
          'test'
        ]
      ]
    }
  };
  
  await writeJSON('.commitlintrc.json', config);
  return success(undefined);
}
```

#### 3. Cleanup Functionality (What Tools Don't Handle)

Since neither Ultracite nor Oxlint handle cleanup of old tools, Flint provides comprehensive cleanup:

```typescript
// src/core/cleanup.ts
export async function cleanupOldTools(): Promise<string[]> {
  const configsToRemove = [
    // ESLint configs
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    
    // Prettier configs (if using Biome for JS/TS)
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.json',
    '.prettierrc.yaml',
    '.prettierrc.yml',
    'prettier.config.js',
    'prettier.config.cjs',
    
    // TSLint (legacy)
    'tslint.json',
    
    // StandardJS
    '.standard.json',
  ];
  
  const removedConfigs = [];
  
  for (const config of configsToRemove) {
    if (await fileExists(config)) {
      removedConfigs.push(config);
    }
  }
  
  // Don't remove files yet - they'll be backed up first
  return removedConfigs;
}

// src/core/dependency-cleanup.ts
export async function cleanupDependencies(options: InitOptions): Promise<Result<void, Error>> {
  const packageJson = await readPackageJson();
  const depsToRemove = [];
  
  const unwantedPatterns = [
    /^eslint/,
    /^@typescript-eslint/,
    /eslint-plugin/,
    /eslint-config/,
    /^tslint$/,
    /^standard$/,
  ];
  
  // Only remove prettier if not needed for non-JS/TS files
  if (!options.keepPrettier) {
    unwantedPatterns.push(/^prettier$/);
  }
  
  // Check both dependencies and devDependencies
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  for (const [dep, version] of Object.entries(allDeps)) {
    if (unwantedPatterns.some(pattern => pattern.test(dep))) {
      // Skip if it's a tool we're installing
      if (!['oxlint', 'markdownlint-cli2', 'stylelint'].includes(dep)) {
        depsToRemove.push(dep);
      }
    }
  }
  
  if (depsToRemove.length > 0) {
    execSync(`bun remove ${depsToRemove.join(' ')}`, { stdio: 'inherit' });
  }
  
  return success(undefined);
}
```

#### 4. Package.json Scripts

```typescript
// src/generators/package-scripts.ts
export async function updatePackageScripts(): Promise<Result<void, Error>> {
  const packageJson = await readPackageJson();
  
  const scripts = {
    // Formatting commands
    "format": "biome format --write .",
    "format:check": "biome format .",
    "format:md": "prettier --write '**/*.{md,mdx}'",
    "format:css": "prettier --write '**/*.{css,scss,less}'", 
    "format:other": "prettier --write '**/*.{json,yaml,yml,html}'",
    "format:all": "bun run format && bun run format:md && bun run format:css && bun run format:other",
    
    // Linting commands
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "lint:md": "markdownlint-cli2 '**/*.md'",
    "lint:md:fix": "markdownlint-cli2 --fix '**/*.md'",
    "lint:css": "stylelint '**/*.{css,scss,less}'",
    "lint:css:fix": "stylelint --fix '**/*.{css,scss,less}'",
    "lint:all": "bun run lint && bun run lint:md && bun run lint:css",
    
    // Combined commands
    "check": "bun run format:check && bun run lint:all",
    "check:fix": "bun run format:all && bun run lint:fix && bun run lint:md:fix && bun run lint:css:fix",
    
    // CI command
    "ci": "bun run check",
    
    // Git hooks
    "prepare": "lefthook install"
  };
  
  // Only add scripts that don't exist
  packageJson.scripts = packageJson.scripts || {};
  for (const [name, command] of Object.entries(scripts)) {
    if (!packageJson.scripts[name]) {
      packageJson.scripts[name] = command;
    }
  }
  
  await writePackageJson(packageJson);
  return success(undefined);
}
```

#### 5. VS Code Configuration

```typescript
// src/generators/vscode.ts
export async function setupVSCode(): Promise<Result<void, Error>> {
  const settings = {
    // Formatter assignments
    "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
    "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
    "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
    "[javascriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
    "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[css]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[scss]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[less]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[jsonc]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[yaml]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    "[html]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
    
    // Editor behavior
    "editor.formatOnSave": true,
    "editor.formatOnPaste": false,
    "editor.codeActionsOnSave": {
      "source.fixAll.oxlint": "explicit",
      "source.fixAll.stylelint": "explicit", 
      "source.organizeImports.biome": "explicit"
    },
    
    // File handling
    "files.eol": "\n",
    "files.trimTrailingWhitespace": true,
    "files.insertFinalNewline": true,
    "files.trimFinalNewlines": true,
    
    // Tool-specific settings
    "oxlint.enable": true,
    "oxlint.run": "onType",
    "css.validate": false, // Let Stylelint handle it
    "scss.validate": false,
    "less.validate": false
  };
  
  const extensions = {
    "recommendations": [
      "biomejs.biome",
      "esbenp.prettier-vscode",
      "oxlint.oxlint",
      "DavidAnson.vscode-markdownlint",
      "stylelint.vscode-stylelint",
      "streetsidesoftware.code-spell-checker"
    ]
  };
  
  // Merge with existing settings
  await mergeVSCodeSettings(settings);
  await mergeVSCodeExtensions(extensions);
  
  return success(undefined);
}
```

#### 6. Backup System & Migration Report

```typescript
// src/core/backup.ts
export async function createBackup(configs: DetectedConfig[]): Promise<Result<string, Error>> {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `flint-backup-${timestamp}.md`;
  
  let content = `# Flint Configuration Backup\n\n`;
  content += `Generated: ${new Date().toISOString()}\n`;
  content += `Project: ${process.cwd()}\n\n`;
  
  for (const config of configs) {
    content += `## ${config.tool} Configuration\n\n`;
    content += `**File:** \`${config.path}\`\n\n`;
    
    const ext = path.extname(config.path).slice(1);
    const lang = ext === 'js' ? 'javascript' : ext;
    
    content += `\`\`\`${lang}\n`;
    content += config.content;
    content += `\n\`\`\`\n\n`;
  }
  
  content += `## Restoration Instructions\n\n`;
  content += `To restore any of these configurations:\n\n`;
  content += `1. Create the file with the original filename\n`;
  content += `2. Copy the content from the appropriate code block above\n`;
  content += `3. Remove any Flint-generated replacements if needed\n\n`;
  
  await writeFile(filename, content);
  return success(filename);
}

// src/core/migration-report.ts
export interface MigrationStep {
  action: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  details?: string;
  duration?: number;
}

export class MigrationReporter {
  private steps: MigrationStep[] = [];
  private startTime = Date.now();
  
  addStep(step: MigrationStep) {
    this.steps.push({
      ...step,
      duration: Date.now() - this.startTime,
    });
  }
  
  async generateReport(backupFile?: string): Promise<Result<string, Error>> {
    const timestamp = new Date().toISOString();
    const filename = `flint-migration-report-${timestamp.split('T')[0]}.md`;
    
    let content = `# Flint Migration Report\n\n`;
    content += `**Generated**: ${timestamp}\n`;
    content += `**Project**: ${process.cwd()}\n`;
    content += `**Duration**: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s\n\n`;
    
    // Summary
    const successful = this.steps.filter(s => s.status === 'success').length;
    const warnings = this.steps.filter(s => s.status === 'warning').length;
    const errors = this.steps.filter(s => s.status === 'error').length;
    const skipped = this.steps.filter(s => s.status === 'skipped').length;
    
    content += `## Summary\n\n`;
    content += `- ✅ **Successful**: ${successful} steps\n`;
    content += `- ⚠️  **Warnings**: ${warnings} steps\n`;
    content += `- ❌ **Errors**: ${errors} steps\n`;
    content += `- ⏭️  **Skipped**: ${skipped} steps\n\n`;
    
    // Migration Process
    content += `## Migration Process\n\n`;
    content += `| Status | Action | Details | Time |\n`;
    content += `|--------|--------|---------|------|\n`;
    
    for (const step of this.steps) {
      const icon = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        skipped: '⏭️',
      }[step.status];
      
      const time = step.duration ? `${(step.duration / 1000).toFixed(2)}s` : '-';
      const details = step.details || '-';
      
      content += `| ${icon} | ${step.action} | ${details} | ${time} |\n`;
    }
    
    // Tools Installed
    content += `\n## Tools & Configuration\n\n`;
    content += `### Formatting\n`;
    content += `- **Biome** (via Ultracite): JavaScript/TypeScript formatting\n`;
    content += `- **Prettier**: Markdown, CSS, JSON, YAML, HTML formatting\n\n`;
    
    content += `### Linting\n`;
    content += `- **Oxlint**: JavaScript/TypeScript linting\n`;
    content += `- **markdownlint-cli2**: Markdown linting\n`;
    content += `- **Stylelint**: CSS/SCSS/Less linting\n\n`;
    
    content += `### Git Hooks\n`;
    content += `- **Lefthook**: Pre-commit formatting and linting\n`;
    content += `- **Commitlint**: Conventional commit enforcement\n\n`;
    
    // Available Commands
    content += `## Available Commands\n\n`;
    content += `\`\`\`bash\n`;
    content += `# Formatting\n`;
    content += `bun run format        # Format JS/TS files with Biome\n`;
    content += `bun run format:md     # Format Markdown files\n`;
    content += `bun run format:css    # Format CSS files\n`;
    content += `bun run format:all    # Format all files\n\n`;
    
    content += `# Linting\n`;
    content += `bun run lint          # Lint JS/TS files with Oxlint\n`;
    content += `bun run lint:md       # Lint Markdown files\n`;
    content += `bun run lint:css      # Lint CSS files\n`;
    content += `bun run lint:all      # Lint all files\n\n`;
    
    content += `# Combined\n`;
    content += `bun run check         # Check formatting and linting\n`;
    content += `bun run check:fix     # Fix all formatting and linting issues\n`;
    content += `bun run ci            # Run all checks (for CI/CD)\n`;
    content += `\`\`\`\n\n`;
    
    // Next Steps
    content += `## Next Steps\n\n`;
    content += `1. **Test the setup**: Run \`bun run check\` to verify everything works\n`;
    content += `2. **Fix any issues**: Run \`bun run check:fix\` to auto-fix problems\n`;
    content += `3. **Commit changes**: The pre-commit hooks will now format your code\n`;
    content += `4. **VS Code**: Restart VS Code to activate the new extensions\n\n`;
    
    // Troubleshooting
    if (errors > 0 || warnings > 0) {
      content += `## Troubleshooting\n\n`;
      
      const issues = this.steps.filter(s => s.status === 'error' || s.status === 'warning');
      for (const issue of issues) {
        content += `### ${issue.status === 'error' ? '❌ Error' : '⚠️ Warning'}: ${issue.action}\n`;
        if (issue.details) {
          content += `${issue.details}\n\n`;
        }
      }
    }
    
    // Backup Reference
    if (backupFile) {
      content += `## Backup Reference\n\n`;
      content += `Your previous configuration has been backed up to: \`${backupFile}\`\n\n`;
      content += `If you need to restore any settings, refer to that file.\n\n`;
    }
    
    // Performance Metrics
    content += `## Performance Comparison\n\n`;
    content += `Based on typical JavaScript/TypeScript projects:\n\n`;
    content += `| Operation | Before (ESLint + Prettier) | After (Biome + Oxlint) | Improvement |\n`;
    content += `|-----------|---------------------------|------------------------|-------------|\n`;
    content += `| Format 1000 files | ~5s | ~0.3s | **16x faster** |\n`;
    content += `| Lint 1000 files | ~10s | ~0.2s | **50x faster** |\n`;
    content += `| Pre-commit (100 files) | ~2s | ~0.1s | **20x faster** |\n`;
    
    await writeFile(filename, content);
    return success(filename);
  }
}

// Usage in the init command
export async function init(options: InitOptions): Promise<Result<void, Error>> {
  const reporter = new MigrationReporter();
  
  try {
    // Track each step of the migration
    reporter.addStep({
      action: 'Detecting existing tools',
      status: 'success',
      details: 'Found ESLint, Prettier configurations',
    });
    
    // ... rest of init process with reporter.addStep() calls ...
    
    // Generate final report
    const reportResult = await reporter.generateReport(backupFilename);
    
    console.log(pc.green('✨ Migration complete!'));
    console.log(pc.gray(`Report saved to: ${reportResult.value}`));
    
    return success(undefined);
  } catch (error) {
    reporter.addStep({
      action: 'Migration failed',
      status: 'error',
      details: error.message,
    });
    
    await reporter.generateReport();
    return failure(error);
  }
}
```

#### 7. Lefthook Configuration

```typescript
// src/generators/lefthook.ts
export async function generateLefthookConfig(): Promise<Result<void, Error>> {
  const config = `# Lefthook configuration
# https://github.com/evilmartians/lefthook

pre-commit:
  parallel: true
  commands:
    # Format JavaScript/TypeScript with Biome
    biome-format:
      glob: "*.{js,jsx,ts,tsx}"
      run: bunx @biomejs/biome format --write {staged_files} && git add {staged_files}
    
    # Format Markdown with Prettier
    prettier-md:
      glob: "*.{md,mdx}"
      run: bunx prettier --write {staged_files} && git add {staged_files}
    
    # Format CSS with Prettier
    prettier-css:
      glob: "*.{css,scss,less}"
      run: bunx prettier --write {staged_files} && git add {staged_files}
    
    # Format other files with Prettier
    prettier-other:
      glob: "*.{json,yaml,yml,html}"
      run: bunx prettier --write {staged_files} && git add {staged_files}
    
    # Lint JavaScript/TypeScript with Oxlint
    oxlint:
      glob: "*.{js,jsx,ts,tsx}"
      run: bunx oxlint {staged_files}
    
    # Lint Markdown
    markdownlint:
      glob: "*.md"
      run: bunx markdownlint-cli2 {staged_files}
    
    # Lint CSS
    stylelint:
      glob: "*.{css,scss,less}"
      run: bunx stylelint {staged_files}

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit {1}

pre-push:
  commands:
    test:
      run: bun test --run
`;
  
  await writeFile('lefthook.yml', config);
  return success(undefined);
}
```

#### 8. Helper Functions

```typescript
// src/core/detector.ts
export async function detectExistingTools(): Promise<DetectedTools> {
  const configs: DetectedConfig[] = [];
  const toolPatterns = [
    { pattern: '.eslintrc*', tool: 'ESLint' },
    { pattern: 'eslint.config.*', tool: 'ESLint' },
    { pattern: '.prettierrc*', tool: 'Prettier' },
    { pattern: 'prettier.config.*', tool: 'Prettier' },
    { pattern: 'biome.json*', tool: 'Biome' },
    { pattern: '.stylelintrc*', tool: 'Stylelint' },
    { pattern: 'tslint.json', tool: 'TSLint' },
  ];
  
  for (const { pattern, tool } of toolPatterns) {
    const files = await glob(pattern);
    for (const file of files) {
      const content = await readFile(file);
      configs.push({ tool, path: file, content });
    }
  }
  
  return {
    hasConfigs: configs.length > 0,
    configs
  };
}

// src/core/installer.ts
export async function getMissingDependencies(): Promise<string[]> {
  const required = [
    '@biomejs/biome',
    'oxlint',
    'prettier',
    'markdownlint-cli2',
    'stylelint',
    'stylelint-config-tailwindcss',
    'lefthook',
    '@commitlint/cli',
    '@commitlint/config-conventional'
  ];
  
  const packageJson = await readPackageJson();
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  return required.filter(dep => !allDeps[dep]);
}

// src/generators/vscode.ts
export async function hasVSCode(): Promise<boolean> {
  return await fileExists('.vscode');
}

// src/utils/file-system.ts
export async function readJSON(path: string): Promise<any> {
  const content = await readFile(path);
  return JSON.parse(content);
}

export async function writeJSON(path: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeFile(path, content);
}

export async function readYAML(path: string): Promise<any> {
  // In real implementation, use a YAML parser like js-yaml
  const content = await readFile(path);
  return parseYAML(content);
}

export async function writeYAML(path: string, data: any): Promise<void> {
  // In real implementation, use a YAML stringifier
  const content = stringifyYAML(data);
  await writeFile(path, content);
}

export async function readPackageJson(): Promise<any> {
  return await readJSON('package.json');
}

export async function writePackageJson(data: any): Promise<void> {
  await writeJSON('package.json', data);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await Bun.file(path).exists();
    return true;
  } catch {
    return false;
  }
}

export async function readFile(path: string): Promise<string> {
  const file = Bun.file(path);
  return await file.text();
}

export async function writeFile(path: string, content: string): Promise<void> {
  await Bun.write(path, content);
}

// src/generators/vscode.ts
export async function mergeVSCodeSettings(newSettings: any): Promise<void> {
  const settingsPath = '.vscode/settings.json';
  let existingSettings = {};
  
  if (await fileExists(settingsPath)) {
    existingSettings = await readJSON(settingsPath);
  }
  
  const merged = {
    ...existingSettings,
    ...newSettings
  };
  
  await ensureDir('.vscode');
  await writeJSON(settingsPath, merged);
}

export async function mergeVSCodeExtensions(newExtensions: any): Promise<void> {
  const extensionsPath = '.vscode/extensions.json';
  let existingExtensions = { recommendations: [] };
  
  if (await fileExists(extensionsPath)) {
    existingExtensions = await readJSON(extensionsPath);
  }
  
  const merged = {
    ...existingExtensions,
    recommendations: [
      ...new Set([
        ...existingExtensions.recommendations,
        ...newExtensions.recommendations
      ])
    ]
  };
  
  await ensureDir('.vscode');
  await writeJSON(extensionsPath, merged);
}
```

## Dependencies

```json
{
  "name": "@outfitter/flint",
  "version": "0.0.0",
  "description": "Unified formatting and linting setup for JavaScript/TypeScript projects",
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
  "files": [
    "dist",
    "configs"
  ],
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
    "@outfitter/contracts": "workspace:*",
    "commander": "^12.0.0",
    "picocolors": "^1.1.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@changesets/cli": "^2.27.1",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "@types/node": "^20.14.0",
    "@types/bun": "latest",
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
  }
}
```

## TypeScript Configuration

### Bun vs Node Types Decision

When setting up TypeScript for your project, you need to decide between using Bun or Node.js type definitions:

1. **For Bun-exclusive projects**: Use `@types/bun`
   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals", "@types/bun"]
     }
   }
   ```

2. **For Node.js compatibility**: Use `@types/node`
   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals", "@types/node"]
     }
   }
   ```

3. **For mixed environments**: Use both with `skipLibCheck`
   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals", "@types/bun", "@types/node"],
       "skipLibCheck": true
     }
   }
   ```
   **Note**: This approach may lead to type conflicts and is not recommended unless absolutely necessary.

### Example tsconfig.json

```json
{
  "extends": "@outfitter/typescript-config/base.json",
  "compilerOptions": {
    "types": ["vitest/globals", "@types/bun"],
    "lib": ["ESNext"],
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## Migration Strategy

### From ESLint + Prettier

1. **Backup Phase**
   - Detect `.eslintrc.*`, `.prettierrc.*`, etc.
   - Create timestamped backup markdown file
   - Parse ESLint rules for migration hints

2. **Removal Phase**
   - Uninstall ESLint and related plugins
   - Remove configuration files
   - Clean up VS Code settings

3. **Installation Phase**
   - Install Flint dependencies
   - Generate new configurations
   - Update package.json scripts

4. **Verification Phase**
   - Run format and lint commands
   - Check git diff for unexpected changes
   - Provide migration report

### From @outfitter/formatting

```bash
# Remove old package
bun remove @outfitter/formatting

# Install and setup Flint
bun add -D @outfitter/flint
bunx flint init --yes

# The init command will:
# 1. Detect existing Ultracite/Biome setup
# 2. Preserve working configurations
# 3. Add Oxlint for linting
# 4. Update scripts and settings
```

## Usage Examples

### Basic Setup

```bash
# New project
mkdir my-project && cd my-project
bun init -y
bunx @outfitter/flint init

# Existing project
cd existing-project
bunx @outfitter/flint init
```

### Monorepo Setup

```bash
# Root configuration
cd monorepo-root
bunx @outfitter/flint init --monorepo

# This will:
# - Add Flint as a dev dependency
# - Configure tools for monorepo structure
# - Set up root-level scripts
# - Create workspace-aware configs
```

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run ci
```

## Performance Comparison

| Operation | ESLint + Prettier | Flint (Biome + Oxlint) | Improvement |
|-----------|-------------------|------------------------|-------------|
| Format 1000 files | ~5s | ~0.3s | **16x faster** |
| Lint 1000 files | ~10s | ~0.2s | **50x faster** |
| Pre-commit (100 files) | ~2s | ~0.1s | **20x faster** |
| CI check (full repo) | ~15s | ~0.5s | **30x faster** |

## Roadmap

### v1.0.0 (Initial Release)
- ✅ Core initialization functionality
- ✅ All tool integrations
- ✅ Backup system
- ✅ VS Code support
- ✅ Comprehensive test suite

### v1.1.0
- [ ] Preset system (strict, standard, relaxed)
- [ ] Rule migration assistant
- [ ] `flint migrate` command
- [ ] Web-based configuration UI

### v1.2.0
- [ ] IDE plugins (JetBrains, Neovim)
- [ ] Docker/devcontainer integration
- [ ] Performance profiling tools
- [ ] Custom rule definitions

### v2.0.0
- [ ] Plugin system for custom tools
- [ ] Cloud configuration sync
- [ ] Team configuration sharing
- [ ] AI-powered rule suggestions

## Testing Strategy

```typescript
// src/__tests__/init.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { init } from '../commands/init';
import { mockFileSystem } from '../test-utils';

describe('flint init', () => {
  beforeEach(() => {
    mockFileSystem.reset();
  });
  
  it('should detect existing ESLint configuration', async () => {
    mockFileSystem.addFile('.eslintrc.js', 'module.exports = {}');
    
    const result = await init({ dryRun: true });
    
    expect(result.isSuccess()).toBe(true);
    expect(mockFileSystem.getBackups()).toHaveLength(1);
  });
  
  it('should generate all configuration files', async () => {
    const result = await init({ yes: true });
    
    expect(result.isSuccess()).toBe(true);
    expect(mockFileSystem.exists('biome.jsonc')).toBe(true);
    expect(mockFileSystem.exists('.oxlintrc.json')).toBe(true);
    expect(mockFileSystem.exists('.prettierrc.json')).toBe(true);
  });
  
  it('should update package.json scripts', async () => {
    mockFileSystem.addFile('package.json', JSON.stringify({
      name: 'test-project',
      scripts: {
        test: 'vitest'
      }
    }));
    
    await init({ yes: true });
    
    const pkg = mockFileSystem.readJSON('package.json');
    expect(pkg.scripts.format).toBe('biome format --write .');
    expect(pkg.scripts.lint).toBe('oxlint');
    expect(pkg.scripts.test).toBe('vitest'); // Preserved
  });
});
```

## Simplified Implementation Through Tool Delegation

By leveraging the existing capabilities of Ultracite and Oxlint, Flint's implementation becomes much simpler:

### What Each Tool Handles

| Tool | What it does | What Flint adds |
|------|--------------|-----------------|
| **Ultracite** | - Installs Biome<br>- Creates biome.jsonc<br>- Sets up VS Code<br>- Configures git hooks | - Coordinates with other tools<br>- Ensures no conflicts |
| **Oxlint** | - Creates .oxlintrc.json<br>- Migrates ESLint config<br>- Sets up linting rules | - Enhances config<br>- Removes ESLint deps |
| **Flint** | - Orchestrates all tools<br>- Backs up old configs<br>- Cleans up old tools<br>- Manages dependencies | - Fills the gaps<br>- Ensures consistency |

### The Key Innovation

Flint doesn't try to replace what these tools do well. Instead, it:
1. **Delegates** configuration generation to the tools themselves
2. **Handles** what they don't (cleanup, backup, dependency management)
3. **Orchestrates** multiple tools to work together harmoniously
4. **Simplifies** the developer experience with a single command

This approach means:
- Less code to maintain in Flint
- Automatic updates when tools improve their init processes
- Focus on the hard part: migration and cleanup
- Better compatibility with tool ecosystems

## Conclusion

`@outfitter/flint` represents a modern, performant approach to JavaScript/TypeScript code quality tooling. By leveraging Rust-based tools (Biome, Oxlint) for performance-critical operations and established tools (Prettier, markdownlint-cli2, Stylelint) for specialized tasks, it provides:

1. **Blazing fast performance** - 10-50x faster than traditional setups
2. **Zero configuration** - Sensible defaults that just work
3. **No conflicts** - Each tool has a specific responsibility
4. **Easy migration** - Automated backup and transition
5. **Future-proof** - Built on the fastest, most modern tools

The package will deprecate both `@outfitter/formatting` and `@outfitter/packlist`, consolidating their best features into a single, cohesive solution that can be used across all Outfitter projects and beyond.