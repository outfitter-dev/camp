import { pathExists } from 'fs-extra';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TerrainFeatures {
  // Frameworks
  nextjs: boolean;
  react: boolean;
  vue: boolean;
  svelte: boolean;
  angular: boolean;

  // Languages/Runtime
  typescript: boolean;
  javascript: boolean;
  node: boolean;
  python: boolean;

  // Testing
  vitest: boolean;
  jest: boolean;
  playwright: boolean;
  cypress: boolean;

  // State Management
  zustand: boolean;
  redux: boolean;
  mobx: boolean;

  // Build Tools
  vite: boolean;
  webpack: boolean;

  // Features
  monorepo: boolean;
  docker: boolean;
  githubActions: boolean;
  gitlabCi: boolean;

  // Package Manager
  pnpm: boolean;
  yarn: boolean;
  npm: boolean;
  bun: boolean;
}

/**
 * Determines whether a given npm package is listed as a dependency in the project's `package.json`.
 *
 * Checks for the presence of the specified package in the `dependencies`, `devDependencies`, or `peerDependencies` fields of `package.json` within the provided directory.
 *
 * @param packageName - The name of the npm package to check for.
 * @param cwd - The directory to search in. Defaults to the current working directory.
 * @returns `true` if the package is found in any dependency section; otherwise, `false`.
 */
async function hasPackage(
  packageName: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  try {
    const packageJsonPath = join(cwd, 'package.json');
    if (await pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      };
      return packageName in deps;
    }
  } catch {
    // Ignore errors
  }
  return false;
}

/**
 * Checks if a file exists at the specified path within a given directory.
 *
 * @param filePath - Relative path to the file to check.
 * @param cwd - Directory to resolve {@link filePath} from. Defaults to the current working directory.
 * @returns `true` if the file exists, otherwise `false`.
 */
async function fileExists(
  filePath: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  return pathExists(join(cwd, filePath));
}

/**
 * Detects the presence of common frameworks, languages, tools, and features in a project directory.
 *
 * Inspects the specified directory for configuration files and package dependencies to determine which development environment features are present. Returns a {@link TerrainFeatures} object with boolean flags for each detected feature.
 *
 * @param cwd - The directory to analyze. Defaults to the current working directory.
 * @returns An object indicating detected frameworks, languages, testing tools, state management libraries, build tools, project features, and package managers.
 */
export async function detectTerrain(
  cwd: string = process.cwd()
): Promise<TerrainFeatures> {
  const terrain: TerrainFeatures = {
    // Frameworks
    nextjs:
      (await fileExists('next.config.js', cwd)) ||
      (await fileExists('next.config.mjs', cwd)) ||
      (await fileExists('next.config.ts', cwd)) ||
      (await hasPackage('next', cwd)),
    react: await hasPackage('react', cwd),
    vue: await hasPackage('vue', cwd),
    svelte: await hasPackage('svelte', cwd),
    angular: await hasPackage('@angular/core', cwd),

    // Languages/Runtime
    typescript: await fileExists('tsconfig.json', cwd),
    javascript: await fileExists('package.json', cwd),
    node: await fileExists('package.json', cwd),
    python:
      (await fileExists('requirements.txt', cwd)) ||
      (await fileExists('pyproject.toml', cwd)) ||
      (await fileExists('Pipfile', cwd)),

    // Testing
    vitest:
      (await hasPackage('vitest', cwd)) ||
      (await fileExists('vitest.config.ts', cwd)),
    jest:
      (await hasPackage('jest', cwd)) ||
      (await fileExists('jest.config.js', cwd)),
    playwright:
      (await hasPackage('@playwright/test', cwd)) ||
      (await fileExists('playwright.config.ts', cwd)),
    cypress:
      (await hasPackage('cypress', cwd)) ||
      (await fileExists('cypress.config.js', cwd)),

    // State Management
    zustand: await hasPackage('zustand', cwd),
    redux:
      (await hasPackage('redux', cwd)) ||
      (await hasPackage('@reduxjs/toolkit', cwd)),
    mobx: await hasPackage('mobx', cwd),

    // Build Tools
    vite:
      (await hasPackage('vite', cwd)) ||
      (await fileExists('vite.config.ts', cwd)),
    webpack:
      (await hasPackage('webpack', cwd)) ||
      (await fileExists('webpack.config.js', cwd)),

    // Features
    monorepo:
      (await fileExists('pnpm-workspace.yaml', cwd)) ||
      (await fileExists('lerna.json', cwd)) ||
      (await fileExists('nx.json', cwd)) ||
      (await fileExists('rush.json', cwd)),
    docker:
      (await fileExists('Dockerfile', cwd)) ||
      (await fileExists('docker-compose.yml', cwd)),
    githubActions: await fileExists('.github/workflows', cwd),
    gitlabCi: await fileExists('.gitlab-ci.yml', cwd),

    // Package Manager
    pnpm: await fileExists('pnpm-lock.yaml', cwd),
    yarn: await fileExists('yarn.lock', cwd),
    npm: await fileExists('package-lock.json', cwd),
    bun: await fileExists('bun.lockb', cwd),
  };

  return terrain;
}

/**
 * Generates a prioritized summary of detected development environment features.
 *
 * Converts a {@link TerrainFeatures} object into an array of descriptive strings, listing the primary framework, languages, testing tools, state management libraries, build tools, and special features present in the project. Only the first detected framework, testing tool, and state management library are included, in order of priority.
 *
 * @param terrain - The detected terrain features to summarize.
 * @returns An array of human-readable strings describing the project's environment.
 */
export function getTerrainSummary(terrain: TerrainFeatures): string[] {
  const features: string[] = [];

  // Primary framework
  if (terrain.nextjs) features.push('Next.js application');
  else if (terrain.react) features.push('React application');
  else if (terrain.vue) features.push('Vue application');
  else if (terrain.svelte) features.push('Svelte application');
  else if (terrain.angular) features.push('Angular application');

  // Language
  if (terrain.typescript) features.push('TypeScript');
  if (terrain.python) features.push('Python');

  // Testing
  if (terrain.vitest) features.push('Vitest testing');
  else if (terrain.jest) features.push('Jest testing');
  if (terrain.playwright) features.push('Playwright e2e');
  else if (terrain.cypress) features.push('Cypress e2e');

  // State management
  if (terrain.zustand) features.push('Zustand state');
  else if (terrain.redux) features.push('Redux state');
  else if (terrain.mobx) features.push('MobX state');

  // Build tools
  if (terrain.vite) features.push('Vite bundler');
  else if (terrain.webpack) features.push('Webpack bundler');

  // Special features
  if (terrain.monorepo) features.push('Monorepo structure');
  if (terrain.docker) features.push('Docker container');

  return features;
}

