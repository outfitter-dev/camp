# Prettier Configuration Backup

This file contains a comprehensive backup of all Prettier-related configurations and files in the monorepo.

## Root Configuration Files

### /Users/mg/Developer/outfitter/monorepo/prettier.config.js

```javascript
/** @type {import("prettier").Config} */
module.exports = require('@outfitter/prettier-config');
```

### /Users/mg/Developer/outfitter/monorepo/prettier.config.ts

```typescript
import type { Config } from 'prettier';

const config: Config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'avoid',
  proseWrap: 'preserve', // Don't wrap prose in markdown
};

export default config;
```

### /Users/mg/Developer/outfitter/monorepo/.prettierignore

```
# Ignore files handled by Biome
*.js
*.jsx
*.ts
*.tsx
*.json
*.jsonc

# Standard ignores
/dist
/build
/.next
/coverage
/node_modules
.pnp.cjs
.pnp.loader.mjs 
```

### /Users/mg/Developer/outfitter/monorepo/package.json (prettier-related sections)

```json
{
  "scripts": {
    "format": "biome format . && prettier --check . --ignore-path .prettierignore",
    "format:fix": "biome format . --write && prettier --write . --ignore-path .prettierignore"
  },
  "devDependencies": {
    "prettier": "^3.5.3"
  }
}
```

## Prettier Config Package

### /Users/mg/Developer/outfitter/monorepo/packages/prettier-config/package.json

```json
{
  "name": "@outfitter/prettier-config",
  "version": "0.1.0",
  "private": true,
  "description": "Shared Prettier configuration for the Outfitter monorepo.",
  "main": "index.js",
  "exports": {
    ".": "./index.js"
  },
  "files": [
    "index.js"
  ],
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "prettier",
    "config",
    "outfitter",
    "format"
  ],
  "author": "Outfitter",
  "license": "ISC"
}
```

### /Users/mg/Developer/outfitter/monorepo/packages/prettier-config/index.js

```javascript
/** @type {import("prettier").Config} */
const config = {
  printWidth: 80, // Align with proposal standard
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
};

/**
 * Generate a Prettier configuration based on preset config
 * @param {object} presetConfig - Configuration from @outfitter/formatting preset
 * @returns {import("prettier").Config} Prettier configuration
 */
function generate(presetConfig = {}) {
  const base = { ...config };

  if (presetConfig.indentation) {
    base.tabWidth = presetConfig.indentation.width || base.tabWidth;
    base.useTabs = presetConfig.indentation.style === 'tab';
  }

  if (presetConfig.lineWidth) {
    base.printWidth = presetConfig.lineWidth;
  }

  if (presetConfig.quotes) {
    base.singleQuote = presetConfig.quotes.style === 'single';
    base.jsxSingleQuote = presetConfig.quotes.jsx === 'single';
  }

  if (presetConfig.semicolons !== undefined) {
    base.semi = presetConfig.semicolons === 'always' || presetConfig.semicolons === true;
  }

  if (presetConfig.trailingComma) {
    base.trailingComma = presetConfig.trailingComma;
  }

  if (presetConfig.bracketSpacing !== undefined) {
    base.bracketSpacing = presetConfig.bracketSpacing;
  }

  if (presetConfig.arrowParens) {
    base.arrowParens = presetConfig.arrowParens === 'asNeeded' ? 'avoid' : presetConfig.arrowParens;
  }

  if (presetConfig.endOfLine) {
    base.endOfLine = presetConfig.endOfLine;
  }

  return base;
}

// Export both the static config and generator function
module.exports = config;
module.exports.generate = generate;
```

## Flint Package (Prettier Generator)

### /Users/mg/Developer/outfitter/monorepo/packages/flint/package.json (prettier-related sections)

```json
{
  "name": "@outfitter/flint",
  "keywords": [
    "prettier"
  ],
  "devDependencies": {
    "prettier": "^3.3.3"
  }
}
```

