// Jest unit tests for equip-refactored command.
// Framework: Jest (global describe/it style configured in project).

import { handler } from '../equip-refactored';
import * as fs from 'fs';
import execa from 'execa';

jest.mock('fs');
jest.mock('execa');

describe('equip-refactored CLI command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit: ${code}`);
    }) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  describe('Happy path', () => {
    it('runs successfully with required args', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('{ "key": "value" }');
      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({ stdout: 'done' } as any);

      await expect(handler({ input: 'src', output: 'dist' })).resolves.toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Success'));
    });

    it('honors dry-run flag by not executing external command', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('{ "key": "value" }');

      await expect(handler({ input: 'src', output: 'dist', dryRun: true })).resolves.toBeUndefined();
      expect(execa).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
    });

    it('logs verbose output when verbose flag is set', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('{ "key": "value" }');
      (execa as jest.MockedFunction<typeof execa>).mockResolvedValue({ stdout: 'done' } as any);

      await expect(handler({ input: 'src', output: 'dist', verbose: true })).resolves.toBeUndefined();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Executing'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('done'));
    });
  });

  describe('Edge cases', () => {
    it('exits when required arguments are missing', async () => {
      // @ts-ignore
      await expect(handler({})).rejects.toThrow('process.exit: 1');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('fails on invalid config JSON', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid-json');

      await expect(handler({ input: 'src', output: 'dist' })).rejects.toThrow(SyntaxError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unexpected token'));
    });

    it('exits on unknown flag', async () => {
      // @ts-ignore
      await expect(handler({ input: 'src', output: 'dist', unknown: true })).rejects.toThrow('process.exit: 1');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Failures', () => {
    it('propagates fs.readFileSync errors', async () => {
      const err = new Error('ENOENT');
      (fs.readFileSync as jest.Mock).mockImplementation(() => { throw err; });

      await expect(handler({ input: 'src', output: 'dist' })).rejects.toThrow('ENOENT');
    });

    it('handles external command failures', async () => {
      (fs.readFileSync as jest.Mock).mockReturnValue('{ "key": "value" }');
      (execa as jest.MockedFunction<typeof execa>).mockRejectedValue(new Error('execa failed'));

      await expect(handler({ input: 'src', output: 'dist' })).rejects.toThrow('execa failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('execa failed'));
    });
  });
});