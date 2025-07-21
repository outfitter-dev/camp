# @outfitter/formatting

Modern formatting setup that leverages [Ultracite](https://github.com/haydenbleasel/ultracite) (zero-config Biome preset) for TypeScript/JavaScript and complements it with Prettier and markdownlint-cli2 for other file types.

## Quick Start

```bash
# Using npx
npx @outfitter/formatting init

# Using pnpm
pnpm dlx @outfitter/formatting init

# Using bun
bunx @outfitter/formatting init

# Using yarn
yarn dlx @outfitter/formatting init
```

This single command will:

1. ⚡ Run `ultracite init` to set up Biome for JS/TS with ~300 opinionated rules
2. 📦 Install Prettier and markdownlint-cli2 as dev dependencies
3. 🎨 Configure Prettier for non-JS/TS files (YAML, JSON, CSS, HTML, Markdown)
4. 📝 Set up markdownlint-cli2 for markdown linting
5. 📄 Create `.editorconfig` for cross-editor consistency
6. 🔧 Configure VS Code settings for all file types
7. 📜 Update package.json with formatting scripts

## What You Get

### Tool Responsibilities

- **Biome** (via Ultracite): All TypeScript/JavaScript/JSX/TSX formatting and linting
- **Prettier**: YAML, JSON, CSS, HTML, and Markdown formatting
- **markdownlint-cli2**: Markdown linting standards

### Generated Files

- `biome.json` - Extends Ultracite preset (created by ultracite init)
- `.prettierrc.json` - Configured to ignore JS/TS files
- `.prettierignore` - Standard ignore patterns
- `.markdownlint-cli2.yaml` - Sensible markdown linting rules
- `.editorconfig` - Editor consistency settings
- `.gitattributes` - Line ending normalization
- `.vscode/settings.json` - VS Code formatter configuration
- `.vscode/extensions.json` - Recommended extensions

### Package.json Scripts

```json
{
  "scripts": {
    "format": "biome check --write . && prettier --write '**/*.{yml,yaml,json,md,css,html}'",
    "format:check": "biome check . && prettier --check '**/*.{yml,yaml,json,md,css,html}'",
    "lint": "biome lint . && markdownlint-cli2",
    "lint:fix": "biome lint --write . && markdownlint-cli2 --fix",
    "ci": "biome ci . && prettier --check '**/*.{yml,yaml,json,md,css,html}' && markdownlint-cli2"
  }
}
```

## CLI Options

```bash
outfitter-formatting init [options]

Options:
  --skip-ultracite     Skip running ultracite init
  --skip-install       Skip installing dependencies
  --no-markdown-lint   Skip markdownlint-cli2 setup
  --no-editor-config   Skip EditorConfig creation
  --dry-run           Show what would be done but don't write files
  -h, --help          Display help
```

## Why This Approach?

1. **Zero Configuration**: Ultracite provides battle-tested Biome configuration
2. **Fast**: Biome is 10-100x faster than ESLint/Prettier for JS/TS
3. **No Conflicts**: Clear separation between tool responsibilities
4. **Modern**: Uses the latest, fastest tools
5. **Complete**: Handles all common file types in modern projects
6. **AI-Ready**: Ultracite is designed for AI code generation

## Philosophy

This package follows the "boring solutions for boring problems" philosophy:

- Leverage existing excellent tools (Ultracite)
- Don't reinvent what already works well
- Focus on the missing pieces
- One command to set up everything
- Opinionated defaults that just work

## Requirements

- Node.js 18.0.0 or later
- A package manager (npm, yarn, pnpm, or bun)

## License

ISC