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