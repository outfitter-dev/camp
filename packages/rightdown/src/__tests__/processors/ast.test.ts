import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Result } from '@outfitter/contracts';
import type { AppError } from '@outfitter/contracts';

// Types for the AST processor (to be implemented)
interface CodeBlock {
  lang: string | null;
  value: string;
  position: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  meta?: string | null;
}

interface ProcessedDocument {
  content: string;
  codeBlocks: Array<CodeBlock>;
}

// Mock implementation for tests (to be replaced with real implementation)
class AstProcessor {
  async extractCodeBlocks(markdown: string): Promise<Result<ProcessedDocument, AppError>> {
    // This will be implemented using remark/unified
    throw new Error('Not implemented');
  }

  async replaceCodeBlocks(
    markdown: string,
    replacements: Map<number, string>
  ): Promise<Result<string, AppError>> {
    // This will be implemented
    throw new Error('Not implemented');
  }

  normalizeLanguage(lang: string | null): string | null {
    // Normalize language identifiers (js -> javascript, ts -> typescript, etc.)
    if (!lang) return null;
    
    const aliases: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      yml: 'yaml',
      md: 'markdown',
    };
    
    return aliases[lang.toLowerCase()] || lang.toLowerCase();
  }
}

describe('AstProcessor', () => {
  const processor = new AstProcessor();
  const fixturesPath = join(__dirname, '../fixtures/markdown');

  describe('extractCodeBlocks', () => {
    it('should extract code blocks from basic markdown', async () => {
      const markdown = readFileSync(join(fixturesPath, 'basic.md'), 'utf-8');
      const result = await processor.extractCodeBlocks(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.value;
        expect(codeBlocks).toHaveLength(4);
        
        // Check first code block (JavaScript)
        expect(codeBlocks[0].lang).toBe('javascript');
        expect(codeBlocks[0].value).toContain('const greeting = "Hello, World!"');
        
        // Check second code block (TypeScript)
        expect(codeBlocks[1].lang).toBe('typescript');
        expect(codeBlocks[1].value).toContain('interface User');
        
        // Check third code block (JSON)
        expect(codeBlocks[2].lang).toBe('json');
        
        // Check fourth code block (no language)
        expect(codeBlocks[3].lang).toBe(null);
      }
    });

    it('should handle nested code blocks', async () => {
      const markdown = readFileSync(join(fixturesPath, 'nested-blocks.md'), 'utf-8');
      const result = await processor.extractCodeBlocks(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.value;
        // Should extract all code blocks, including nested ones
        expect(codeBlocks.length).toBeGreaterThan(0);
        
        // Check that markdown code blocks are properly identified
        const markdownBlocks = codeBlocks.filter(b => b.lang === 'markdown');
        expect(markdownBlocks.length).toBeGreaterThan(0);
      }
    });

    it('should extract position information for each code block', async () => {
      const markdown = `# Test

\`\`\`javascript
const x = 1;
\`\`\`

Some text

\`\`\`typescript
const y: number = 2;
\`\`\``;

      const result = await processor.extractCodeBlocks(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.value;
        expect(codeBlocks).toHaveLength(2);
        
        // Check position info exists
        expect(codeBlocks[0].position).toBeDefined();
        expect(codeBlocks[0].position.start.line).toBeLessThan(
          codeBlocks[0].position.end.line
        );
        
        // Second block should start after first
        expect(codeBlocks[1].position.start.line).toBeGreaterThan(
          codeBlocks[0].position.end.line
        );
      }
    });

    it('should handle tilde fence markers', async () => {
      const markdown = `# Test

~~~javascript
const x = 1;
~~~

~~~
no language
~~~`;

      const result = await processor.extractCodeBlocks(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.value;
        expect(codeBlocks).toHaveLength(2);
        expect(codeBlocks[0].lang).toBe('javascript');
        expect(codeBlocks[1].lang).toBe(null);
      }
    });

    it('should extract meta information from code blocks', async () => {
      const markdown = `\`\`\`javascript {highlight: [1, 3]}
const x = 1;
const y = 2;
const z = 3;
\`\`\``;

      const result = await processor.extractCodeBlocks(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.value;
        expect(codeBlocks[0].meta).toBe('{highlight: [1, 3]}');
      }
    });

    it('should handle edge cases from fixtures', async () => {
      const markdown = readFileSync(join(fixturesPath, 'edge-cases.md'), 'utf-8');
      const result = await processor.extractCodeBlocks(markdown);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const { codeBlocks } = result.value;
        expect(codeBlocks.length).toBeGreaterThan(0);
        
        // Should handle various edge cases without throwing
        // Specific assertions would depend on implementation
      }
    });
  });

  describe('replaceCodeBlocks', () => {
    it('should replace code blocks with formatted content', async () => {
      const markdown = `# Test

\`\`\`javascript
const x=1;
\`\`\`

Some text

\`\`\`typescript
const y:number=2;
\`\`\``;

      const replacements = new Map<number, string>([
        [0, 'const x = 1;'],
        [1, 'const y: number = 2;'],
      ]);

      const result = await processor.replaceCodeBlocks(markdown, replacements);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('const x = 1;');
        expect(result.value).toContain('const y: number = 2;');
        expect(result.value).toContain('Some text'); // Preserve non-code content
      }
    });

    it('should preserve code block fence style and language', async () => {
      const markdown = `~~~javascript
const x=1;
~~~`;

      const replacements = new Map<number, string>([
        [0, 'const x = 1;'],
      ]);

      const result = await processor.replaceCodeBlocks(markdown, replacements);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('~~~javascript');
        expect(result.value).toContain('~~~');
      }
    });

    it('should handle empty replacements map', async () => {
      const markdown = `# Test

\`\`\`javascript
const x = 1;
\`\`\``;

      const replacements = new Map<number, string>();
      const result = await processor.replaceCodeBlocks(markdown, replacements);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Should return original markdown unchanged
        expect(result.value).toBe(markdown);
      }
    });

    it('should handle partial replacements', async () => {
      const markdown = `\`\`\`javascript
const x=1;
\`\`\`

\`\`\`typescript
const y:number=2;
\`\`\``;

      // Only replace the first block
      const replacements = new Map<number, string>([
        [0, 'const x = 1;'],
      ]);

      const result = await processor.replaceCodeBlocks(markdown, replacements);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('const x = 1;');
        expect(result.value).toContain('const y:number=2;'); // Unchanged
      }
    });
  });

  describe('normalizeLanguage', () => {
    it('should normalize common language aliases', () => {
      expect(processor.normalizeLanguage('js')).toBe('javascript');
      expect(processor.normalizeLanguage('ts')).toBe('typescript');
      expect(processor.normalizeLanguage('jsx')).toBe('javascript');
      expect(processor.normalizeLanguage('tsx')).toBe('typescript');
      expect(processor.normalizeLanguage('yml')).toBe('yaml');
      expect(processor.normalizeLanguage('md')).toBe('markdown');
    });

    it('should handle null and undefined', () => {
      expect(processor.normalizeLanguage(null)).toBe(null);
    });

    it('should lowercase unknown languages', () => {
      expect(processor.normalizeLanguage('Python')).toBe('python');
      expect(processor.normalizeLanguage('RUST')).toBe('rust');
    });

    it('should preserve already normalized languages', () => {
      expect(processor.normalizeLanguage('javascript')).toBe('javascript');
      expect(processor.normalizeLanguage('typescript')).toBe('typescript');
      expect(processor.normalizeLanguage('python')).toBe('python');
    });
  });
});