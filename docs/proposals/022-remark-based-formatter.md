# Proposal: Lightweight Formatting Setup Tool

## Summary

Create `@outfitter/formatting` - a lightweight formatting setup tool that installs config packages, detects available formatters, and configures projects for consistent code formatting across JavaScript/TypeScript (Biome), Markdown (Remark), and other files (Prettier).

## Motivation

Current challenges:
1. **Scattered configuration** - Multiple config files (.prettierrc, biome.json, .editorconfig, etc.)
2. **Limited markdown formatting** - Most tools handle code well but not markdown structure
3. **No unified approach** - Each tool has its own config format and conventions
4. **Poor code block handling** - Tools either format everything or nothing

This proposal addresses all these issues with:
- **Lightweight setup tool** that doesn't bundle heavy formatters
- **Config packages** that provide consistent settings
- **Smart detection** of available formatters (local, global, system)
- **Flexible installation** options including devcontainers

## Architecture

### Overview

```
User runs: npx @outfitter/formatting init
                    ↓
            [Detect formatters]
          /         |          \
    Local?      Global?      System?
         \         |          /
          [Install config packages]
                    ↓
         @outfitter/prettier-config
         @outfitter/biome-config
         @outfitter/remark-config
                    ↓
         [Create config files]
         [Update package.json]
```

### Tool Detection Strategy

The package provides configs but not the heavy formatter tools themselves:

```json
{
  "name": "@outfitter/formatting",
  "dependencies": {
    // Lightweight config packages only
    "@outfitter/prettier-config": "workspace:*",
    "@outfitter/biome-config": "workspace:*",
    "@outfitter/remark-config": "workspace:*"
  },
  "peerDependencies": {
    // Tools are optional - user provides these
    "prettier": "^3.0.0",
    "@biomejs/biome": "^1.9.0",
    "remark-cli": "^12.0.0"
  },
  "peerDependenciesMeta": {
    "prettier": { "optional": true },
    "@biomejs/biome": { "optional": true },
    "remark-cli": { "optional": true }
  }
}
```

### Init Command Implementation

```typescript
export async function init(options: InitOptions = {}) {
  console.log('🚀 Initializing Outfitter formatting...');
  
  // 1. Detect available formatters
  const formatters = await detectAvailableFormatters();
  
  console.log('\n🔍 Detected formatters:');
  console.log('  Biome:', formatters.biome?.type || '❌ not found');
  console.log('  Prettier:', formatters.prettier?.type || '❌ not found');
  console.log('  Remark:', formatters.remark?.type || '❌ not found');
  
  // 2. Detect project structure
  const projectInfo = await detectProjectStructure();
  console.log('\n📁 Project type:', projectInfo.type);
  
  // 3. Install config packages only (lightweight)
  const configPackages = [
    '@outfitter/prettier-config',
    '@outfitter/biome-config',
    '@outfitter/remark-config'
  ];
  
  console.log('\n📦 Installing config packages...');
  await installPackages(configPackages, { dev: true });
  
  // 4. Create config files that reference the packages
  console.log('\n📝 Creating config files...');
  await createConfigFiles(projectInfo);
  
  // 5. Update package.json scripts
  console.log('\n⚙️  Updating package.json scripts...');
  await updatePackageScripts(generateScripts(formatters, projectInfo));
  
  // 6. Offer to install missing tools
  await handleMissingFormatters(formatters);
  
  console.log('\n✅ Formatting setup complete!');
}

async function detectAvailableFormatters() {
  const formatters: FormattersInfo = {};
  
  for (const [name, command] of Object.entries(FORMATTER_COMMANDS)) {
    formatters[name] = await findFormatter(command);
  }
  
  return formatters;
}

async function findFormatter(name: string): Promise<FormatterInfo | null> {
  // 1. Check local node_modules
  try {
    const localPath = require.resolve(name);
    return { type: 'local', path: localPath, version: await getVersion(name) };
  } catch {}
  
  // 2. Check global installation
  const globalPath = await findGlobalBinary(name);
  if (globalPath) {
    return { type: 'global', path: globalPath, version: await getVersion(name, true) };
  }
  
  // 3. Check system PATH (Docker, devcontainer, etc.)
  const systemPath = await which(name);
  if (systemPath) {
    return { type: 'system', path: systemPath, version: 'system' };
  }
  
  return null;
}
```

### Script Generation

