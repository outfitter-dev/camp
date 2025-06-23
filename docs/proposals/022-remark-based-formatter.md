# Proposal: Remark-based Formatter with Unified Configuration

## Summary

Create `@outfitter/formatting` - a comprehensive formatting solution that uses remark as the foundation for markdown processing, delegates code block formatting to specialized tools (Prettier/Biome), and introduces a unified YAML configuration (`formatting.config.yaml`) that generates all tool-specific configs.

## Motivation

Current challenges:
1. **Scattered configuration** - Multiple config files (.prettierrc, biome.json, .editorconfig, etc.)
2. **Limited markdown formatting** - Most tools handle code well but not markdown structure
3. **No unified approach** - Each tool has its own config format and conventions
4. **Poor code block handling** - Tools either format everything or nothing

This proposal addresses all these issues with:
- **Remark** as the AST-based markdown processor
- **Unified config** (`formatting.config.yaml`) as single source of truth
- **Smart routing** of code blocks to appropriate formatters
- **Config generation** for all downstream tools

## Architecture

### Overview

```
formatting.config.yaml
        ↓
   ConfigLoader
        ↓
 [Updates config packages]
        ↓
 @outfitter/prettier-config
 @outfitter/biome-config
 @outfitter/eslint-config
 @outfitter/remark-config (new)
        ↓
 RemarkProcessor ← [Imports configs]
        ↓
 [Formats markdown + code blocks]
```

### Unified Configuration Schema

```yaml
# formatting.config.yaml
version: 1

# Global defaults
defaults:
  indentWidth: 2
  indentStyle: space
  lineWidth: 80
  endOfLine: lf
  trimTrailingWhitespace: true
  insertFinalNewline: true

# Language to formatter mapping (for code blocks)
languages:
  biome: ["*script", "*sx", "json*"]
  prettier: ["css", "scss", "less", "html", "xml", "yaml", "yml", "markdown", "md*"]
  dprint: ["toml", "rust", "rs"]
  default: prettier

# Formatting patterns (array style, globs only)
patterns:
  - globs: ["**/*.{md,mdx,mdc}", "!**/CHANGELOG.md"]
    formatter: remark
    options:
      # Direct remark-stringify options
      bullet: "-"
      emphasis: "_"
      strong: "**"
      rule: "-"
      ruleSpaces: false
    # Override language mappings for this pattern
    codeBlocks:
      # Could override specific languages if needed
      # javascript: prettier  # Use prettier instead of biome for JS in markdown

  - globs: ["**/*.{ts,tsx,mts,cts}", "!**/*.d.ts"]
    formatter: biome
    options:
      # Direct Biome formatter options
      formatter:
        indentStyle: space
        indentWidth: 2
        lineWidth: 80
      javascript:
        formatter:
          quoteStyle: single
          semicolons: always
          trailingComma: all
          arrowParentheses: always

  - globs: ["**/*.{js,jsx,mjs,cjs}"]
    formatter: biome
    extends: typescript  # Inherit options

  - globs: ["**/*.{json,jsonc,json5}"]
    formatter: biome
    options:
      json:
        formatter:
          trailingComma: none

  - globs: ["**/*.{yml,yaml}"]
    formatter: prettier
    options:
      # Direct Prettier options
      bracketSpacing: true
      proseWrap: preserve

  - globs: ["**/*.{css,scss,less}"]
    formatter: prettier
    options:
      singleQuote: true

  # Special patterns
  - globs: ["**/.{prettier,eslint}rc*", "**/package.json"]
    formatter: prettier
    options:
      parser: json5
      trailingComma: none

# Tool configurations
tools:
  prettier:
    plugins: ["prettier-plugin-tailwindcss"]
    
  biome:
    vcs:
      enabled: true
      clientKind: git
      
  remark:
    plugins:
      # Structure
      - remark-gfm
      - remark-frontmatter
      # Linting
      - remark-lint-recommended
      - [remark-lint-list-marker-style, "-"]
      - [remark-lint-heading-style, "atx"]
      # Formatting
      - remark-reference-links
      - remark-squeeze-paragraphs
      # Custom
      - ./plugins/remark-terminology.js

# Shared ignore patterns
ignore:
  - "**/node_modules/**"
  - "**/dist/**"
  - "**/coverage/**"
  - "**/.next/**"
```

### Resolution Logic

The system uses a two-tier resolution approach:

1. **File-level formatting**: Determined by matching `patterns[].globs`
2. **Code block formatting**: 
   - First checks `patterns[].codeBlocks` for overrides
   - Falls back to global `languages` mapping
   - Finally uses `languages.default` if no match

