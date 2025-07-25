import { Result, success, failure, isFailure } from '@outfitter/contracts';
import * as pc from 'picocolors';
import { writeFile } from '../utils/file-system.js';
import * as yaml from 'yaml';

/**
 * Generates Lefthook configuration for Git hooks
 * Sets up pre-commit formatting and linting
 */
export async function generateLefthookConfig(): Promise<Result<void, Error>> {
  try {
    console.log(pc.blue('→ Setting up Lefthook for Git hooks...'));
    
    const config = {
      'pre-commit': {
        parallel: true,
        commands: {
          // Format JavaScript/TypeScript with Biome
          'biome-format': {
            glob: '*.{js,jsx,ts,tsx,mjs,cjs}',
            run: 'bunx @biomejs/biome format --write {staged_files} && git add {staged_files}'
          },
          
          // Format Markdown with Prettier
          'prettier-md': {
            glob: '*.{md,mdx}',
            run: 'bunx prettier --write {staged_files} && git add {staged_files}'
          },
          
          // Format CSS with Prettier
          'prettier-css': {
            glob: '*.{css,scss,less}',
            run: 'bunx prettier --write {staged_files} && git add {staged_files}'
          },
          
          // Format other files with Prettier
          'prettier-other': {
            glob: '*.{json,yaml,yml,html}',
            run: 'bunx prettier --write {staged_files} && git add {staged_files}'
          },
          
          // Lint JavaScript/TypeScript with Oxlint
          'oxlint': {
            glob: '*.{js,jsx,ts,tsx,mjs,cjs}',
            run: 'bunx oxlint {staged_files}'
          },
          
          // Lint Markdown
          'markdownlint': {
            glob: '*.md',
            run: 'bunx markdownlint-cli2 {staged_files}'
          },
          
          // Lint CSS
          'stylelint': {
            glob: '*.{css,scss,less}',
            run: 'bunx stylelint {staged_files}'
          }
        }
      },
      
      'commit-msg': {
        commands: {
          'commitlint': {
            run: 'bunx commitlint --edit {1}'
          }
        }
      },
      
      'pre-push': {
        commands: {
          'test': {
            run: 'bun test --run',
            skip: [
              { ref: 'refs/heads/wip' },
              { ref: 'refs/heads/draft' }
            ]
          },
          'type-check': {
            run: 'bun run type-check',
            skip: [
              { ref: 'refs/heads/wip' },
              { ref: 'refs/heads/draft' }
            ]
          }
        }
      }
    };
    
    // Write lefthook.yml
    const yamlContent = yaml.stringify(config, {
      lineWidth: 120,
      minContentWidth: 0
    });
    
    // Add header comment
    const fullContent = `# Lefthook configuration
# https://github.com/evilmartians/lefthook

${yamlContent}`;
    
    const writeResult = await writeFile('lefthook.yml', fullContent);
    if (isFailure(writeResult)) {
      return failure(writeResult.error);
    }
    
    console.log(pc.green('✓ Lefthook configured successfully'));
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}