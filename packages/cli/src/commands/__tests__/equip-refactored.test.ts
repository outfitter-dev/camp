/**
 * Tests for equipCmd and related helpers.
 * Using Jest + TypeScript with ts-jest as configured in jest.config.js.
 */
import { equipCmd, validateOptions, buildEquipManifest } from '../equip-refactored';
import * as fs from 'fs/promises';

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('{}'),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  jest.restoreAllMocks();
  process.exitCode = 0;
});

describe('equipCmd – happy paths', () => {
  it('should parse minimal valid arguments and execute successfully', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await equipCmd({ package: 'my-package', _: [], $0: 'node' } as any);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Equipped'));
    logSpy.mockRestore();
  });
});

describe('equipCmd – edge cases', () => {
  it('should throw an error when required argument <package> is missing', async () => {
    await expect(equipCmd({ _: [], $0: 'node' } as any)).rejects.toThrow('Missing required argument <package>');
  });

  it('should set exit code to 1 for unknown flags', async () => {
    const argsWithUnknown = { package: 'pkg', unknownFlag: true, _: [], $0: 'node' } as any;
    await expect(equipCmd(argsWithUnknown)).resolves.toBeUndefined();
    expect(process.exitCode).toBe(1);
  });
});

describe('equipCmd – failure conditions', () => {
  it('should propagate fs.writeFile failure and set non-zero exit code', async () => {
    (fs.writeFile as jest.Mock).mockRejectedValueOnce(new Error('disk error'));
    await expect(equipCmd({ package: 'pkg', _: [], $0: 'node' } as any)).resolves.toBeUndefined();
    expect(process.exitCode).not.toBe(0);
  });

  it('should throw ConfigError when config file is missing', async () => {
    (fs.readFile as jest.Mock).mockRejectedValueOnce({ code: 'ENOENT' });
    await expect(equipCmd({ package: 'pkg', _: [], $0: 'node' } as any)).rejects.toThrow('ConfigError');
  });
});

describe('validateOptions', () => {
  it('should return normalized options for valid input', () => {
    const opts = validateOptions({ package: 'pkg', projectDir: './proj' } as any);
    expect(opts).toMatchObject({ packageName: 'pkg', projectDir: './proj' });
  });

  it('should throw error for missing projectDir', () => {
    expect(() => validateOptions({ package: 'pkg' } as any)).toThrow('Missing projectDir');
  });
});

describe('buildEquipManifest', () => {
  it('should build correct manifest structure', () => {
    const manifest = buildEquipManifest({ packageName: 'pkg', dependencies: ['dep1'] } as any);
    expect(manifest).toMatchObject({ name: 'pkg', dependencies: ['dep1'] });
    expect(manifest).toMatchSnapshot();
  });
});