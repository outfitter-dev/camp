// Jest with ts-jest is used for testing TypeScript commands

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { prompt } from 'enquirer';
import equip from '../equip';

jest.mock('fs-extra');
jest.mock('enquirer', () => ({ prompt: jest.fn() }));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPrompt = prompt as jest.MockedFunction<typeof prompt>;
const actualFs = jest.requireActual('fs-extra');

const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = jest.spyOn(process, 'exit').mockImplementation(
  ((code?: number) => { throw new Error(`process.exit: ${code}`); }) as never
);

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

let tmpDir: string;

beforeEach(() => {
  jest.clearAllMocks();
  // Restore real FS methods for tmp directory management
  (mockedFs.mkdtempSync as jest.Mock).mockImplementation((prefix: string) =>
    actualFs.mkdtempSync(prefix)
  );
  (mockedFs.rmSync as jest.Mock).mockImplementation((target: string, opts?: any) =>
    actualFs.rmSync(target, opts)
  );
  tmpDir = mockedFs.mkdtempSync(path.join(os.tmpdir(), 'equip-'));
});

afterEach(() => {
  mockedFs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('equip command', () => {
  it('equips successfully when project path arg provided', async () => {
    mockedFs.pathExists.mockResolvedValue(false);
    mockedFs.copy.mockResolvedValue(undefined);

    await expect(equip({ projectPath: tmpDir })).resolves.toBeUndefined();

    expect(mockedFs.copy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(Object)
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Equipped'));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('prompts interactively when no project path provided', async () => {
    mockedPrompt.mockResolvedValue({ projectPath: tmpDir });
    mockedFs.pathExists.mockResolvedValue(false);
    mockedFs.copy.mockResolvedValue(undefined);

    await expect(equip({})).resolves.toBeUndefined();

    expect(mockedPrompt).toHaveBeenCalled();
    expect(mockedFs.copy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Equipped'));
  });

  it('does a dry-run without making changes', async () => {
    mockedFs.pathExists.mockResolvedValue(false);

    await expect(equip({ projectPath: tmpDir, dryRun: true })).resolves.toBeUndefined();

    expect(mockedFs.copy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Dry-run'));
  });

  it('exits with error if path already equipped', async () => {
    mockedFs.pathExists.mockResolvedValue(true);

    await expect(equip({ projectPath: tmpDir })).rejects.toThrow('process.exit: 1');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('already equipped'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles invalid path errors', async () => {
    const err = new Error('boom');
    mockedFs.pathExists.mockRejectedValue(err);

    await expect(equip({ projectPath: tmpDir })).rejects.toThrow('boom');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('bubbles errors from fs.copy', async () => {
    mockedFs.pathExists.mockResolvedValue(false);
    const copyErr = new Error('copy-fail');
    mockedFs.copy.mockRejectedValue(copyErr);

    await expect(equip({ projectPath: tmpDir })).rejects.toThrow('copy-fail');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('copy-fail'));
  });
});