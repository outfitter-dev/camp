import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectPackageManager } from '../utils/detect-pm.js';
import { existsSync } from 'node:fs';

vi.mock('node:fs');

describe('detectPackageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect bun when bun.lockb exists', () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      return path.toString().includes('bun.lockb');
    });

    const pm = detectPackageManager();
    
    expect(pm.name).toBe('bun');
    expect(pm.dlx).toBe('bunx');
    expect(pm.install).toBe('bun add');
    expect(pm.lockFile).toBe('bun.lockb');
  });

  it('should detect pnpm when pnpm-lock.yaml exists', () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      return path.toString().includes('pnpm-lock.yaml');
    });

    const pm = detectPackageManager();
    
    expect(pm.name).toBe('pnpm');
    expect(pm.dlx).toBe('pnpm dlx');
    expect(pm.install).toBe('pnpm add');
    expect(pm.lockFile).toBe('pnpm-lock.yaml');
  });

  it('should detect yarn when yarn.lock exists', () => {
    vi.mocked(existsSync).mockImplementation((path) => {
      return path.toString().includes('yarn.lock');
    });

    const pm = detectPackageManager();
    
    expect(pm.name).toBe('yarn');
    expect(pm.dlx).toBe('yarn dlx');
    expect(pm.install).toBe('yarn add');
    expect(pm.lockFile).toBe('yarn.lock');
  });

  it('should default to npm when no lock file exists', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const pm = detectPackageManager();
    
    expect(pm.name).toBe('npm');
    expect(pm.dlx).toBe('npx');
    expect(pm.install).toBe('npm install');
    expect(pm.lockFile).toBe('package-lock.json');
  });

  it('should respect priority order when multiple lock files exist', () => {
    // All lock files exist
    vi.mocked(existsSync).mockReturnValue(true);

    const pm = detectPackageManager();
    
    // Should pick bun first (highest priority)
    expect(pm.name).toBe('bun');
  });
});