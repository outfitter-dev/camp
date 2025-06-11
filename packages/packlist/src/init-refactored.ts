import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import pc from 'picocolors';
import { type Result, success, failure } from '@outfitter/contracts';
import { initHusky, addPrepareScript } from '@outfitter/husky-config';
import {
  initChangesets,
  addChangesetScripts,
} from '@outfitter/changeset-config';

interface InitOptions {
  force?: boolean;
  eslint?: boolean;
  typescript?: boolean;
  utils?: boolean;
  husky?: boolean;
  changesets?: boolean;
}

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// Type guard for package.json
function isPackageJson(value: unknown): value is PackageJson {
  return (
    typeof value === 'object' &&
    value !== null &&
    (!('scripts' in value) || typeof (value as any).scripts === 'object')
  );
}

export async function init(
  options: InitOptions = {}
): Promise<Result<void, Error>> {
  console.log(pc.cyan('🎒 Initializing Outfitter Packlist...'));

  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');

  // Check if package.json exists
  const packageJsonResult = await readPackageJson(packageJsonPath);
  if (!packageJsonResult.success) {
    console.error(
      pc.red(
        '❌ No package.json found. Please run this command in your project root.'
      )
    );
    return failure(packageJsonResult.error);
  }

  const packageJson = packageJsonResult.data;

  // Detect package manager
  const packageManager = await detectPackageManager();
  console.log(pc.gray(`📦 Using ${packageManager}`));

  // Dependencies to install
  const dependencies: Array<string> = [];
  const devDependencies: Array<string> = [];

  // Add configurations based on options
  if (options.eslint !== false) {
    devDependencies.push('@outfitter/eslint-config');
    const eslintResult = await createEslintConfig(cwd, options.force);
    if (!eslintResult.success) {
      return failure(eslintResult.error);
    }
  }

  if (options.typescript !== false) {
    devDependencies.push('@outfitter/typescript-config');
    const tsConfigResult = await createTsConfig(cwd, options.force);
    if (!tsConfigResult.success) {
      return failure(tsConfigResult.error);
    }
  }

  if (options.utils !== false) {
    dependencies.push('@outfitter/contracts');
  }

  // Add husky configuration
  if (options.husky !== false) {
    devDependencies.push(
      'husky',
      'lint-staged',
      '@commitlint/cli',
      '@commitlint/config-conventional'
    );
  }

  // Add changesets configuration
  if (options.changesets !== false) {
    devDependencies.push('@changesets/cli');
  }

  // Install dependencies
  if (dependencies.length > 0 || devDependencies.length > 0) {
    console.log(pc.cyan('📦 Installing dependencies...'));

    if (dependencies.length > 0) {
      const installResult = await installDependencies(
        packageManager,
        dependencies,
        false
      );
      if (!installResult.success) {
        return failure(installResult.error);
      }
    }

    if (devDependencies.length > 0) {
      const installResult = await installDependencies(
        packageManager,
        devDependencies,
        true
      );
      if (!installResult.success) {
        return failure(installResult.error);
      }
    }
  }

  // Add scripts if they don't exist
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  const scripts = {
    lint: 'eslint . --max-warnings 0',
    format: 'prettier --check .',
    'format:fix': 'prettier --write .',
    'type-check': 'tsc --noEmit',
  } as const;

  for (const [name, command] of Object.entries(scripts)) {
    if (!packageJson.scripts[name]) {
      packageJson.scripts[name] = command;
    }
  }

  // Write updated package.json
  const writeResult = await writePackageJson(packageJsonPath, packageJson);
  if (!writeResult.success) {
    return failure(writeResult.error);
  }

  // Initialize husky
  if (options.husky !== false) {
    try {
      console.log(pc.cyan('🪝 Setting up git hooks...'));
      initHusky({ cwd });
      addPrepareScript(packageJsonPath);

      // Create lint-staged config
      const lintStagedResult = await createLintStagedConfig(cwd, options.force);
      if (!lintStagedResult.success) {
        return failure(lintStagedResult.error);
      }

      // Create commitlint config
      const commitlintResult = await createCommitlintConfig(cwd, options.force);
      if (!commitlintResult.success) {
        return failure(commitlintResult.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        return failure(error);
      }
      return failure(new Error('Failed to initialize husky'));
    }
  }

  // Initialize changesets
  if (options.changesets !== false) {
    try {
      console.log(pc.cyan('📦 Setting up changesets...'));
      initChangesets({ cwd });
      addChangesetScripts(packageJsonPath);
    } catch (error) {
      if (error instanceof Error) {
        return failure(error);
      }
      return failure(new Error('Failed to initialize changesets'));
    }
  }

  console.log(pc.green('\n✅ Packlist initialized successfully!'));
  console.log(pc.gray('\nRun the following commands to get started:'));
  console.log(pc.white('  npm run lint        # Check code style'));
  console.log(pc.white('  npm run format      # Check formatting'));
  console.log(pc.white('  npm run type-check  # Check TypeScript'));

  return success(undefined);
}

async function readPackageJson(
  path: string
): Promise<Result<PackageJson, Error>> {
  try {
    await fs.access(path);
    const content = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(content);

    if (!isPackageJson(parsed)) {
      return failure(new Error('Invalid package.json format'));
    }

    return success(parsed);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to read package.json'));
  }
}

async function writePackageJson(
  path: string,
  packageJson: PackageJson
): Promise<Result<void, Error>> {
  try {
    await fs.writeFile(path, JSON.stringify(packageJson, null, 2) + '\n');
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to write package.json'));
  }
}

async function detectPackageManager(): Promise<string> {
  try {
    await fs.access('pnpm-lock.yaml');
    return 'pnpm';
  } catch {}

  try {
    await fs.access('yarn.lock');
    return 'yarn';
  } catch {}

  try {
    await fs.access('bun.lockb');
    return 'bun';
  } catch {}

  return 'npm';
}

async function installDependencies(
  packageManager: string,
  deps: ReadonlyArray<string>,
  dev: boolean
): Promise<Result<void, Error>> {
  const args = dev ? ['add', '-D'] : ['add'];

  if (packageManager === 'npm') {
    args[0] = 'install';
    if (dev) args[1] = '--save-dev';
  }

  try {
    await execa(packageManager, [...args, ...deps], {
      stdout: 'inherit',
      stderr: 'inherit',
    });
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to install dependencies'));
  }
}

async function createEslintConfig(
  projectRoot: string,
  force?: boolean
): Promise<Result<void, Error>> {
  const eslintConfigPath = path.join(projectRoot, '.eslintrc.js');

  if (!force) {
    try {
      await fs.access(eslintConfigPath);
      console.log(
        pc.yellow('⚠️  .eslintrc.js already exists. Use --force to overwrite.')
      );
      return success(undefined);
    } catch {
      // File doesn't exist, continue
    }
  }

  const content = `module.exports = {
  extends: ['@outfitter/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
`;

  try {
    await fs.writeFile(eslintConfigPath, content);
    console.log(pc.green('✓ Created .eslintrc.js'));
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to create .eslintrc.js'));
  }
}

async function createTsConfig(
  projectRoot: string,
  force?: boolean
): Promise<Result<void, Error>> {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  if (!force) {
    try {
      await fs.access(tsconfigPath);
      console.log(
        pc.yellow('⚠️  tsconfig.json already exists. Use --force to overwrite.')
      );
      return success(undefined);
    } catch {
      // File doesn't exist, continue
    }
  }

  const content = `{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;

  try {
    await fs.writeFile(tsconfigPath, content);
    console.log(pc.green('✓ Created tsconfig.json'));
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to create tsconfig.json'));
  }
}

async function createLintStagedConfig(
  projectRoot: string,
  force?: boolean
): Promise<Result<void, Error>> {
  const configPath = path.join(projectRoot, 'lint-staged.config.mjs');

  if (!force) {
    try {
      await fs.access(configPath);
      console.log(
        pc.yellow(
          '⚠️  lint-staged.config.mjs already exists. Use --force to overwrite.'
        )
      );
      return success(undefined);
    } catch {
      // File doesn't exist, continue
    }
  }

  const content = `export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
`;

  try {
    await fs.writeFile(configPath, content);
    console.log(pc.green('✓ Created lint-staged.config.mjs'));
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to create lint-staged.config.mjs'));
  }
}

async function createCommitlintConfig(
  projectRoot: string,
  force?: boolean
): Promise<Result<void, Error>> {
  const configPath = path.join(projectRoot, 'commitlint.config.mjs');

  if (!force) {
    try {
      await fs.access(configPath);
      console.log(
        pc.yellow(
          '⚠️  commitlint.config.mjs already exists. Use --force to overwrite.'
        )
      );
      return success(undefined);
    } catch {
      // File doesn't exist, continue
    }
  }

  const content = `export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert'
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100]
  }
};
`;

  try {
    await fs.writeFile(configPath, content);
    console.log(pc.green('✓ Created commitlint.config.mjs'));
    return success(undefined);
  } catch (error) {
    if (error instanceof Error) {
      return failure(error);
    }
    return failure(new Error('Failed to create commitlint.config.mjs'));
  }
}
