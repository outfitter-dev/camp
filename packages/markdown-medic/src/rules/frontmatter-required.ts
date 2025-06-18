import type { CheckResult } from '../check.js';

export function checkFrontmatterRequired(content: string): CheckResult[] {
  const results: CheckResult[] = [];
  
  // Check if content starts with frontmatter
  if (!content.trim().startsWith('---')) {
    results.push({
      rule: 'frontmatter-required',
      message: 'Document should start with YAML frontmatter',
      line: 1,
      column: 1,
      severity: 'warning'
    });
  } else {
    // Check if frontmatter is properly closed
    const lines = content.split('\n');
    let foundClosing = false;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        foundClosing = true;
        break;
      }
    }
    
    if (!foundClosing) {
      results.push({
        rule: 'frontmatter-required',
        message: 'Frontmatter is not properly closed with ---',
        line: 1,
        column: 1,
        severity: 'error'
      });
    }
  }
  
  return results;
}