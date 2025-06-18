import type { CheckOptions, CheckResult } from '../check.js';
import type { FixOptions } from '../fix.js';
import { checkConsistentTerminology, fixConsistentTerminology } from './consistent-terminology.js';
import { checkCodeBlockLanguage } from './code-block-language.js';
import { checkFrontmatterRequired } from './frontmatter-required.js';
import { checkTocRequired } from './toc-required.js';
import { checkNoDeadLinks } from './no-dead-links.js';

export async function applyCustomRules(
  content: string,
  options: CheckOptions
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const { config } = options;
  
  // Consistent terminology
  if (config.rules?.['consistent-terminology'] && config.terminology) {
    results.push(...checkConsistentTerminology(content, config.terminology));
  }
  
  // Code block language
  if (config.rules?.['code-block-language']) {
    results.push(...checkCodeBlockLanguage(content));
  }
  
  // Frontmatter required
  if (config.rules?.['frontmatter-required']) {
    results.push(...checkFrontmatterRequired(content));
  }
  
  // TOC required
  if (config.rules?.['toc-required']) {
    const minHeadings = typeof config.rules['toc-required'] === 'object'
      ? config.rules['toc-required'].minHeadings
      : 5;
    results.push(...checkTocRequired(content, minHeadings));
  }
  
  // No dead links (async)
  if (config.rules?.['no-dead-links'] && options.filePath) {
    results.push(...await checkNoDeadLinks(content, options.filePath));
  }
  
  return results;
}

export async function fixCustomRules(
  content: string,
  options: FixOptions
): Promise<string> {
  let fixed = content;
  const { config } = options;
  
  // Fix consistent terminology
  if (config.rules?.['consistent-terminology'] && config.terminology) {
    fixed = fixConsistentTerminology(fixed, config.terminology);
  }
  
  // Other custom fixes can be added here
  
  return fixed;
}