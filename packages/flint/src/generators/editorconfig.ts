import { Result, success, failure, isFailure } from '@outfitter/contracts';
import * as pc from 'picocolors';
import { writeFile } from '../utils/file-system.js';

/**
 * Generates .editorconfig for cross-editor consistency
 */
export async function generateEditorconfigConfig(): Promise<Result<void, Error>> {
  try {
    console.log(pc.blue('→ Setting up EditorConfig...'));
    
    const config = `# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 80

# Markdown files
[*.md]
trim_trailing_whitespace = false
max_line_length = 120

# TypeScript/JavaScript
[*.{ts,tsx,js,jsx,mjs,cjs}]
indent_size = 2
max_line_length = 100

# JSON files
[*.{json,jsonc}]
indent_size = 2

# YAML files
[*.{yml,yaml}]
indent_size = 2

# Package files
[package.json]
indent_size = 2

# Makefiles
[Makefile]
indent_style = tab

# Python files (if any)
[*.py]
indent_size = 4
max_line_length = 88

# Go files (if any)
[*.go]
indent_style = tab
indent_size = 4

# Shell scripts
[*.sh]
end_of_line = lf

# Windows scripts
[*.{cmd,bat,ps1}]
end_of_line = crlf

# Git files
[.git*]
indent_size = 2

# Docker files
[{Dockerfile,docker-compose.yml}]
indent_size = 2
`;
    
    const writeResult = await writeFile('.editorconfig', config);
    if (isFailure(writeResult)) {
      return failure(writeResult.error);
    }
    
    console.log(pc.green('✓ EditorConfig configured successfully'));
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}