import { describe, it, expect } from 'vitest';
import { checkMarkdown } from '../check.js';
import { loadConfig } from '../config.js';

describe('checkMarkdown', () => {
  it('should detect missing code block language', async () => {
    const content = `
# Test

\`\`\`
const foo = 'bar';
\`\`\`
`;
    
    const config = await loadConfig(undefined, 'standard');
    const results = await checkMarkdown(content, { config });
    
    const codeBlockError = results.find(r => r.rule === 'code-block-language');
    expect(codeBlockError).toBeDefined();
    expect(codeBlockError?.message).toContain('should specify a language');
  });
  
  it('should detect inconsistent terminology', async () => {
    const content = `
# Test

We use NPM for package management.
JavaScript is great!
`;
    
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
    
    const results = await checkMarkdown(content, { config });
    
    const termError = results.find(r => r.rule === 'consistent-terminology');
    expect(termError).toBeDefined();
    expect(termError?.message).toContain('Use "npm" instead of "NPM"');
  });
  
  it('should detect trailing spaces', async () => {
    const content = `# Test  \nContent with trailing spaces   `;
    
    const config = await loadConfig(undefined, 'standard');
    const results = await checkMarkdown(content, { config });
    
    const trailingSpaceError = results.find(r => r.rule === 'MD009');
    expect(trailingSpaceError).toBeDefined();
  });
});