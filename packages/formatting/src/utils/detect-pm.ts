/**
 * Package manager detection utilities
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface PackageManager {
  name: 'npm' | 'yarn' | 'pnpm' | 'bun';
  dlx: string;
  install: string;
  lockFile: string;
}

/**
 * Detect the package manager being used in the current project
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  // Check for lock files in order of preference
  if (existsSync(join(cwd, 'bun.lockb'))) {
    return {
      name: 'bun',
      dlx: 'bunx',
      install: 'bun add',
      lockFile: 'bun.lockb',
    };
  }

  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return {
      name: 'pnpm',
      dlx: 'pnpm dlx',
      install: 'pnpm add',
      lockFile: 'pnpm-lock.yaml',
    };
  }

  if (existsSync(join(cwd, 'yarn.lock'))) {
    return {
      name: 'yarn',
      dlx: 'yarn dlx',
      install: 'yarn add',
      lockFile: 'yarn.lock',
    };
  }

  // Default to npm
  return {
    name: 'npm',
    dlx: 'npx',
    install: 'npm install',
    lockFile: 'package-lock.json',
  };
}