```typescript
function generateScripts(formatters: FormattersInfo, projectInfo: ProjectInfo) {
  const scripts: Record<string, string> = {};
  
  // Main format command - uses our router if available, falls back to individual tools
  if (formatters.biome || formatters.prettier) {
    scripts['format'] = 'outfitter-formatting format . --write';
    scripts['format:check'] = 'outfitter-formatting format .';
  }
  
  // Individual formatter commands (only if tool is available)
  if (formatters.biome) {
    scripts['format:biome'] = 'biome format . --write';
    scripts['lint'] = 'biome lint .';
    scripts['lint:fix'] = 'biome lint . --write';
  }
  
  if (formatters.prettier) {
    scripts['format:prettier'] = 'prettier --write "**/*.{yml,yaml,css,scss,html}"';
  }
  
  if (formatters.remark) {
    scripts['format:markdown'] = 'remark . --output';
    scripts['lint:docs'] = 'remark . --quiet --frail';
  }
  
  // Combined lint command
  const lintCommands = [];
  if (formatters.biome) lintCommands.push('biome lint .');
  if (formatters.remark) lintCommands.push('remark . --quiet --frail');
  if (lintCommands.length > 0) {
    scripts['lint:all'] = lintCommands.join(' && ');
  }
  
  // CI command
  scripts['ci:format'] = 'pnpm format:check && pnpm lint:all';
  
  // Monorepo adjustments
  if (projectInfo.type === 'monorepo') {
    return wrapScriptsForMonorepo(scripts);
  }
  
  return scripts;
}

function wrapScriptsForMonorepo(scripts: Record<string, string>) {
  const monorepoScripts: Record<string, string> = {};
  
  for (const [name, command] of Object.entries(scripts)) {
    // Root level runs recursively
    if (name.startsWith('format') || name.startsWith('lint')) {
      monorepoScripts[name] = `pnpm -r ${name}`;
      monorepoScripts[`${name}:root`] = command; // Also provide root-only version
    } else {
      monorepoScripts[name] = command;
    }
  }
  
  return monorepoScripts;
}

### Config File Creation

```typescript
async function createConfigFiles(projectInfo: ProjectInfo) {
  // Simple config files that reference our packages
  const configs = {
    '.prettierrc.js': `module.exports = require('@outfitter/prettier-config');\n`,
    
    'biome.jsonc': `{
  // Extends the Outfitter Biome configuration
  "extends": ["@outfitter/biome-config"]
}\n`,
    
    '.remarkrc.js': `module.exports = require('@outfitter/remark-config');\n`,
    
    '.editorconfig': generateEditorConfig(projectInfo)
  };
  
  for (const [filename, content] of Object.entries(configs)) {
    await fs.writeFile(filename, content);
    console.log(`  ✓ Created ${filename}`);
  }
  
  // VS Code settings (if .vscode exists or user wants it)
  if (await fs.pathExists('.vscode') || await promptVSCode()) {
    await fs.ensureDir('.vscode');
    await fs.writeJson('.vscode/settings.json', generateVSCodeSettings(), { spaces: 2 });
    console.log('  ✓ Created .vscode/settings.json');
  }
}
```

### DevContainer Support

For users who prefer containerized development environments:

```typescript
async function handleMissingFormatters(formatters: FormattersInfo) {
  const missing = Object.entries(formatters)
    .filter(([_, info]) => !info)
    .map(([name]) => name);
    
  if (missing.length === 0) return;
  
  console.log('\n⚠️  Missing formatters:', missing.join(', '));
  console.log('\nYou have several options:');
  console.log('  1. Install locally: pnpm add -D', missing.map(getPackageName).join(' '));
  console.log('  2. Install globally: npm install -g', missing.join(' '));
  console.log('  3. Use a devcontainer with tools pre-installed');
  
  const { createDevContainer } = await prompt({
    type: 'confirm',
    message: 'Would you like to create a devcontainer configuration?'
  });
  
  if (createDevContainer) {
    await createDevContainerConfig();
  }
}

async function createDevContainerConfig() {
  const config = {
    "name": "Outfitter Dev",
    "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
    "features": {
      "ghcr.io/devcontainers-contrib/features/prettier:1": {},
      "ghcr.io/devcontainers-contrib/features/biome:1": {}
    },
    "postCreateCommand": "npm install -g remark-cli remark-preset-lint-recommended",
    "customizations": {
      "vscode": {
        "extensions": [
          "biomejs.biome",
          "esbenp.prettier-vscode",
          "unifiedjs.vscode-remark"
        ]
      }
    }
  };
  
  await fs.ensureDir('.devcontainer');
  await fs.writeJson('.devcontainer/devcontainer.json', config, { spaces: 2 });
  console.log('  ✓ Created .devcontainer/devcontainer.json');
}
```

### Core Implementation

```typescript
// Formatter router command - routes files to appropriate formatters
export class FormatterRouter {
  private formatters: FormattersInfo;
  
  constructor(formatters: FormattersInfo) {
    this.formatters = formatters;
  }
  
