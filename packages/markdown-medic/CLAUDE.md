# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `@outfitter/markdown-medic` package - an opinionated markdown linting and formatting tool that goes beyond basic linting. It provides health checks, auto-healing, and smart defaults for technical documentation.

## Key Commands

### Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Run tests
pnpm test              # Watch mode
pnpm test --run        # Single run

# Type checking
pnpm type-check
```

### Testing the CLI

```bash
# Build first
pnpm build

# Test commands
node dist/cli.js --init                    # Create config
node dist/cli.js README.md                 # Check a file
node dist/cli.js --fix "**/*.md"          # Fix all markdown
node dist/cli.js --preset strict          # Use strict preset
```

## Architecture

### Package Structure

- `src/cli.ts` - Command-line interface with `mdlint` command
- `src/check.ts` - Core checking logic that combines markdownlint + custom rules
- `src/fix.ts` - Auto-fixing logic for correctable issues
- `src/config.ts` - Configuration loading and management
- `src/presets.ts` - Built-in presets (strict, standard, relaxed)
- `src/rules/` - Custom rule implementations

### Custom Rules

Beyond standard markdownlint rules, we implement:

1. **consistent-terminology** - Enforces correct spelling/capitalization
2. **code-block-language** - Requires language tags on code blocks
3. **frontmatter-required** - Requires YAML frontmatter
4. **toc-required** - Requires TOC for long documents
5. **no-dead-links** - Checks for broken local file links

### Configuration

The tool uses `.mdlint.yaml` files with this structure:

```yaml
preset: standard              # Base preset
rules:                       # Rule overrides
  line-length: 100
  custom-rule: true
ignore:                      # Files to ignore
  - node_modules/**
terminology:                 # Term enforcement
  - { incorrect: "NPM", correct: "npm" }
```

### Key Design Decisions

1. **Markdownlint Foundation** - We wrap markdownlint for standard rules and add custom ones
2. **YAML Configuration** - Familiar format, easy to edit
3. **Presets** - Quick starting points for different strictness levels
4. **Fix Support** - Auto-fix where possible, following prettier philosophy
5. **Extensible** - Easy to add new custom rules

## Usage Patterns

### As a CLI Tool

```bash
# Global installation
npm install -g @outfitter/markdown-medic
mdlint --fix

# Project installation
npm install -D @outfitter/markdown-medic
npx mdlint
```

### As a Library

```typescript
import { checkMarkdown, fixMarkdown } from '@outfitter/markdown-medic';

const results = await checkMarkdown(content, { config });
const fixed = await fixMarkdown(content, { config });
```

### In CI/CD

```yaml
- name: Lint Markdown
  run: |
    npm install -g @outfitter/markdown-medic
    mdlint
```

## Important Notes

- The package is designed to be installed globally or as a dev dependency
- It should work with any markdown files, not just in Outfitter projects
- The CLI name is `mdlint` to avoid confusion with `markdownlint`
- Custom rules should be added to `src/rules/` with check and fix functions
- Presets balance strictness with practicality for technical docs

## Future Enhancements

- GitHub Action for easy CI integration
- VS Code extension for real-time linting
- More custom rules (spell check, inclusive language, etc.)
- Integration with other Outfitter tools
- Caching for expensive checks (dead links, etc.)