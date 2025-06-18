import type { CheckResult } from '../check.js';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';

export async function checkNoDeadLinks(
  content: string,
  filePath: string
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const lines = content.split('\n');
  const fileDir = dirname(filePath);
  
  // Regex to match markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNumber = lineIndex + 1;
    let match;
    
    while ((match = linkRegex.exec(line)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      const columnStart = match.index + linkText.length + 3; // After "]("
      
      // Skip external links (http/https)
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        continue;
      }
      
      // Skip anchors
      if (linkUrl.startsWith('#')) {
        continue;
      }
      
      // Check local file links
      if (!linkUrl.includes('://')) {
        // Remove any anchors from the path
        const [filePath] = linkUrl.split('#');
        const absolutePath = resolve(fileDir, filePath);
        
        if (!existsSync(absolutePath)) {
          results.push({
            rule: 'no-dead-links',
            message: `Dead link: ${linkUrl}`,
            line: lineNumber,
            column: columnStart,
            severity: 'error'
          });
        }
      }
    }
  }
  
  return results;
}