### /Users/mg/Developer/outfitter/monorepo/packages/flint/configs/base/prettier.json

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "endOfLine": "lf",
  "arrowParens": "always",
  "proseWrap": "preserve",
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
}
```

### /Users/mg/Developer/outfitter/monorepo/packages/flint/src/generators/prettier.ts

```typescript
import { Result, success, failure, isFailure } from '@outfitter/contracts';
import * as pc from 'picocolors';
import { writeJSON, writeFile } from '../utils/file-system.js';

/**
 * Generates Prettier configuration for non-JS/TS files
 * Biome handles JS/TS formatting, so Prettier only handles:
 * - Markdown files (.md, .mdx)
 * - CSS files (.css, .scss, .less)
 * - JSON files (.json)
 * - YAML files (.yaml, .yml)
 * - HTML files (.html)
 */
export async function generatePrettierConfig(): Promise<Result<void, Error>> {
  try {
    console.log(pc.blue('→ Setting up Prettier for non-JS/TS files...'));
    
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
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
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
      "*.mjs",
      "*.cjs",
      "",
      "# Generated files",
      "*.min.js",
      "*.min.css",
      "",
      "# IDE",
      ".vscode/",
      ".idea/"
    ];
    
    // Write .prettierrc.json
    const configResult = await writeJSON('.prettierrc.json', config);
    if (isFailure(configResult)) {
      return failure(configResult.error);
    }
    
    // Write .prettierignore
    const ignoreResult = await writeFile('.prettierignore', ignore.join('\n'));
    if (isFailure(ignoreResult)) {
      return failure(ignoreResult.error);
    }
    
    console.log(pc.green('✓ Prettier configured successfully'));
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
```

### /Users/mg/Developer/outfitter/monorepo/packages/flint/src/generators/__tests__/prettier.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePrettierConfig } from '../prettier.js';
import { isSuccess, isFailure } from '@outfitter/contracts';
import * as fileSystem from '../../utils/file-system.js';

vi.mock('../../utils/file-system.js');

describe('generatePrettierConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate prettier config with correct settings', async () => {
    let writtenConfig: any;
    vi.mocked(fileSystem.writeJSON).mockImplementation(async (_path, config) => {
      writtenConfig = config;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    vi.mocked(fileSystem.writeFile).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);
    
    const result = await generatePrettierConfig();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenConfig).toEqual({
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
      endOfLine: 'lf',
      arrowParens: 'always',
      proseWrap: 'preserve',
      overrides: [
        {
          files: '*.md',
          options: {
            proseWrap: 'preserve'
          }
        },
        {
          files: '*.json',
          options: {
            singleQuote: false
          }
        }
      ]
    });
  });

  it('should generate prettierignore file', async () => {
    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);
    
    let writtenIgnore: string;
    vi.mocked(fileSystem.writeFile).mockImplementation(async (_path, content) => {
      writtenIgnore = content;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    const result = await generatePrettierConfig();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenIgnore!).toContain('*.js');
    expect(writtenIgnore!).toContain('*.jsx');
    expect(writtenIgnore!).toContain('*.ts');
    expect(writtenIgnore!).toContain('*.tsx');
    expect(writtenIgnore!).toContain('node_modules/');
    expect(writtenIgnore!).toContain('dist/');
  });

  it('should handle write errors', async () => {
    const error = new Error('Write failed');
    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: false,
      error,
    } as any);
    
    const result = await generatePrettierConfig();
    
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe(error);
    }
  });
});
```

## Summary

This backup includes all Prettier-related configurations found in the monorepo:

1. **Root Configuration**:
   - `prettier.config.js` - References the shared config package
   - `prettier.config.ts` - Standalone TypeScript config with different settings
   - `.prettierignore` - Ignores JS/TS files (handled by Biome)

2. **Shared Config Package** (`@outfitter/prettier-config`):
   - Provides base configuration with a `generate()` function for dynamic config
   - Used by the root `prettier.config.js`

3. **Flint Package**:
   - Contains a Prettier generator for creating project configs
   - Includes a base config template in `configs/base/prettier.json`
   - Has tests for the generator functionality

The monorepo uses a hybrid approach where Biome handles JS/TS/JSON formatting while Prettier handles other file types like Markdown, CSS, YAML, and HTML.