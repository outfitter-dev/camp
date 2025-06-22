import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isSuccess, isFailure } from '@outfitter/contracts';
import type { Result, AppError } from '@outfitter/contracts';
import type { IFormatter } from '../formatters/base.test.js';
import type { RightdownConfigV2 } from './config-reader.test.js';

// Types for the orchestrator
interface OrchestratorOptions {
  config: RightdownConfigV2;
  formatters: Map<string, IFormatter>;
}

interface FormatResult {
  content: string;
  stats: {
    totalBlocks: number;
    formattedBlocks: number;
    skippedBlocks: number;
    errors: number;
    duration: number;
  };
}

// Mock orchestrator implementation (to be implemented)
class Orchestrator {
  constructor(private options: OrchestratorOptions) {}

  async format(markdown: string): Promise<Result<FormatResult, AppError>> {
    // Will be implemented
    throw new Error('Not implemented');
  }

  async formatFile(path: string): Promise<Result<FormatResult, AppError>> {
    // Will be implemented
    throw new Error('Not implemented');
  }

  getFormatter(language: string): IFormatter | null {
    // Will be implemented
    throw new Error('Not implemented');
  }
}

// Mock formatters for testing
class MockFormatter implements IFormatter {
  constructor(
    public readonly name: string,
    private supportedLanguages: Array<string>
  ) {}

  async isAvailable() {
    return { success: true as const, data: true };
  }

  async getVersion() {
    return { success: true as const, data: '1.0.0' };
  }

