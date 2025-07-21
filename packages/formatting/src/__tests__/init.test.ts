import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from '../commands/init.js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

// Mock all external dependencies
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));
vi.mock('node:fs/promises');
vi.mock('node:fs');
vi.mock('node:util', () => ({
  promisify: (fn: any) => fn,
}));

describe('init command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    vi.mocked(existsSync).mockReturnValue(false);
  });

  it('should run ultracite init and set up all configs', async () => {
    const { exec } = await import('node:child_process');
    
    // Mock exec to succeed
    vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '' });

    // Mock file operations
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ scripts: {} }));

    const result = await init();

    expect(result.success).toBe(true);

    // Should have run ultracite init
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('ultracite init'),
      expect.any(Object),
    );

    // Should have installed dependencies
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('prettier'),
      expect.any(Object),
    );

    // Should have created config files
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.prettierrc.json'),
      expect.any(String),
      'utf-8',
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.prettierignore'),
      expect.any(String),
      'utf-8',
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.markdownlint-cli2.yaml'),
      expect.any(String),
      'utf-8',
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.editorconfig'),
      expect.any(String),
      'utf-8',
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.gitattributes'),
      expect.any(String),
      'utf-8',
    );
  });

  it('should skip ultracite init when option is set', async () => {
    const { exec } = await import('node:child_process');
    vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '' });

    const result = await init({ skipUltracite: true });

    expect(result.success).toBe(true);

    // Should not have run ultracite init
    expect(exec).not.toHaveBeenCalledWith(
      expect.stringContaining('ultracite init'),
      expect.any(Object),
    );
  });

  it('should skip file creation in dry run mode', async () => {
    const result = await init({ dryRun: true });

    expect(result.success).toBe(true);

    // Should not have written any files
    expect(writeFile).not.toHaveBeenCalled();
    expect(mkdir).not.toHaveBeenCalled();
  });

  it('should skip existing files', async () => {
    const { exec } = await import('node:child_process');
    
    // Mock .prettierrc.json already exists
    vi.mocked(existsSync).mockImplementation((path) => {
      return path.toString().includes('.prettierrc.json');
    });

    vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '' });

    const result = await init();

    expect(result.success).toBe(true);

    // Should not have written .prettierrc.json
    expect(writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining('.prettierrc.json'),
      expect.any(String),
      'utf-8',
    );

    // But should have written other files
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('.prettierignore'),
      expect.any(String),
      'utf-8',
    );
  });

  it('should handle ultracite init failure gracefully', async () => {
    const { exec } = await import('node:child_process');
    
    // Mock ultracite init to fail
    vi.mocked(exec).mockImplementation((cmd: string) => {
      if (cmd.includes('ultracite')) {
        return Promise.reject(new Error('Ultracite not found'));
      }
      return Promise.resolve({ stdout: '', stderr: '' });
    });

    const result = await init();

    // Should still succeed
    expect(result.success).toBe(true);

    // Should have continued with other setup
    expect(writeFile).toHaveBeenCalled();
  });
});