  async format(patterns: string[], options: FormatOptions) {
    const files = await globby(patterns);
    const filesByFormatter = this.groupFilesByFormatter(files);
    
    for (const [formatter, files] of Object.entries(filesByFormatter)) {
      if (!this.formatters[formatter]) {
        console.warn(`⚠️  ${formatter} not available, skipping ${files.length} files`);
        continue;
      }
      
      await this.runFormatter(formatter, files, options);
    }
  }
  
  private groupFilesByFormatter(files: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    for (const file of files) {
      const formatter = this.getFormatterForFile(file);
      if (!groups[formatter]) groups[formatter] = [];
      groups[formatter].push(file);
    }
    
    return groups;
  }
  
  private getFormatterForFile(file: string): string {
    const ext = path.extname(file).slice(1);
    
    // Biome handles JS/TS/JSON
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'jsonc'].includes(ext)) {
      return 'biome';
    }
    
    // Remark handles markdown
    if (['md', 'mdx', 'mdc'].includes(ext)) {
      return 'remark';
    }
    
    // Prettier handles everything else
    return 'prettier';
  }
  
  private async runFormatter(name: string, files: string[], options: FormatOptions) {
    const commands = {
      biome: `biome format ${files.join(' ')} ${options.write ? '--write' : ''}`,
      prettier: `prettier ${files.join(' ')} ${options.write ? '--write' : '--check'}`,
      remark: `remark ${files.join(' ')} ${options.write ? '--output' : ''}`
    };
    
    const command = commands[name];
    if (!command) return;
    
    console.log(`Running ${name}...`);
    await execa.command(command, { stdio: 'inherit' });
  }
}
```


### CLI Interface

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigManager, RemarkFormatter } from '@outfitter/formatting';

const program = new Command();

program
  .name('outfitter-formatting')
  .description('Setup and manage code formatting')
  .version('1.0.0');

// Initialize formatting setup
program
  .command('init')
  .description('Initialize formatting configuration')
  .option('--preset <name>', 'Use a preset configuration', 'standard')
  .option('--no-devcontainer', 'Skip devcontainer prompt')
  .action(async (options) => {
    await init(options);
  });

// Format files using detected formatters
program
  .command('format [patterns...]')
  .description('Format files using appropriate formatters')
  .option('--write', 'Write formatted files (default: check only)')
  .option('--check', 'Check if files are formatted')
  .action(async (patterns, options) => {
    const formatters = await detectAvailableFormatters();
    const router = new FormatterRouter(formatters);
    
    // Default to all files if no patterns provided
    const filePatterns = patterns.length > 0 ? patterns : ['.'];
    
    await router.format(filePatterns, {
      write: options.write && !options.check,
      check: options.check || !options.write
    });
  });

// Show detected formatters
program
  .command('status')
  .description('Show available formatters')
  .action(async () => {
    const formatters = await detectAvailableFormatters();
    
    console.log('Detected formatters:');
    for (const [name, info] of Object.entries(formatters)) {
      if (info) {
        console.log(`  ✓ ${name}: ${info.type} (${info.version || 'unknown version'})`);
      } else {
        console.log(`  ✗ ${name}: not found`);
      }
    }
  });

program.parse();
```

## Package Architecture Benefits

Using existing config packages provides:

1. **Independent versioning** - Each config can evolve with its own version
2. **Direct consumption** - Other projects can use `@outfitter/prettier-config` without the formatting package
3. **Type safety** - Config packages can export TypeScript types
4. **Testing isolation** - Each config can be tested independently
5. **Clear dependencies** - package.json shows exactly which configs are used

### Package Structure

The `@outfitter/formatting` package is lightweight, containing only configs:

```json
{
  "name": "@outfitter/formatting",
  "bin": {
    "outfitter-formatting": "./dist/cli.js"
  },
  "dependencies": {
    // Config packages only - no heavy formatter tools
    "@outfitter/prettier-config": "workspace:*",
    "@outfitter/biome-config": "workspace:*",
    "@outfitter/remark-config": "workspace:*",
    
    // CLI utilities
    "commander": "^12.0.0",
    "execa": "^8.0.0",
    "globby": "^14.0.0",
    "prompts": "^2.4.2",
    "which": "^4.0.0"
  },
  "peerDependencies": {
    // Formatters are optional - detected at runtime
    "prettier": "^3.0.0",
    "@biomejs/biome": "^1.9.0",
    "remark-cli": "^12.0.0"
  },
  "peerDependenciesMeta": {
    "prettier": { "optional": true },
    "@biomejs/biome": { "optional": true },
    "remark-cli": { "optional": true }
  }
}
```

### User Installation Flow

```bash
# 1. Install the formatting package (lightweight)
pnpm add -D @outfitter/formatting

# 2. Run init to set up configs
pnpm exec outfitter-formatting init

# 3. Choose how to install formatters:
#    a) Locally: pnpm add -D prettier @biomejs/biome remark-cli
#    b) Globally: npm i -g prettier @biomejs/biome remark-cli  
#    c) Use devcontainer/Docker with pre-installed tools
#    d) Use system-installed tools (homebrew, apt, etc.)
```