Example resolution flow:
```yaml
# Global language mapping with wildcards
languages:
  biome: ["*script", "*sx", "json*"]  # Handles javascript, typescript, jsx, etc.
  prettier: ["css", "html", "yaml"]

# But this pattern overrides it for specific files
patterns:
  - globs: ["**/docs/**/*.md"]
    formatter: remark
    codeBlocks:
      javascript: prettier  # Override: use Prettier for JS in docs
      typescript: prettier  # Even though globally it's Biome
```

### Core Implementation

#### Config Loader & Generator

```typescript
import { load } from 'js-yaml';
import { z } from 'zod';

// Schema validation
const FormatterConfigSchema = z.object({
  version: z.number(),
  defaults: z.object({
    indentWidth: z.number(),
    indentStyle: z.enum(['space', 'tab']),
    lineWidth: z.number(),
    endOfLine: z.enum(['lf', 'crlf', 'cr', 'auto']),
    trimTrailingWhitespace: z.boolean(),
    insertFinalNewline: z.boolean()
  }),
  languages: z.object({
    biome: z.array(z.string()).optional(),
    prettier: z.array(z.string()).optional(), 
    dprint: z.array(z.string()).optional(),
    default: z.string()
  }),  // Formatter to languages mapping
  patterns: z.array(z.object({
    globs: z.array(z.string()),
    extends: z.string().optional(),
    formatter: z.enum(['prettier', 'biome', 'remark', 'dprint']),
    options: z.record(z.any()),  // Tool-specific options, no mapping
    codeBlocks: z.record(z.string()).optional()  // Override language mappings
  })),
  tools: z.object({
    prettier: z.object({
      plugins: z.array(z.string()).optional()
    }).optional(),
    biome: z.object({
      vcs: z.object({
        enabled: z.boolean(),
        clientKind: z.string()
      }).optional()
    }).optional(),
    remark: z.object({
      plugins: z.array(z.any())
    }).optional()
  }).optional(),
  ignore: z.array(z.string()).optional()
});

export class ConfigManager {
  private config: FormatterConfig;

  async load(configPath: string): Promise<void> {
    const yaml = await fs.readFile(configPath, 'utf-8');
    const parsed = load(yaml);
    this.config = FormatterConfigSchema.parse(parsed);
  }

  // Update config packages (development only)
  async updateConfigPackages(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Config package updates only allowed in development');
    }

    await this.updatePrettierConfig();
    await this.updateBiomeConfig();
    await this.updateRemarkConfig();
    // EditorConfig and VS Code settings are generated at runtime
  }

  private async updatePrettierConfig(): Promise<void> {
    const config = {
      ...this.extractPrettierDefaults(),
      overrides: []
    };

    // Add overrides for each pattern using prettier
    for (const pattern of this.config.patterns) {
      if (pattern.formatter === 'prettier') {
        config.overrides.push({
          files: pattern.globs,
          options: pattern.options
        });
      }
    }

    // Add tool-specific config
    if (this.config.tools?.prettier) {
      Object.assign(config, this.config.tools.prettier);
    }

    // Write to @outfitter/prettier-config
    const prettierConfigPath = path.join(__dirname, '../../prettier-config/index.js');
    await fs.writeFile(
      prettierConfigPath,
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );
  }

  private async updateBiomeConfig(): Promise<void> {
    const config = {
      $schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
      formatter: {
        enabled: true,
        indentStyle: this.config.defaults.indentStyle,
        indentWidth: this.config.defaults.indentWidth,
        lineWidth: this.config.defaults.lineWidth
      }
    };

    // Extract Biome-specific patterns
    for (const pattern of this.config.patterns) {
      if (pattern.formatter === 'biome' && pattern.options) {
        deepMerge(config, pattern.options);
      }
    }

    // Add tool-specific config
    if (this.config.tools?.biome) {
      deepMerge(config, this.config.tools.biome);
    }

    // Write to @outfitter/biome-config
    const biomeConfigPath = path.join(__dirname, '../../biome-config/biome.config.jsonc');
    await fs.writeFile(
      biomeConfigPath,
      `// Generated from formatting.config.yaml\n${JSON.stringify(config, null, 2)}`
    );
  }

  private async updateRemarkConfig(): Promise<void> {
    const config = {
      plugins: this.config.tools?.remark?.plugins || []
    };

    // Write to @outfitter/remark-config (new package)
    const remarkConfigPath = path.join(__dirname, '../../remark-config/index.js');
    await fs.writeFile(
      remarkConfigPath,
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );
  }

  // Runtime config generation (not saved to packages)
  generateEditorConfig(): string {
    const lines = [
      '# Generated from formatting.config.yaml',
      'root = true',
      '',
      '[*]',
      `end_of_line = ${this.config.defaults.endOfLine}`,
      `indent_style = ${this.config.defaults.indentStyle}`,
      `indent_size = ${this.config.defaults.indentWidth}`,
      `trim_trailing_whitespace = ${this.config.defaults.trimTrailingWhitespace}`,
      `insert_final_newline = ${this.config.defaults.insertFinalNewline}`,
      'charset = utf-8',
      ''
    ];

    // Add pattern-specific overrides
    for (const pattern of this.config.patterns) {
      if (pattern.formatter === 'remark') {
        lines.push('[*.{md,mdx,mdc}]');
        lines.push('trim_trailing_whitespace = false');
        lines.push('');
      }
    }

    // Common overrides
    lines.push('[Makefile]');
    lines.push('indent_style = tab');
    
    return lines.join('\n');
  }

  // Find which formatter to use for a file
  getFormatter(filePath: string): FormatterInfo {
    for (const pattern of this.config.patterns) {
      if (this.matchesPattern(filePath, pattern)) {
        return {
          tool: pattern.formatter,
          options: this.resolveOptions(pattern),
          codeBlocks: pattern.codeBlocks
        };
      }
    }
    return { tool: 'prettier', options: {} };
  }

  // Get formatter for a code block language
  getCodeBlockFormatter(language: string, filePattern?: FormatterInfo): string {
    // First check if the file pattern has a specific override
    if (filePattern?.codeBlocks?.[language]) {
      return filePattern.codeBlocks[language];
    }
    
    // Check global language mappings with wildcard support
    for (const [formatter, patterns] of Object.entries(this.config.languages)) {
      if (formatter === 'default') continue;
      
      for (const pattern of patterns as string[]) {
        if (pattern.includes('*')) {
          // Wildcard matching
          const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
          if (regex.test(language)) {
            return formatter;
          }
        } else if (pattern === language) {
          // Exact match
          return formatter;
        }
      }
    }
    
    // Fall back to default
    return this.config.languages.default || 'prettier';
  }
}
```

#### Remark Processor

```typescript
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import type { Code } from 'mdast';
import prettier from 'prettier';
import { Biome } from '@biomejs/js-api';

