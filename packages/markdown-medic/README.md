# @outfitter/markdown-medic

> Opinionated markdown linting and formatting for healthy documentation

## Overview

Markdown Medic is an opinionated markdown linter and formatter that goes beyond basic linting. It provides:

- 🏥 **Health checks** - Diagnose common markdown ailments
- 💊 **Auto-healing** - Fix issues automatically where possible
- 🔧 **Configurable rules** - Customize via `.mdlint.yaml` config
- 📋 **Multiple presets** - Choose from strict, standard, or relaxed
- 🎯 **Smart defaults** - Sensible rules for technical documentation

## Installation

```bash
# Install globally
npm install -g @outfitter/markdown-medic

# Or as a dev dependency
npm install -D @outfitter/markdown-medic
```

## Usage

### CLI

```bash
# Check markdown files
mdlint

# Fix auto-fixable issues
mdlint --fix

# Check specific files or patterns
mdlint "docs/**/*.md" "README.md"

# Use a specific preset
mdlint --preset strict

# Custom config file
mdlint --config .mdlint.yaml
```

### Configuration

Create a `.mdlint.yaml` file in your project root:

```yaml
# Preset: strict, standard, or relaxed
preset: standard

# Custom rule overrides
rules:
  # Markdown rules
  line-length: 100
  heading-style: atx
  list-marker-space: true
  
  # Custom rules
  no-dead-links: true
  consistent-terminology: true
  
# Ignore patterns
ignore:
  - node_modules
  - .git
  - CHANGELOG.md
  
# Custom terminology
terminology:
  - { incorrect: "NPM", correct: "npm" }
  - { incorrect: "Javascript", correct: "JavaScript" }
```

### Programmatic API

```typescript
import { checkMarkdown, fixMarkdown } from '@outfitter/markdown-medic';

// Check markdown content
const results = await checkMarkdown(content, {
  preset: 'standard',
  rules: {
    'line-length': 100
  }
});

// Fix markdown content
const fixed = await fixMarkdown(content, options);
```

## Presets

### Strict
- Line length: 80 characters
- No inline HTML
- Ordered heading levels
- Consistent list markers
- No trailing punctuation in headings

### Standard (default)
- Line length: 100 characters
- Limited inline HTML
- Flexible heading styles
- Consistent formatting

### Relaxed
- No line length limit
- Inline HTML allowed
- Flexible formatting
- Focus on structural issues

## Custom Rules

Beyond standard markdownlint rules, Markdown Medic adds:

- **no-dead-links** - Check for broken links
- **consistent-terminology** - Enforce consistent spelling/capitalization
- **frontmatter-required** - Require YAML frontmatter
- **toc-required** - Require table of contents for long documents
- **code-block-language** - Require language tags on code blocks

## Integration

### GitHub Actions

```yaml
- name: Lint Markdown
  uses: outfitter-dev/markdown-medic-action@v1
  with:
    config: .mdlint.yaml
    fix: true
```

### Pre-commit Hook

```yaml
- repo: https://github.com/outfitter-dev/markdown-medic
  rev: v1.0.4
  hooks:
    - id: markdown-medic
```

## Philosophy

Markdown Medic believes in:

- 📏 **Consistency** over flexibility
- 🔧 **Automation** over manual review  
- 📚 **Readability** over brevity
- 🎯 **Clarity** over cleverness

## License

MIT