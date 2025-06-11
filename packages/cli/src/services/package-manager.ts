import { pathExists } from 'fs-extra';
import { execa } from 'execa';
import type { PackageManager, InstallCommand } from '../types/index.js';

export async function detectPackageManager(): Promise<PackageManager> {
  if (await pathExists('pnpm-lock.yaml')) return 'pnpm';
  if (await pathExists('yarn.lock')) return 'yarn';
  if (await pathExists('bun.lockb')) return 'bun';
  if (await pathExists('package-lock.json')) return 'npm';
  
  return 'npm';
}

export function getInstallCommand(manager: PackageManager): InstallCommand {
  switch (manager) {
    case 'npm':
      return { command: 'npm', installVerb: 'install', devFlag: '--save-dev' };
    case 'pnpm':
      return { command: 'pnpm', installVerb: 'add', devFlag: '-D' };
    case 'yarn':
      return { command: 'yarn', installVerb: 'add', devFlag: '-D' };
    case 'bun':
      return { command: 'bun', installVerb: 'add', devFlag: '-D' };
  }
}

export async function installPackages(packages: string[], manager: PackageManager): Promise<void> {
  if (packages.length === 0) return;
  
  const { command, installVerb, devFlag } = getInstallCommand(manager);
  await execa(command, [installVerb, devFlag, ...packages], { stdio: 'inherit' });
}