  async format(code: string, language: string) {
    if (!this.supportedLanguages.includes(language)) {
      return {
        success: false as const,
        error: {
          code: 'FORMATTER_FAILED',
          message: `Unsupported language: ${language}`,
        },
      };
    }
    
    // Simple mock formatting: add spaces around operators
    const formatted = code.replace(/=/g, ' = ').replace(/\s+/g, ' ').trim();
    return { success: true as const, data: formatted };
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

describe('Orchestrator', () => {
  const fixturesPath = join(__dirname, '../fixtures/markdown');
  let orchestrator: Orchestrator;
  let prettierFormatter: MockFormatter;
  let biomeFormatter: MockFormatter;

  beforeEach(() => {
    // Create mock formatters
    prettierFormatter = new MockFormatter('prettier', [
      'html', 'css', 'yaml', 'markdown'
    ]);
    biomeFormatter = new MockFormatter('biome', [
      'javascript', 'typescript', 'json', 'jsonc'
    ]);

    const config: RightdownConfigV2 = {
      version: 2,
      preset: 'standard',
      formatters: {
        default: 'prettier',
        languages: {
          javascript: 'biome',
          typescript: 'biome',
          json: 'biome',
          jsonc: 'biome',
        },
      },
    };

    const formatters = new Map<string, IFormatter>([
      ['prettier', prettierFormatter],
      ['biome', biomeFormatter],
    ]);

    orchestrator = new Orchestrator({ config, formatters });
  });

  describe('getFormatter', () => {
    it('should return correct formatter for language', () => {
      expect(orchestrator.getFormatter('javascript')?.name).toBe('biome');
      expect(orchestrator.getFormatter('typescript')?.name).toBe('biome');
      expect(orchestrator.getFormatter('json')?.name).toBe('biome');
      expect(orchestrator.getFormatter('css')?.name).toBe('prettier');
      expect(orchestrator.getFormatter('html')?.name).toBe('prettier');
    });

    it('should return default formatter for unknown language', () => {
      expect(orchestrator.getFormatter('python')?.name).toBe('prettier');
      expect(orchestrator.getFormatter('rust')?.name).toBe('prettier');
    });

    it('should return null for "none" formatter', () => {
      const config: RightdownConfigV2 = {
        version: 2,
        formatters: {
          languages: {
            rust: 'none',
          },
        },
      };
      
      const orch = new Orchestrator({
        config,
        formatters: new Map(),
      });
      
      expect(orch.getFormatter('rust')).toBe(null);
    });

    it('should handle missing formatter gracefully', () => {
      const config: RightdownConfigV2 = {
        version: 2,
        formatters: {
          default: 'eslint', // Not in formatters map
        },
      };
      
      const orch = new Orchestrator({
        config,
        formatters: new Map(),
      });
      
      expect(orch.getFormatter('javascript')).toBe(null);
    });
  });

  describe('format', () => {
    it('should format basic markdown with code blocks', async () => {
      const markdown = readFileSync(join(fixturesPath, 'basic.md'), 'utf-8');
      const result = await orchestrator.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content, stats } = result.data;
        
        // Should preserve markdown structure
        expect(content).toContain('# Basic Markdown Test');
        expect(content).toContain('## JavaScript Example');
        
        // Should format code blocks
        expect(content).toContain('const greeting = \'Hello, World!\';');
        expect(content).toContain('const user: User = {');
        
        // Check stats
        expect(stats.totalBlocks).toBe(4);
        expect(stats.formattedBlocks).toBeGreaterThan(0);
        expect(stats.errors).toBe(0);
      }
    });

    it('should handle mixed languages', async () => {
      const markdown = readFileSync(join(fixturesPath, 'mixed-languages.md'), 'utf-8');
      const result = await orchestrator.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.totalBlocks).toBeGreaterThan(10);
        expect(stats.errors).toBe(0);
      }
    });

    it('should skip blocks with "none" formatter', async () => {
      const markdown = `
\`\`\`rust
fn main() {
    println!("Hello");
}
\`\`\`
`;

      const config: RightdownConfigV2 = {
        version: 2,
        formatters: {
          languages: {
            rust: 'none',
          },
        },
      };

      const orch = new Orchestrator({
        config,
        formatters: new Map(),
      });

      const result = await orch.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content, stats } = result.data;
        expect(content).toContain('fn main()'); // Unchanged
        expect(stats.skippedBlocks).toBe(1);
      }
    });

    it('should handle formatter errors gracefully', async () => {
      const markdown = `
\`\`\`javascript
const x = { // Invalid syntax
\`\`\`
`;

      const result = await orchestrator.format(markdown);
      
      expect(isSuccess(result)).toBe(true); // Overall success
      if (result.success) {
        const { stats } = result.data;
        expect(stats.errors).toBe(1);
        expect(stats.formattedBlocks).toBe(0);
      }
    });

    it('should handle nested code blocks', async () => {
      const markdown = readFileSync(join(fixturesPath, 'nested-blocks.md'), 'utf-8');
      const result = await orchestrator.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content } = result.data;
        // Should preserve nesting structure
        expect(content).toContain('````markdown');
        expect(content).toContain('```javascript');
      }
    });

    it('should respect formatter options', async () => {
      const config: RightdownConfigV2 = {
        version: 2,
        formatters: {
          default: 'prettier',
        },
        formatterOptions: {
          prettier: {
            semi: false,
            singleQuote: true,
          },
        },
      };

      const orch = new Orchestrator({
        config,
        formatters: new Map([['prettier', prettierFormatter]]),
      });

      const markdown = `
\`\`\`javascript
const x = "test";
\`\`\`
`;

      const result = await orch.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content } = result.data;
        // Mock formatter doesn't actually respect options, but real one will
        expect(content).toContain('const x');
      }
    });
  });

  describe('formatFile', () => {
    it('should format file from disk', async () => {
      const filePath = join(fixturesPath, 'basic.md');
      const result = await orchestrator.formatFile(filePath);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.totalBlocks).toBe(4);
      }
    });

    it('should handle non-existent files', async () => {
      const result = await orchestrator.formatFile('/does/not/exist.md');
      
      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_NOT_FOUND');
      }
    });
  });

  describe('performance', () => {
    it('should track formatting duration', async () => {
      const markdown = readFileSync(join(fixturesPath, 'basic.md'), 'utf-8');
      const result = await orchestrator.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.duration).toBeGreaterThan(0);
        expect(stats.duration).toBeLessThan(1000); // Should be fast
      }
    });

    it('should handle large files efficiently', async () => {
      const markdown = readFileSync(join(fixturesPath, 'large-file.md'), 'utf-8');
      const start = Date.now();
      const result = await orchestrator.format(markdown);
      const duration = Date.now() - start;
      
      expect(isSuccess(result)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('markdownlint integration', () => {
    it('should run markdownlint before formatting code blocks', async () => {
      const markdown = `# Test

No blank line before list
- item 1
- item 2

\`\`\`javascript
const x=1;
\`\`\`
`;

      const result = await orchestrator.format(markdown);
      
      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content } = result.data;
        // Should add blank line before list (markdownlint rule)
        expect(content).toContain('# Test\n\n');
        expect(content).toContain('\n- item 1');
        // Should format code block
        expect(content).toContain('const x = 1;');
      }
    });
  });
});