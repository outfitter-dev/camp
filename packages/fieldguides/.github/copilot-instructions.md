# GitHub Copilot Instructions

This repository maintains Agent Outfitter (mg-outfitter), a living documentation
system that equips AI agents with consistent development practices. Please
follow these guidelines when contributing:

## Code Standards

### Required Before Each Commit

- Run `markdownlint-cli2 "**/*.md" --fix` to ensure proper markdown formatting
- This will fix formatting issues automatically and maintain consistent style

### Development Flow

- Build: Not applicable (documentation repository)
- Lint: `markdownlint-cli2 "**/*.md"`
- Validate: Ensure all code examples in documentation are tested

## Repository Structure

- `fieldguides-v2/`: Professional documentation for external projects
  - `architecture/`: System design patterns and architectural decisions
  - `processes/`: Step-by-step development workflows
  - `rules/`: Non-negotiable guidelines and constraints
  - `standards/`: Language-specific conventions (TypeScript, etc.)
  - `templates/`: Reusable code templates and boilerplate
- `docs/`: Internal project documentation
  - `outfitter/`: Style guides using exploration theme
  - `project/`: ADRs and proposals
- `.claude/`: Claude-specific configurations and commands
- `AGENTS.md`: Instructions for OpenAI Codex Agent
- `CLAUDE.md`: Instructions for Claude

## Key Guidelines

### Documentation Standards

1. **Fieldguides** must use professional, theme-neutral language
2. **Internal docs** use exploration/adventure metaphors per
   `docs/outfitter/LANGUAGE.md`
3. Follow documentation structure in
   `fieldguides-v2/architecture/documentation.md`
4. All code examples must be executable and tested

### Version Control

1. Use conventional commits: `type(scope): subject`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
   - Example: `docs(fieldguides): add React patterns guide`
2. Create feature branches from main
3. Never commit directly to main
4. Check for existing PRs before creating new branches

### Markdown Formatting

1. Use `-` for unordered lists
2. Use ATX-style headers (`##`)
3. Add blank lines around headings and code blocks
4. Use fenced code blocks with triple backticks
5. Include language identifiers for syntax highlighting

### Writing Style

1. Be prescriptive and opinionated
2. Include practical, working examples
3. Explain the "why" not just the "how"
4. Keep content scannable with clear hierarchies

## Common Patterns

### Adding New Documentation

When creating new fieldguides:

```markdown
# [Feature Name]

Brief description of what this covers and why it matters.

## Overview

High-level explanation...

## Usage

Practical examples...

## API Reference (if applicable)

Detailed documentation...

## Common Patterns

Typical use cases...
```

### Code Examples

Always include complete, runnable examples:

```typescript
// Good: Complete example with context
interface Config {
  timeout: number;
}

function configure(options: Config): void {
  validateConfig(options);
  applyConfig(options);
}

// Usage
configure({ timeout: 5000 });
```

## Important Notes

1. This is a documentation repository - no application code
2. All fieldguides are consumed by external projects - maintain professionalism
3. Test all code examples before documenting
4. Follow existing patterns and conventions
5. When in doubt, check similar existing documentation
