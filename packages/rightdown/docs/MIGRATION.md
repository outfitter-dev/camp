# Migration Guide

## From Rightdown v1 to v2

Rightdown v2 is a complete rewrite that transforms the tool from a markdownlint wrapper into a unified Markdown formatter. This is a breaking change with no backward compatibility.

### Key Changes

1. **New Purpose**: v2 formats code blocks within Markdown files, not just linting
2. **New Config Format**: YAML configuration with different structure
3. **New CLI**: Different commands and options
4. **Peer Dependencies**: Formatters are now peer dependencies

### Migration Steps

#### 1. Update Installation

```bash
# Remove old version
pnpm remove @outfitter/rightdown

# Install new version
pnpm add -D @outfitter/rightdown

# Install formatter peer dependencies
pnpm add -D prettier @biomejs/biome
```

#### 2. Update Configuration

Old v1 config (`.rightdown.config.yaml`):
```yaml
extends: null
default: true
MD003:
  style: atx
MD004:
  style: dash
terminology:
  - { incorrect: 'NPM', correct: 'npm' }
customRules:
  - ./node_modules/@outfitter/rightdown/dist/rules/consistent-terminology.js
ignores:
  - node_modules/**
```

New v2 config (`.rightdown.config.yaml`):
```yaml
version: 2
preset: standard

formatters:
  default: prettier
  languages:
    javascript: biome
    typescript: biome

formatterOptions:
  prettier:
    printWidth: 80
  biome:
    indentWidth: 2

rules:
  line-length: 80

terminology:
  - incorrect: NPM
    correct: npm

ignores:
  - node_modules/**
```

#### 3. Update CLI Usage

Old v1 commands:
```bash
rightdown --fix            # Fix markdown issues
rightdown --preset strict  # Use strict preset
rightdown --init           # Create config
```

New v2 commands:
```bash
rightdown --write          # Format markdown files
rightdown init             # Create config (subcommand)
rightdown --check          # Check if formatted
```

#### 4. Update npm Scripts

Old scripts:
```json
{
  "scripts": {
    "lint:md": "rightdown",
    "lint:md:fix": "rightdown --fix"
  }
}
```

New scripts:
```json
{
  "scripts": {
    "format:md": "rightdown --write",
    "format:md:check": "rightdown --check"
  }
}
```

### Features No Longer Available

- Direct markdownlint rule configuration (use external `.markdownlint.yaml` if needed)
- Custom markdownlint rules
- `--fix` flag (use `--write` instead)
- Multiple preset selection via CLI

### New Features in v2

- Code block formatting
- Multiple formatter support
- Language-specific formatter routing
- AST-based processing
- Preserves fence styles
- Unified configuration

### Need Help?

If you're having trouble migrating, please:

1. Check the [README](../README.md) for complete v2 documentation
2. Review the [example configurations](../examples/)
3. Open an issue on GitHub

## From Other Tools

### From Prettier + markdownlint

If you're currently using Prettier for code formatting and markdownlint for Markdown linting separately, Rightdown v2 can replace both for Markdown files:

1. Keep your `.prettierrc` for other file types
2. Move Markdown-specific rules to `.rightdown.config.yaml`
3. Update your scripts to use `rightdown` for Markdown files

### From markdown-formatter

Rightdown v2 provides similar functionality with more flexibility:

1. Language-specific formatter routing
2. Multiple formatter support
3. Extensible architecture
4. Better fence preservation