import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import type { Root, Code } from '../types/mdast.js';
import { Result, success, failure, makeError, type AppError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from '../core/errors.js';

export interface CodeBlock {
  lang: string | null;
  value: string;
  position: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  meta?: string | null;
  fence?: '```' | '~~~';
}

export interface ProcessedDocument {
  content: string;
  codeBlocks: Array<CodeBlock>;
}

export class AstProcessor {
  private processor = remark();

  /**
   * Extract all code blocks from a markdown document
   */
  async extractCodeBlocks(markdown: string): Promise<Result<ProcessedDocument, AppError>> {
    try {
      const codeBlocks: Array<CodeBlock> = [];

      // Parse the markdown into an AST
      const tree = this.processor.parse(markdown);

      // Visit all code nodes
      visit(tree, 'code', (node: Code) => {
        if (!node.position) {
          return;
        }

        codeBlocks.push({
          lang: this.normalizeLanguage(node.lang || null),
          value: node.value,
          position: {
            start: {
              line: node.position.start.line,
              column: node.position.start.column,
              offset: node.position.start.offset || 0,
            },
            end: {
              line: node.position.end.line,
              column: node.position.end.column,
              offset: node.position.end.offset || 0,
            },
          },
          meta: node.meta || null,
        });
      });

      return success({
        content: markdown,
        codeBlocks,
      });
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.PARSE_ERROR,
          'Failed to parse markdown document',
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Replace code blocks in markdown with formatted versions
   */
  async replaceCodeBlocks(
    markdown: string,
    replacements: Map<number, string>,
  ): Promise<Result<string, AppError>> {
    try {
      // If no replacements, return original
      if (replacements.size === 0) {
        return success(markdown);
      }

      // For accurate replacement, we need to work with the original text
      // and preserve fence styles. Let's extract blocks with their positions
      const extractResult = await this.extractCodeBlocks(markdown);
      if (!extractResult.success) {
        return extractResult;
      }

      const { codeBlocks } = extractResult.data;

      // Sort replacements by position (reverse order to maintain offsets)
      const sortedBlocks = codeBlocks
        .map((block, index) => ({ block, index, replacement: replacements.get(index) }))
        .filter((item) => item.replacement !== undefined)
        .sort((a, b) => b.block.position.start.offset - a.block.position.start.offset);

      // Apply replacements to original markdown
      let result = markdown;

      for (const { block, replacement } of sortedBlocks) {
        if (replacement === undefined) continue;

        // Find the actual fence in the original text
        const startOffset = block.position.start.offset;
        const endOffset = block.position.end.offset;
        const blockText = markdown.substring(startOffset, endOffset);

        // Extract fence info from original block
        const fenceMatch = blockText.match(/^(`{3,}|~{3,})([^\n]*)\n/);
        if (!fenceMatch) continue;

        const fence = fenceMatch[1];
        const langAndMeta = fenceMatch[2].trim();

        // Reconstruct the block with same fence style
        const newBlock = `${fence}${langAndMeta}\n${replacement}\n${fence}`;

        // Replace in result string
        result = result.substring(0, startOffset) + newBlock + result.substring(endOffset);
      }

      return success(result);
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.PARSE_ERROR,
          'Failed to replace code blocks',
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Normalize language identifiers
   */
  normalizeLanguage(lang: string | null): string | null {
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
