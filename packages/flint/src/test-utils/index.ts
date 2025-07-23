import { vi } from 'vitest';
import type { Mock } from 'vitest';

export interface MockFileSystem {
  '/package.json': string;
  [key: string]: string;
}

export interface MockExecResult {
  stdout: string;
  stderr: string;
}

export interface TestContext {
  mockFs: MockFileSystem;
  mockExec: Mock<[string], MockExecResult>;
  mockConsole: {
    log: Mock;
    error: Mock;
    warn: Mock;
  };
}

/**
 * Create a mock file system for testing
 */
export function createMockFileSystem(files: MockFileSystem): MockFileSystem {
  return { ...files };
}

/**
 * Create a test context with common mocks
 */
export function createTestContext(initialFiles: MockFileSystem = {}): TestContext {
  const mockFs = createMockFileSystem(initialFiles);
  const mockExec = vi.fn<[string], MockExecResult>();
  const mockConsole = {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };

  // Mock fs module
  vi.mock('node:fs', () => ({
    existsSync: vi.fn((path: string) => path in mockFs),
    readFileSync: vi.fn((path: string) => {
      if (!(path in mockFs)) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return mockFs[path];
    }),
    writeFileSync: vi.fn((path: string, content: string) => {
      mockFs[path] = content;
    }),
    mkdirSync: vi.fn(),
    rmSync: vi.fn((path: string) => {
      delete mockFs[path];
    }),
    readdirSync: vi.fn((dir: string) => {
      const prefix = dir.endsWith('/') ? dir : `${dir}/`;
      return Object.keys(mockFs)
        .filter(path => path.startsWith(prefix))
        .map(path => path.slice(prefix.length).split('/')[0])
        .filter((name, index, arr) => arr.indexOf(name) === index);
    }),
  }));

  // Mock fs/promises module
  vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(async (path: string) => {
      if (!(path in mockFs)) {
        throw new Error(`ENOENT: no such file or directory, open '${path}'`);
      }
      return mockFs[path];
    }),
    writeFile: vi.fn(async (path: string, content: string) => {
      mockFs[path] = content;
    }),
    mkdir: vi.fn(),
    rm: vi.fn(async (path: string) => {
      delete mockFs[path];
    }),
    access: vi.fn(async (path: string) => {
      if (!(path in mockFs)) {
        throw new Error(`ENOENT: no such file or directory, access '${path}'`);
      }
    }),
  }));

  // Mock child_process
  vi.mock('node:child_process', () => ({
    execSync: mockExec,
  }));

  // Mock path module
  vi.mock('node:path', async () => {
    const actual = await vi.importActual<typeof import('node:path')>('node:path');
    return {
      ...actual,
      join: (...args: string[]) => args.filter(Boolean).join('/'),
      resolve: (...args: string[]) => {
        const joined = args.filter(Boolean).join('/');
        return joined.startsWith('/') ? joined : `/${joined}`;
      },
    };
  });

  // Mock process.cwd() to return root for mock filesystem
  vi.spyOn(process, 'cwd').mockReturnValue('/');

  return {
    mockFs,
    mockExec,
    mockConsole,
  };
}

/**
 * Create a basic package.json for testing
 */
export function createPackageJson(overrides: Record<string, any> = {}): string {
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    type: 'module',
    scripts: {
      test: 'vitest',
    },
    devDependencies: {},
    ...overrides,
  };
  return JSON.stringify(packageJson, null, 2);
}

/**
 * Create ESLint config for testing
 */
export function createEslintConfig(): string {
  return JSON.stringify({
    extends: ['eslint:recommended'],
    rules: {
      semi: ['error', 'always'],
    },
  }, null, 2);
}

/**
 * Create Prettier config for testing
 */
export function createPrettierConfig(): string {
  return JSON.stringify({
    semi: false,
    singleQuote: true,
    tabWidth: 2,
  }, null, 2);
}

/**
 * Mock prompts for interactive testing
 */
export function mockPrompts(responses: Record<string, any>) {
  vi.mock('@inquirer/prompts', () => ({
    confirm: vi.fn(async ({ message }: { message: string }) => {
      const key = Object.keys(responses).find(k => message.includes(k));
      return key ? responses[key] : false;
    }),
    select: vi.fn(async ({ message, choices }: { message: string; choices: any[] }) => {
      const key = Object.keys(responses).find(k => message.includes(k));
      return key ? responses[key] : choices[0].value;
    }),
  }));
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  vi.resetAllMocks();
  vi.resetModules();
}