## Generated Configurations

The system updates config packages and generates runtime configs:

### .prettierrc
```json
{
  "endOfLine": "lf",
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-tailwindcss"],
  "overrides": [
    {
      "files": ["**/*.{yml,yaml}"],
      "options": {
        "bracketSpacing": true,
        "proseWrap": "preserve"
      }
    },
    {
      "files": ["**/*.{css,scss,less}"],
      "options": {
        "singleQuote": true
      }
    },
    {
      "files": ["**/.{prettier,eslint}rc*", "**/package.json"],
      "options": {
        "parser": "json5",
        "trailingComma": "none"
      }
    }
  ]
}
```

### biome.jsonc
```jsonc
// Generated from formatting.config.yaml
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingComma": "all",
      "arrowParentheses": "always"
    }
  },
  "json": {
    "formatter": {
      "trailingComma": "none"
    }
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git"
  }
}
```

### .editorconfig
```ini
# Generated from formatting.config.yaml
root = true

[*]
end_of_line = lf
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true
charset = utf-8

[*.{md,mdx,mdc}]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### .vscode/settings.json
```json
{
  "[markdown]": {
    "editor.defaultFormatter": "outfitter.formatting"
  },
  "[typescript][javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Benefits

1. **Lightweight installation** - Only installs config packages, not heavy formatter tools
2. **Flexible tool management** - Use local, global, or containerized formatters
3. **No version conflicts** - Projects can use their preferred formatter versions
4. **Container-friendly** - Perfect for devcontainers and CI environments
5. **Simple setup** - One `init` command configures everything
6. **Monorepo aware** - Detects and configures monorepo structures
7. **Modular configs** - Config packages can be used independently
8. **Smart routing** - Automatically routes files to appropriate formatters
9. **Graceful degradation** - Works with whatever formatters are available

## Implementation Phases

### Phase 1: Core Setup Tool (Week 1)
- Create `@outfitter/remark-config` package with standard rules
- Build init command with formatter detection
- Script generation for package.json
- Monorepo detection and configuration
- Basic formatter router

### Phase 2: Enhanced Features (Week 2)
- DevContainer configuration generator
- Preset support (strict, relaxed, library)
- Better error messages for missing tools
- Performance optimization for formatter routing
- Integration tests

### Phase 3: Polish & Documentation (Week 3)
- Comprehensive documentation
- Example configurations
- Migration guide from individual tools
- GitHub Action for CI
- VS Code workspace recommendations

## Migration Strategy

### From Manual Setup
```bash
# 1. Install the formatting package
pnpm add -D @outfitter/formatting

# 2. Run init (detects existing configs and tools)
pnpm exec outfitter-formatting init

# 3. Review generated scripts in package.json
# 4. Test the new setup
pnpm format
pnpm lint:all

# 5. Remove old config files (optional)
rm .prettierrc .remarkrc  # Keep if you need custom overrides
```

### For Monorepos
```bash
# Run init at the root
cd monorepo-root
pnpm add -D @outfitter/formatting
pnpm exec outfitter-formatting init

# Init will detect monorepo and offer to:
# - Set up root-level formatting scripts
# - Add formatting to all workspace packages
# - Create shared config at root
```

### Using DevContainers
```bash
# If formatters aren't installed locally
pnpm exec outfitter-formatting init

# When prompted about missing formatters, choose:
# "Create devcontainer configuration"

# This generates .devcontainer/devcontainer.json with all tools pre-installed
```

## Relationship to Rightdown

`@outfitter/formatting` and Rightdown serve different purposes:

- **Rightdown**: Specialized tool for formatting code blocks within markdown files
- **@outfitter/formatting**: General-purpose formatting setup tool for entire projects

They complement each other:
1. Use `@outfitter/formatting` to set up project-wide formatting
2. Use Rightdown when you need specialized markdown code block formatting
3. Both can coexist - Rightdown for precision, formatting for general use

## Success Criteria

1. **Adoption** - All Outfitter packages migrated
2. **Performance** - < 1s to format average markdown file
3. **Compatibility** - Zero breaks in existing workflows
4. **Developer Experience** - Single config file, clear error messages
5. **IDE Integration** - Seamless VS Code experience

## Next Steps

1. Create `@outfitter/remark-config` package structure
2. Update existing config packages to support programmatic updates
3. Validate config schema with team
4. Prototype remark code formatting plugin
5. Build package update mechanism
6. Create migration tooling
7. Test with real projects

---

**Author**: Matt Galligan  
**Date**: 2024-12-23  
**Status**: Draft  
**Related**: Rightdown v2, Config Sync proposals