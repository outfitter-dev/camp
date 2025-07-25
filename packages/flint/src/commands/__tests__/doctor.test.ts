import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { doctor } from '../doctor.js';
import { isSuccess, isFailure } from '@outfitter/contracts';
import {
  createTestContext,
  createPackageJson,
  createEslintConfig,
  createPrettierConfig,
  resetMocks,
} from '../../test-utils/index.js';

describe('doctor command', () => {
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    ctx = createTestContext({
      '/package.json': createPackageJson({
        scripts: {
          test: 'vitest',
        },
      }),
    });
  });

  afterEach(() => {
    resetMocks();
  });

  it('should report error when no package.json exists', async () => {
    delete ctx.mockFs['/package.json'];

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].severity).toBe('error');
      expect(report.issues[0].description).toContain('No package.json found');
    }
  });

  it('should detect conflicting formatters', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();
    ctx.mockFs['biome.json'] = '{}';

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const formatterIssue = report.issues.find(i => i.description.includes('Multiple formatters'));
      expect(formatterIssue).toBeDefined();
      expect(formatterIssue?.severity).toBe('warning');
    }
  });

  it('should detect both ESLint and Oxlint', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['oxlint.json'] = '{}';

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const linterIssue = report.issues.find(i => i.description.includes('Both ESLint and Oxlint'));
      expect(linterIssue).toBeDefined();
      expect(linterIssue?.severity).toBe('warning');
    }
  });

  it('should detect mix of old and new tools', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['biome.json'] = '{}';

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const mixIssue = report.issues.find(i => i.description.includes('Mix of old and new tools'));
      expect(mixIssue).toBeDefined();
      expect(mixIssue?.severity).toBe('warning');
    }
  });

  it('should check Node.js version', async () => {
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v16.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const nodeIssue = report.issues.find(i => i.description.includes('Node.js version'));
      expect(nodeIssue).toBeDefined();
      expect(nodeIssue?.severity).toBe('error');
    }
  });

  it('should detect package manager', async () => {
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'pnpm --version') {
        return { stdout: '8.6.0', stderr: '' };
      }
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const pmIssue = report.issues.find(i => i.description.includes('No package manager'));
      expect(pmIssue).toBeUndefined();
    }
  });

  it('should detect missing package manager', async () => {
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      throw new Error('Command not found');
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const pmIssue = report.issues.find(i => i.description.includes('No package manager'));
      expect(pmIssue).toBeDefined();
      expect(pmIssue?.severity).toBe('error');
    }
  });

  it('should check for Flint tool installations', async () => {
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const ultraciteIssue = report.issues.find(i => i.description.includes('Ultracite'));
      expect(ultraciteIssue).toBeDefined();
      expect(ultraciteIssue?.severity).toBe('info');
    }
  });

  it('should check VS Code settings', async () => {
    ctx.mockFs['.vscode/settings.json'] = JSON.stringify({
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.formatOnSave': true,
    });
    ctx.mockFs['biome.json'] = '{}';
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const vscodeIssue = report.issues.find(i => 
        i.description.includes('VS Code is configured to use Prettier but Biome')
      );
      expect(vscodeIssue).toBeDefined();
      expect(vscodeIssue?.severity).toBe('warning');
    }
  });

  it('should suggest enabling format on save', async () => {
    ctx.mockFs['.vscode/settings.json'] = JSON.stringify({
      'editor.formatOnSave': false,
    });
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const formatIssue = report.issues.find(i => i.description.includes('Format on save is disabled'));
      expect(formatIssue).toBeDefined();
      expect(formatIssue?.severity).toBe('info');
    }
  });

  it('should handle invalid VS Code settings', async () => {
    ctx.mockFs['.vscode/settings.json'] = '{ invalid json }';
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const parseIssue = report.issues.find(i => i.description.includes('Could not parse VS Code settings'));
      expect(parseIssue).toBeDefined();
      expect(parseIssue?.severity).toBe('warning');
    }
  });

  it('should check for missing recommended scripts', async () => {
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const scriptIssue = report.issues.find(i => i.description.includes('Missing recommended scripts'));
      expect(scriptIssue).toBeDefined();
      expect(scriptIssue?.severity).toBe('info');
    }
  });

  it('should detect outdated ESLint scripts when Oxlint is available', async () => {
    ctx.mockFs['/package.json'] = createPackageJson({
      scripts: {
        lint: 'eslint src',
      },
    });
    ctx.mockFs['oxlint.json'] = '{}';
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const scriptIssue = report.issues.find(i => 
        i.description.includes('Scripts still reference ESLint but Oxlint')
      );
      expect(scriptIssue).toBeDefined();
      expect(scriptIssue?.severity).toBe('warning');
    }
  });

  it('should warn about missing .gitignore', async () => {
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const gitignoreIssue = report.issues.find(i => i.description.includes('No .gitignore'));
      expect(gitignoreIssue).toBeDefined();
      expect(gitignoreIssue?.severity).toBe('warning');
    }
  });

  it('should check TypeScript strict mode', async () => {
    ctx.mockFs['tsconfig.json'] = JSON.stringify({
      compilerOptions: {
        strict: false,
      },
    });
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const tsIssue = report.issues.find(i => i.description.includes('TypeScript strict mode'));
      expect(tsIssue).toBeDefined();
      expect(tsIssue?.severity).toBe('info');
    }
  });

  it('should handle invalid tsconfig.json', async () => {
    ctx.mockFs['tsconfig.json'] = '{ invalid json }';
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      const parseIssue = report.issues.find(i => i.description.includes('Could not parse tsconfig'));
      expect(parseIssue).toBeDefined();
      expect(parseIssue?.severity).toBe('warning');
    }
  });

  it('should sort issues by severity', async () => {
    // Create multiple issues of different severities
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();
    delete ctx.mockFs['/package.json']; // This will create an error
    
    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      
      // Check that errors come first, then warnings, then info
      let lastSeverity = 'error';
      const severityOrder = { error: 0, warning: 1, info: 2 };
      
      report.issues.forEach(issue => {
        expect(severityOrder[issue.severity]).toBeGreaterThanOrEqual(severityOrder[lastSeverity]);
        lastSeverity = issue.severity;
      });
    }
  });

  it('should show diagnostic summary', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Diagnostic Summary:'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Errors:'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warnings:'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info:'));
    
    consoleSpy.mockRestore();
  });

  it('should return empty issues array when everything is configured correctly', async () => {
    // Set up a perfectly configured project
    ctx.mockFs['/package.json'] = createPackageJson({
      scripts: {
        format: 'ultracite format',
        lint: 'oxlint',
        check: 'pnpm format && pnpm lint',
      },
      devDependencies: {
        ultracite: '^1.0.0',
        oxlint: '^1.0.0',
        'markdownlint-cli2': '^1.0.0',
      },
    });
    ctx.mockFs['biome.json'] = '{}';
    ctx.mockFs['oxlint.json'] = '{}';
    ctx.mockFs['.gitignore'] = 'node_modules\n';
    ctx.mockFs['.vscode/settings.json'] = JSON.stringify({
      'editor.defaultFormatter': 'biomejs.biome',
      'editor.formatOnSave': true,
    });
    
    ctx.mockExec.mockImplementation((cmd) => {
      if (cmd === 'node --version') {
        return { stdout: 'v20.0.0', stderr: '' };
      }
      if (cmd === 'pnpm --version') {
        return { stdout: '8.6.0', stderr: '' };
      }
      return { stdout: '', stderr: '' };
    });

    const result = await doctor();

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      const report = result.data;
      expect(report.issues).toHaveLength(0);
    }
  });
});