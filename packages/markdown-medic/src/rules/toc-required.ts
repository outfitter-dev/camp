import type { CheckResult } from '../check.js';

export function checkTocRequired(content: string, minHeadings: number = 5): CheckResult[] {
  const results: CheckResult[] = [];
  
  // Count headings
  const headingMatches = content.match(/^#{1,6} .+$/gm) || [];
  const headingCount = headingMatches.length;
  
  if (headingCount >= minHeadings) {
    // Check for table of contents
    const hasToc = 
      content.includes('## Table of Contents') ||
      content.includes('## Contents') ||
      content.includes('## TOC') ||
      content.includes('<!-- TOC -->') ||
      content.includes('[[TOC]]') ||
      content.includes('[TOC]');
    
    if (!hasToc) {
      results.push({
        rule: 'toc-required',
        message: `Documents with ${headingCount} or more headings should include a table of contents`,
        line: 1,
        severity: 'warning'
      });
    }
  }
  
  return results;
}