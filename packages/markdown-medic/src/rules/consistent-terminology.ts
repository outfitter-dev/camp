import type { CheckResult } from '../check.js';

export interface TerminologyRule {
  incorrect: string;
  correct: string;
}

export function checkConsistentTerminology(
  content: string,
  terminology: TerminologyRule[]
): CheckResult[] {
  const results: CheckResult[] = [];
  const lines = content.split('\n');
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNumber = lineIndex + 1;
    
    for (const term of terminology) {
      // Create case-insensitive regex for the incorrect term
      const regex = new RegExp(`\\b${escapeRegex(term.incorrect)}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        // Check if it's already the correct term (case-sensitive)
        const matchedText = line.substring(match.index, match.index + match[0].length);
        if (matchedText === term.correct) continue;
        
        results.push({
          rule: 'consistent-terminology',
          message: `Use "${term.correct}" instead of "${matchedText}"`,
          line: lineNumber,
          column: match.index + 1,
          severity: 'warning'
        });
      }
    }
  }
  
  return results;
}

export function fixConsistentTerminology(
  content: string,
  terminology: TerminologyRule[]
): string {
  let fixed = content;
  
  for (const term of terminology) {
    // Create case-insensitive regex for the incorrect term
    const regex = new RegExp(`\\b${escapeRegex(term.incorrect)}\\b`, 'gi');
    
    fixed = fixed.replace(regex, (match) => {
      // Preserve the original case pattern if possible
      if (match === match.toUpperCase()) {
        return term.correct.toUpperCase();
      } else if (match[0] === match[0].toUpperCase()) {
        return term.correct[0].toUpperCase() + term.correct.slice(1).toLowerCase();
      } else {
        return term.correct;
      }
    });
  }
  
  return fixed;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}