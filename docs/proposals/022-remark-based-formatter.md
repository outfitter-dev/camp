# Proposal: Remark-based Formatter with Unified Configuration

## Summary

Create `@outfitter/formatter` - a comprehensive formatting solution that uses remark as the foundation for markdown processing, delegates code block formatting to specialized tools (Prettier/Biome), and introduces a unified YAML configuration that generates all tool-specific configs.

## Motivation

Current challenges:
1. **Scattered configuration** - Multiple config files (.prettierrc, biome.json, .editorconfig, etc.)
2. **Limited markdown formatting** - Most tools handle code well but not markdown structure
3. **No unified approach** - Each tool has its own config format and conventions
4. **Poor code block handling** - Tools either format everything or nothing

This proposal addresses all these issues with:
- **Remark** as the AST-based markdown processor
- **Unified config** (`formatter.config.yaml`) as single source of truth
- **Smart routing** of code blocks to appropriate formatters
- **Config generation** for all downstream tools

## Architecture

### Overview

```
formatter.config.yaml
        ↓
   ConfigLoader
        ↓
 [Generates tool configs]
        ↓
 RemarkProcessor ← [Uses generated configs]
        ↓
 [Formats markdown + code blocks]
```

### Unified Configuration Schema

```yaml
# formatter.config.yaml
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
  javascript: biome
  typescript: biome
  jsx: biome
  tsx: biome
  json: biome
  jsonc: biome
  css: prettier
  scss: prettier
  html: prettier
  yaml: prettier
  markdown: prettier
  toml: dprint
  rust: dprint
  # Default fallback
  default: prettier

# Formatting patterns (array style, globs only)
patterns:
  - globs: ["**/*.md", "**/*.mdx", "**/*.mdc", "!**/CHANGELOG.md"]
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
  - globs: ["**/.prettierrc*", "**/.eslintrc*", "**/package.json"]
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
# Global language mapping says JavaScript uses Biome
languages:
  javascript: biome

# But this pattern overrides it for specific files
patterns:
  - globs: ["**/docs/**/*.md"]
    formatter: remark
    codeBlocks:
      javascript: prettier  # Override: use Prettier for JS in docs
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
  languages: z.record(z.string()),  // Language to formatter mapping
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

  // Generate tool-specific configs
  async generateConfigs(): Promise<void> {
    await this.generatePrettierConfig();
    await this.generateBiomeConfig();
    await this.generateEditorConfig();
    await this.generateVSCodeSettings();
  }

  private generatePrettierConfig(): PrettierConfig {
    const config: PrettierConfig = {
      ...this.extractPrettierDefaults(),
      overrides: []
    };

    // Add overrides for each pattern using prettier
    for (const pattern of this.config.patterns) {
      if (pattern.formatter === 'prettier') {
        config.overrides.push({
          files: pattern.globs,
          options: pattern.options  // Direct pass-through, no mapping
        });
      }
    }

    // Add tool-specific config
    if (this.config.tools?.prettier) {
      Object.assign(config, this.config.tools.prettier);
    }

    return config;
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
    
    // Fall back to global language mapping
    return this.config.languages[language] || this.config.languages.default || 'prettier';
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

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.setupProcessor();
  }

  private setupProcessor(): void {
    this.processor = remark();

    // Add plugins from config
    const remarkPlugins = this.configManager.config.tools?.remark?.plugins || [];
    for (const plugin of remarkPlugins) {
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
import { ConfigManager, RemarkFormatter } from '@outfitter/formatter';

const program = new Command();

program
  .name('outfitter-fmt')
  .description('Unified formatter for all file types')
  .version('1.0.0');

// Generate tool configs
program
  .command('generate')
  .description('Generate tool-specific configs from formatter.config.yaml')
  .action(async () => {
    const configManager = new ConfigManager();
    await configManager.load('./formatter.config.yaml');
    await configManager.generateConfigs();
    console.log('Generated: .prettierrc, biome.json, .editorconfig');
  });

// Format files
program
  .command('format [files...]')
  .description('Format files')
  .option('--check', 'Check if files are formatted')
  .option('--write', 'Write formatted files')
  .action(async (files, options) => {
    const configManager = new ConfigManager();
    await configManager.load('./formatter.config.yaml');
    
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
    await configManager.load('./formatter.config.yaml');
    
    const formatter = configManager.getFormatter(file);
    console.log(`${file}: ${formatter.tool}`);
  });

program.parse();
```

## Generated Configurations

The system generates appropriate configs for each tool:

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
      "files": ["**/.prettierrc*", "**/.eslintrc*", "**/package.json"],
      "options": {
        "parser": "json5",
        "trailingComma": "none"
      }
    }
  ]
}
```

### biome.json
```json
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

### .vscode/settings.json
```json
{
  "[markdown]": {
    "editor.defaultFormatter": "outfitter.formatter"
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
5. **Tool compatibility** - Generates configs that existing tools/IDEs understand
6. **Flexible matching** - Full glob pattern support
7. **DRY configuration** - Inherit options with `extends`
8. **Migration path** - Can import existing configs

## Implementation Phases

### Phase 1: Core (Week 1)
- Config schema and validation
- Config generators for Prettier, Biome, EditorConfig
- Basic remark pipeline with code formatting

### Phase 2: Features (Week 2)
- Import existing configs functionality
- VS Code settings generation
- Caching for performance
- Watch mode

### Phase 3: Polish (Week 3)
- VS Code extension
- Pre-commit hooks
- GitHub Action
- Documentation

## Migration Strategy

```bash
# Import existing configs
outfitter-fmt import --prettier .prettierrc --biome biome.json

# Validate new config
outfitter-fmt validate

# Generate tool configs
outfitter-fmt generate

# Test formatting
outfitter-fmt format "**/*.md" --check

# Switch over
rm .prettierrc biome.json .editorconfig
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

1. Validate config schema with team
2. Prototype remark code formatting plugin
3. Build config generators
4. Create migration tooling
5. Test with real projects

---

**Author**: Matt Galligan  
**Date**: 2024-12-23  
**Status**: Draft  
**Related**: Rightdown v2, Config Sync proposals