export class RemarkFormatter {
  private processor: any;
  private configManager: ConfigManager;
  private biome: Biome;
  private prettierConfig: any;
  private biomeConfig: any;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.loadConfigs();
    this.setupProcessor();
  }

  private async loadConfigs(): Promise<void> {
    // Import configs from packages
    this.prettierConfig = await import('@outfitter/prettier-config');
    this.biomeConfig = await import('@outfitter/biome-config');
  }

  private setupProcessor(): void {
    this.processor = remark();

    // Import remark config from package
    const remarkConfig = require('@outfitter/remark-config');
    
    // Add plugins from remark config
    for (const plugin of remarkConfig.plugins) {
      if (Array.isArray(plugin)) {
        this.processor.use(plugin[0], plugin[1]);
      } else {
        this.processor.use(plugin);
      }
    }

    // Add our code formatting plugin
    this.processor.use(this.createCodeFormatPlugin());
  }

  private createCodeFormatPlugin() {
    return () => {
      return async (tree: any, file: any) => {
        const promises: Promise<void>[] = [];

        visit(tree, 'code', (node: Code) => {
          if (!node.lang) return;

          const filePattern = this.configManager.getFormatter(file.path);
          const codeFormatter = this.configManager.getCodeBlockFormatter(
            node.lang, 
            filePattern
          );

          promises.push(this.formatCodeBlock(node, codeFormatter));
        });

        await Promise.all(promises);
      };
    };
  }

  private async formatCodeBlock(node: Code, formatter: string): Promise<void> {
    try {
      if (formatter === 'prettier') {
        const parser = this.getPrettierParser(node.lang);
        if (!parser) return;

        node.value = await prettier.format(node.value, {
          parser,
          ...this.configManager.getPrettierOptions()
        });
      } else if (formatter === 'biome') {
        const result = await this.biome.formatContent(node.value, {
          filePath: `temp.${node.lang}`
        });
        node.value = result.content;
      }
    } catch (error) {
      // Don't fail on malformed code
      console.warn(`Failed to format ${node.lang} code block:`, error);
    }
  }

  async format(content: string, filePath: string): Promise<string> {
    const result = await this.processor.process({
      value: content,
      path: filePath
    });
    return String(result);
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
  .name('outfitter-fmt')
  .description('Unified formatter for all file types')
  .version('1.0.0');

// Update config packages (dev only)
program
  .command('update-packages')
  .description('Update config packages from formatting.config.yaml (dev only)')
  .action(async () => {
    const configManager = new ConfigManager();
    await configManager.load('./formatting.config.yaml');
    await configManager.updateConfigPackages();
    console.log('Updated: @outfitter/prettier-config, @outfitter/biome-config, @outfitter/remark-config');
  });

// Generate runtime configs
program
  .command('generate')
  .description('Generate runtime configs (.editorconfig, .vscode/settings.json)')
  .action(async () => {
    const configManager = new ConfigManager();
    await configManager.load('./formatting.config.yaml');
    
    // Generate .editorconfig
    const editorConfig = configManager.generateEditorConfig();
    await fs.writeFile('.editorconfig', editorConfig);
    
    // Generate VS Code settings
    const vscodeSettings = configManager.generateVSCodeSettings();
    await fs.ensureDir('.vscode');
    await fs.writeFile('.vscode/settings.json', JSON.stringify(vscodeSettings, null, 2));
    
    console.log('Generated: .editorconfig, .vscode/settings.json');
  });

// Format files
program
  .command('format [files...]')
  .description('Format files')
  .option('--check', 'Check if files are formatted')
  .option('--write', 'Write formatted files')
  .action(async (files, options) => {
    const configManager = new ConfigManager();
    await configManager.load('./formatting.config.yaml');
    
    const formatter = new RemarkFormatter(configManager);
    
    for (const pattern of files) {
      const matchedFiles = await glob(pattern);
      for (const file of matchedFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const formatted = await formatter.format(content, file);
        
        if (options.check) {
          if (content !== formatted) {
            console.error(`${file} needs formatting`);
            process.exit(1);
          }
        } else if (options.write) {
          await fs.writeFile(file, formatted);
          console.log(`Formatted ${file}`);
        } else {
          console.log(formatted);
        }
      }
    }
  });

// Which formatter for a file?
program
  .command('which <file>')
  .description('Show which formatter would be used')
  .action(async (file) => {
    const configManager = new ConfigManager();
    await configManager.load('./formatting.config.yaml');
    
    const formatter = configManager.getFormatter(file);
    console.log(`${file}: ${formatter.tool}`);
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

### Package Dependencies

The `@outfitter/formatting` package would have:

```json
{
  "name": "@outfitter/formatting",
  "dependencies": {
    "@outfitter/prettier-config": "workspace:*",
    "@outfitter/biome-config": "workspace:*",
    "@outfitter/eslint-config": "workspace:*",
    "@outfitter/remark-config": "workspace:*",
    "remark": "^15.0.0",
    "remark-gfm": "^4.0.0",
    "remark-frontmatter": "^5.0.0",
    "unified": "^11.0.0",
    "unist-util-visit": "^5.0.0"
  },
  "peerDependencies": {
    "prettier": "^3.0.0",
    "@biomejs/js-api": "^0.7.0"
  },
  "devDependencies": {
    "js-yaml": "^4.1.0",
    "zod": "^3.0.0"
  }
}
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

1. **Single source of truth** - One YAML file configures everything
2. **No translation layer** - Options are passed directly to tools in their native format
3. **Intelligent markdown handling** - Remark for structure, specialized formatters for code blocks
4. **Two-tier resolution** - Global language mappings with pattern-specific overrides
5. **Tool compatibility** - Updates versioned configs that tools/IDEs understand
6. **Flexible matching** - Full glob pattern support
7. **DRY configuration** - Inherit options with `extends`
8. **Modular architecture** - Config packages can be used independently
9. **Version control** - Each config package has its own version and changelog

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Create `@outfitter/remark-config` package
- Update existing config packages to support generation
- Config schema and validation in formatting package
- Package update mechanism (dev mode)
- Basic remark pipeline with code formatting

### Phase 2: Features (Week 2)
- Import existing configs functionality
- Runtime config generation (.editorconfig, VS Code settings)
- Caching for performance
- Watch mode
- Package dependency management

### Phase 3: Polish (Week 3)
- VS Code extension
- Pre-commit hooks
- GitHub Action
- Documentation and migration guide

## Migration Strategy

```bash
# Import existing configs into formatting.config.yaml
outfitter-fmt import --prettier .prettierrc --biome biome.jsonc

# Validate new config
outfitter-fmt validate

# Update config packages (development only)
NODE_ENV=development outfitter-fmt update-packages

# Build and publish updated packages
pnpm build
pnpm changeset
pnpm publish

# In consuming projects, update dependencies
pnpm update @outfitter/prettier-config @outfitter/biome-config @outfitter/remark-config

# Generate runtime configs
outfitter-fmt generate

# Test formatting
outfitter-fmt format "**/*.md" --check
```

## Relationship to Rightdown

This formatter could:
1. **Replace Rightdown** - More comprehensive solution
2. **Power Rightdown v3** - Rightdown as a specialized wrapper
3. **Complement Rightdown** - Rightdown for markdown, this for everything else

Recommendation: Option 2 - Keep Rightdown's focused brand/CLI but use this as the engine.

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