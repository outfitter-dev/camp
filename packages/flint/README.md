# @outfitter/flint

Unified formatting and linting setup for JavaScript/TypeScript projects.

## Overview

Flint brings together best-in-class tools for code quality:
- **Biome** (via Ultracite) - Fast JS/TS formatting
- **Oxlint** - Lightning-fast JS/TS linting
- **Prettier** - Formatting for non-JS/TS files
- **markdownlint-cli2** - Markdown linting
- **Stylelint** - CSS/SCSS/Less linting
- **Lefthook** - Git hooks management

## Installation

```bash
# Using pnpm (recommended)
pnpm add -D @outfitter/flint

# Using npm
npm install -D @outfitter/flint

# Using bun
bun add -D @outfitter/flint
```

## Quick Start

```bash
# Initialize Flint in your project
pnpm dlx @outfitter/flint init

# Or with npx
npx @outfitter/flint init
```

## Commands

### `flint init`

Initialize formatting and linting tools in your project.

Options:
- `-y, --yes` - Skip prompts and use defaults
- `--dry-run` - Show what would happen without making changes
- `--keep-existing` - Keep existing configurations
- `--no-stylelint` - Skip Stylelint setup
- `--no-git-hooks` - Skip git hooks setup
- `--monorepo` - Configure for monorepo structure
- `--keep-prettier` - Keep Prettier for all files

### `flint clean`

Remove old configuration files (creates backup first).

Options:
- `--force` - Skip confirmation prompt

### `flint doctor`

Diagnose configuration issues and suggest fixes.

## What It Does

1. **Detects** existing ESLint, Prettier, and other tool configurations
2. **Backs up** your current setup to a markdown file
3. **Installs** and configures modern, fast tools
4. **Removes** old, slow tools (with your permission)
5. **Updates** package.json scripts for the new workflow
6. **Configures** VS Code for optimal developer experience

## License

MIT