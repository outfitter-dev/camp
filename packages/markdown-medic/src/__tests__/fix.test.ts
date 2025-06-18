import { describe, it, expect } from 'vitest';
import { fixMarkdown } from '../fix.js';
import { loadConfig } from '../config.js';

describe('fixMarkdown', () => {
  it('should fix trailing spaces', async () => {
    const content = `# Test  \nContent with trailing spaces   `;
    const expected = `# Test\nContent with trailing spaces\n`;
    
    const config = await loadConfig(undefined, 'standard');
    const fixed = await fixMarkdown(content, { config });
    
    expect(fixed).toBe(expected);
  });
  
  it('should fix hard tabs', async () => {
    const content = `# Test\n\tIndented with tab`;
    const expected = `# Test\n  Indented with tab\n`;
    
    const config = await loadConfig(undefined, 'standard');
    const fixed = await fixMarkdown(content, { config });
    
    expect(fixed).toBe(expected);
  });
  
  it('should fix list marker spacing', async () => {
    const content = `# Test\n\n-Item 1\n*Item 2\n1.Item 3`;
    const expected = `# Test\n\n- Item 1\n* Item 2\n1. Item 3\n`;
    
    const config = await loadConfig(undefined, 'standard');
    const fixed = await fixMarkdown(content, { config });
    
    expect(fixed).toBe(expected);
  });
  
  it('should fix consistent terminology', async () => {
    const content = `# Test\n\nWe use NPM and Javascript.`;
    const expected = `# Test\n\nWe use npm and JavaScript.\n`;
    
    const config = {
      preset: 'standard' as const,
      rules: {
        'consistent-terminology': true
      },
      terminology: [
        { incorrect: 'NPM', correct: 'npm' },
        { incorrect: 'Javascript', correct: 'JavaScript' }
      ]
    };
    
    const fixed = await fixMarkdown(content, { config });
    
    expect(fixed).toBe(expected);
  });
  
  it('should ensure file ends with newline', async () => {
    const content = `# Test\n\nNo newline at end`;
    const expected = `# Test\n\nNo newline at end\n`;
    
    const config = await loadConfig(undefined, 'standard');
    const fixed = await fixMarkdown(content, { config });
    
    expect(fixed).toBe(expected);
  });
});