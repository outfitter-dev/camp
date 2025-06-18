import type { CheckResult } from '../check.js';

export function checkCodeBlockLanguage(content: string): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for code block without language
    if (line.match(/^```\s*$/)) {
      results.push({
        rule: 'code-block-language',
        message: 'Code blocks should specify a language',
        line: i + 1,
        column: 1,
        severity: 'warning'
      });
    }
  }
  
  return results;
}