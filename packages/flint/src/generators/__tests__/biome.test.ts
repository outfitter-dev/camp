import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateBiomeConfig } from '../biome.js';
import { isSuccess, isFailure } from '@outfitter/contracts';
import * as childProcess from 'node:child_process';

vi.mock('node:child_process');

describe('generateBiomeConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run ultracite init with correct arguments', async () => {
    const execSyncMock = vi.spyOn(childProcess, 'execSync').mockImplementation(() => '');
    
    const result = await generateBiomeConfig();
    
    expect(isSuccess(result)).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith('bunx ultracite init --yes', {
      stdio: 'inherit',
      env: expect.objectContaining({
        FORCE_COLOR: '1'
      })
    });
  });

  it('should handle errors from ultracite init', async () => {
    const error = new Error('Command failed');
    vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
      throw error;
    });
    
    const result = await generateBiomeConfig();
    
    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toContain('Command failed');
    }
  });
});