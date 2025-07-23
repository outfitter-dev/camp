import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePrettierConfig } from '../prettier.js';
import { isSuccess, isFailure } from '@outfitter/contracts';
import * as fileSystem from '../../utils/file-system.js';

vi.mock('../../utils/file-system.js');

describe('generatePrettierConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate prettier config with correct settings', async () => {
    let writtenConfig: any;
    vi.mocked(fileSystem.writeJSON).mockImplementation(async (_path, config) => {
      writtenConfig = config;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    vi.mocked(fileSystem.writeFile).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);
    
    const result = await generatePrettierConfig();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenConfig).toEqual({
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
      endOfLine: 'lf',
      arrowParens: 'always',
      proseWrap: 'preserve',
      overrides: [
        {
          files: '*.md',
          options: {
            proseWrap: 'preserve'
          }
        },
        {
          files: '*.json',
          options: {
            singleQuote: false
          }
        }
      ]
    });
  });

  it('should generate prettierignore file', async () => {
    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);
    
    let writtenIgnore: string;
    vi.mocked(fileSystem.writeFile).mockImplementation(async (_path, content) => {
      writtenIgnore = content;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    const result = await generatePrettierConfig();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenIgnore!).toContain('*.js');
    expect(writtenIgnore!).toContain('*.jsx');
    expect(writtenIgnore!).toContain('*.ts');
    expect(writtenIgnore!).toContain('*.tsx');
    expect(writtenIgnore!).toContain('node_modules/');
    expect(writtenIgnore!).toContain('dist/');
  });

  it('should handle write errors', async () => {
    const error = new Error('Write failed');
    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: false,
      error,
    } as any);
    
    const result = await generatePrettierConfig();
    
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe(error);
    }
  });
});