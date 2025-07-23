import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePackageScripts } from '../package-scripts.js';
import { isSuccess } from '@outfitter/contracts';
import * as fileSystem from '../../utils/file-system.js';

vi.mock('../../utils/file-system.js');

describe('updatePackageScripts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add Flint scripts to package.json', async () => {
    vi.mocked(fileSystem.readPackageJson).mockResolvedValue({
      success: true,
      data: {
        name: 'test-project',
        scripts: {
          test: 'vitest',
          build: 'tsc'
        }
      }
    } as any);
    
    let writtenPackage: any;
    vi.mocked(fileSystem.writePackageJson).mockImplementation(async (pkg) => {
      writtenPackage = pkg;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    const result = await updatePackageScripts();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenPackage.scripts).toHaveProperty('format', 'biome format --write .');
    expect(writtenPackage.scripts).toHaveProperty('lint', 'oxlint');
    expect(writtenPackage.scripts).toHaveProperty('prepare', 'lefthook install');
    // Existing scripts should be preserved
    expect(writtenPackage.scripts).toHaveProperty('test', 'vitest');
    expect(writtenPackage.scripts).toHaveProperty('build', 'tsc');
  });

  it('should create scripts object if it does not exist', async () => {
    vi.mocked(fileSystem.readPackageJson).mockResolvedValue({
      success: true,
      data: {
        name: 'test-project'
      }
    } as any);
    
    let writtenPackage: any;
    vi.mocked(fileSystem.writePackageJson).mockImplementation(async (pkg) => {
      writtenPackage = pkg;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    const result = await updatePackageScripts();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenPackage.scripts).toBeDefined();
    expect(writtenPackage.scripts).toHaveProperty('format');
    expect(writtenPackage.scripts).toHaveProperty('lint');
  });

  it('should override Flint-managed scripts but preserve others', async () => {
    vi.mocked(fileSystem.readPackageJson).mockResolvedValue({
      success: true,
      data: {
        name: 'test-project',
        scripts: {
          test: 'jest', // Custom test script
          format: 'prettier --write .', // Old format script - should be replaced
          custom: 'echo custom' // Custom script - should be preserved
        }
      }
    } as any);
    
    let writtenPackage: any;
    vi.mocked(fileSystem.writePackageJson).mockImplementation(async (pkg) => {
      writtenPackage = pkg;
      return {
        success: true,
        data: undefined,
      } as any;
    });
    
    const result = await updatePackageScripts();
    
    expect(isSuccess(result)).toBe(true);
    expect(writtenPackage.scripts).toHaveProperty('format', 'biome format --write .');
    expect(writtenPackage.scripts).toHaveProperty('test', 'jest'); // Preserved
    expect(writtenPackage.scripts).toHaveProperty('custom', 'echo custom'); // Preserved
  });
});