import markdownlint from 'markdownlint';
import type { Config } from './config.js';
import { applyCustomRules } from './rules/index.js';

export interface CheckOptions {
  config: Config;
  filePath?: string;
}

export interface CheckResult {
  rule: string;
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

export async function checkMarkdown(
  content: string,
  options: CheckOptions
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  // Run standard markdownlint
  const markdownlintConfig: any = {};
  
  // Convert our rules to markdownlint format
  if (options.config.rules) {
    for (const [key, value] of Object.entries(options.config.rules)) {
      // Skip custom rules
      if (isCustomRule(key)) continue;
      
      // Handle line-length special case
      if (key === 'line-length' && value !== false) {
        markdownlintConfig.MD013 = { line_length: value };
      } else if (key.startsWith('MD')) {
        markdownlintConfig[key] = value;
      }
    }
  }
  
  // Run markdownlint
  const markdownlintResults = markdownlint.sync({
    strings: { content },
    config: markdownlintConfig
  });
  
  // Convert markdownlint results
  if (markdownlintResults['content']) {
    for (const error of markdownlintResults['content']) {
      results.push({
        rule: error.ruleNames[0] || error.ruleNames[1] || 'unknown',
        message: error.ruleDescription,
        line: error.lineNumber,
        severity: 'error'
      });
    }
  }
  
  // Apply custom rules
  const customResults = await applyCustomRules(content, options);
  results.push(...customResults);
  
  return results;
}

function isCustomRule(ruleName: string): boolean {
  const customRules = [
    'no-dead-links',
    'consistent-terminology',
    'frontmatter-required',
    'toc-required',
    'code-block-language'
  ];
  
  return customRules.includes(ruleName);
}