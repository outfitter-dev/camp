/**
 * Install dependencies with package manager
 */
import { Result, success, failure, makeError, isSuccess, isFailure, ErrorCode } from '@outfitter/contracts';
import { readPackageJson } from '../utils/file-system';
import { getPackageManager, getAddCommand, getInstallCommand, isCI, getCIFlags } from '../utils/package-manager';
import { execSync } from 'node:child_process';
import { console } from '../utils/console';

export interface InstallerError {
  type: 'INSTALLER_ERROR';
  code: string;
  message: string;
}

export interface InstallOptions {
  dev?: boolean;
  exact?: boolean;
  silent?: boolean;
}

// Required dependencies for Flint
const REQUIRED_DEPENDENCIES = [
  '@biomejs/biome',
  'oxlint',
  'prettier',
  'markdownlint-cli2',
  'stylelint',
  'stylelint-config-tailwindcss',
  'lefthook',
  '@commitlint/cli',
  '@commitlint/config-conventional',
  'ultracite',
];

/**
 * Get missing dependencies that need to be installed
 */
export async function getMissingDependencies(): Promise<Result<string[], InstallerError>> {
  const pkgJsonResult = await readPackageJson();
  if (isFailure(pkgJsonResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read package.json: ${pkgJsonResult.error.message}`));
  }

  const pkg = pkgJsonResult.data;
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const missing = REQUIRED_DEPENDENCIES.filter(dep => !(dep in allDeps));
  return success(missing);
}

/**
 * Install dependencies
 */
export async function installDependencies(
  packages: string[],
  options: InstallOptions = {}
): Promise<Result<void, InstallerError>> {
  if (packages.length === 0) {
    return success(undefined);
  }

  const { dev = true, exact = false, silent = false } = options;

  const pmResult = await getPackageManager();
  if (isFailure(pmResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to detect package manager: ${pmResult.error.message}`));
  }

  const pm = pmResult.data.type;
  const command = getAddCommand(pm, dev, packages);
  const fullCommand = exact ? `${command} --exact` : command;

  if (!silent) {
    console.info(`Installing dependencies with ${pm}...`);
    console.step(fullCommand);
  }

  try {
    execSync(fullCommand, {
      stdio: silent ? 'ignore' : 'inherit',
      encoding: 'utf-8',
    });

    if (!silent) {
      console.success(`Successfully installed ${packages.length} dependencies`);
    }

    return success(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to install dependencies: ${message}`));
  }
}

/**
 * Run npm/yarn/pnpm/bun install
 */
export async function runInstall(options: { silent?: boolean } = {}): Promise<Result<void, InstallerError>> {
  const { silent = false } = options;

  const pmResult = await getPackageManager();
  if (isFailure(pmResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to detect package manager: ${pmResult.error.message}`));
  }

  const pm = pmResult.data.type;
  let command = getInstallCommand(pm);

  // Add CI flags if in CI environment
  if (isCI()) {
    const ciFlags = getCIFlags(pm);
    if (ciFlags) {
      command = `${command} ${ciFlags}`;
    }
  }

  if (!silent) {
    console.info(`Running ${pm} install...`);
  }

  try {
    execSync(command, {
      stdio: silent ? 'ignore' : 'inherit',
      encoding: 'utf-8',
    });

    if (!silent) {
      console.success('Dependencies installed successfully');
    }

    return success(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to run install: ${message}`));
  }
}

/**
 * Check if a package is installed
 */
export async function isPackageInstalled(packageName: string): Promise<Result<boolean, InstallerError>> {
  const pkgJsonResult = await readPackageJson();
  if (isFailure(pkgJsonResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read package.json: ${pkgJsonResult.error.message}`));
  }

  const pkg = pkgJsonResult.data;
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  return success(packageName in allDeps);
}

/**
 * Get version of installed package
 */
export async function getPackageVersion(packageName: string): Promise<Result<string | null, InstallerError>> {
  const pkgJsonResult = await readPackageJson();
  if (isFailure(pkgJsonResult)) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read package.json: ${pkgJsonResult.error.message}`));
  }

  const pkg = pkgJsonResult.data;
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const version = allDeps[packageName];
  return success(version || null);
}

/**
 * Install a single package
 */
export async function installPackage(
  packageName: string,
  options: InstallOptions = {}
): Promise<Result<void, InstallerError>> {
  return installDependencies([packageName], options);
}

/**
 * Install all missing Flint dependencies
 */
export async function installMissingDependencies(
  options: InstallOptions = {}
): Promise<Result<void, InstallerError>> {
  const missingResult = await getMissingDependencies();
  if (isFailure(missingResult)) {
    return failure(missingResult.error);
  }

  const missing = missingResult.data;
  if (missing.length === 0) {
    console.info('All required dependencies are already installed');
    return success(undefined);
  }

  console.info(`Found ${missing.length} missing dependencies`);
  return installDependencies(missing, options);
}