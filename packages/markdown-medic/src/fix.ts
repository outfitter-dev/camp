import type { Config } from './config.js';
import { fixCustomRules } from './rules/index.js';

export interface FixOptions {
  config: Config;
  filePath?: string;
}

export async function fixMarkdown(
  content: string,
  options: FixOptions
): Promise<string> {
  let fixed = content;
  
  // Apply standard fixes
  fixed = applyStandardFixes(fixed, options.config);
  
  // Apply custom fixes
  fixed = await fixCustomRules(fixed, options);
  
  return fixed;
}

function applyStandardFixes(content: string, config: Config): string {
  let fixed = content;
  
  // Fix trailing spaces
  if (config.rules?.['MD009'] !== false) {
    fixed = fixed.replace(/ +$/gm, '');
  }
  
  // Fix hard tabs
  if (config.rules?.['MD010'] !== false) {
    fixed = fixed.replace(/\t/g, '  ');
  }
  
  // Fix multiple blank lines
  if (config.rules?.['MD012'] !== false) {
    const max = typeof config.rules?.['MD012'] === 'object' 
      ? config.rules['MD012'].maximum || 1
      : 1;
    const regex = new RegExp(`\\n{${max + 2},}`, 'g');
    fixed = fixed.replace(regex, '\n'.repeat(max + 1));
  }
  
  // Fix list marker spacing
  if (config.rules?.['list-marker-space'] !== false) {
    // Fix unordered lists
    fixed = fixed.replace(/^(\s*)([-*+])(\S)/gm, '$1$2 $3');
    // Fix ordered lists
    fixed = fixed.replace(/^(\s*)(\d+\.)(\S)/gm, '$1$2 $3');
  }
  
  // Fix heading style
  if (config.rules?.['heading-style'] === 'atx') {
    // Convert setext to atx
    fixed = fixed.replace(/^(.+)\n={3,}$/gm, '# $1');
    fixed = fixed.replace(/^(.+)\n-{3,}$/gm, '## $1');
  }
  
  // Fix trailing punctuation in headings
  if (config.rules?.['no-trailing-punctuation'] !== false) {
    fixed = fixed.replace(/^(#{1,6} .+)[.,:;!?]$/gm, '$1');
  }
  
  // Fix bare URLs
  if (config.rules?.['MD034'] !== false) {
    // Simple URL detection and wrapping
    fixed = fixed.replace(
      /(?<!\()https?:\/\/[^\s<>[\]`*]+(?!\))/g,
      '<$&>'
    );
  }
  
  // Ensure file ends with newline
  if (!fixed.endsWith('\n')) {
    fixed += '\n';
  }
  
  return fixed;
}