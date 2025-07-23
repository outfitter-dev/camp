import { Result, success, failure, isFailure } from '@outfitter/contracts';
import * as pc from 'picocolors';
import { writeFile } from '../utils/file-system.js';
import * as yaml from 'yaml';

/**
 * Generates markdownlint-cli2 configuration
 * Provides sensible defaults for Markdown linting
 */
export async function generateMarkdownlintConfig(): Promise<Result<void, Error>> {
  try {
    console.log(pc.blue('→ Setting up markdownlint-cli2...'));
    
    const config = {
      config: {
        "default": true,
        "MD013": { 
          "line_length": 120,
          "code_blocks": false,
          "tables": false
        },
        "MD033": false,  // Allow inline HTML
        "MD041": false,  // First line doesn't need to be a heading
        "no-trailing-spaces": false,
        "MD024": { "siblings_only": true }, // Allow duplicate headings in different sections
        "MD026": false, // Allow trailing punctuation in headings
        "MD028": false, // Allow blank lines inside blockquotes
        "MD036": false  // Allow emphasis used instead of headings
      },
      globs: ["**/*.md", "**/*.mdx"],
      ignores: [
        "**/node_modules",
        "**/dist",
        "**/build",
        "**/coverage",
        "**/.next",
        "**/out",
        "**/vendor",
        "**/*.min.md"
      ]
    };
    
    // Write .markdownlint-cli2.yaml
    const yamlContent = yaml.stringify(config);
    const writeResult = await writeFile('.markdownlint-cli2.yaml', yamlContent);
    if (isFailure(writeResult)) {
      return failure(writeResult.error);
    }
    
    console.log(pc.green('✓ markdownlint-cli2 configured successfully'));
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}