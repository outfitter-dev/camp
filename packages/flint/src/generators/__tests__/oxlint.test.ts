import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOxlintConfig } from '../oxlint.js';
import { isSuccess, type Result } from '@outfitter/contracts';
import * as childProcess from 'node:child_process';
import * as fileSystem from '../../utils/file-system.js';

vi.mock('node:child_process');
vi.mock('../../utils/file-system.js');

describe('generateOxlintConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attempt ESLint migration when ESLint config exists', async () => {
    // Mock ESLint config exists
    vi.mocked(fileSystem.fileExists).mockResolvedValue({
      success: true,
      data: true,
    } as any);

    const execSyncMock = vi
      .spyOn(childProcess, 'execSync')
      .mockImplementation(() => '');

    vi.mocked(fileSystem.readJSON).mockResolvedValue({
      success: true,
      data: {},
    } as any);

    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);

    const result = await generateOxlintConfig();

    expect(isSuccess(result)).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith(
      'npx @oxlint/migrate',
      expect.any(Object)
    );
  });

  it('should create new config when no ESLint config exists', async () => {
    // Mock no ESLint config
    vi.mocked(fileSystem.fileExists).mockResolvedValue({
      success: true,
      data: false,
    } as any);

    const execSyncMock = vi
      .spyOn(childProcess, 'execSync')
      .mockImplementation(() => '');

    vi.mocked(fileSystem.readJSON).mockResolvedValue({
      success: true,
      data: {},
    } as any);

    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);

    const result = await generateOxlintConfig();

    expect(isSuccess(result)).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith(
      'bunx oxlint --init',
      expect.any(Object)
    );
  });

  it('should enhance config with recommended rules', async () => {
    vi.mocked(fileSystem.fileExists).mockResolvedValue({
      success: true,
      data: false,
    } as any);

    vi.spyOn(childProcess, 'execSync').mockImplementation(() => '');

    vi.mocked(fileSystem.readJSON).mockResolvedValue({
      success: true,
      data: { rules: {} },
    } as any);

    let writtenConfig: any;
    vi.mocked(fileSystem.writeJSON).mockImplementation(
      async (_path, config): Promise<Result<void, Error>> => {
        writtenConfig = config;
        return {
          success: true,
          data: undefined,
        };
      }
    );

    const result = await generateOxlintConfig();

    expect(isSuccess(result)).toBe(true);
    expect(writtenConfig).toHaveProperty('plugins');
    expect(writtenConfig.plugins).toContain('react');
    expect(writtenConfig.plugins).toContain('typescript');
    expect(writtenConfig.rules).toHaveProperty('no-debugger', 'error');
    expect(writtenConfig.rules).toHaveProperty(
      'react-hooks/rules-of-hooks',
      'error'
    );
  });
});
