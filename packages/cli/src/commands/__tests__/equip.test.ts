// NOTE: Tests use the Jest testing framework, consistent with existing project test setup.

import fs from 'fs';
import path from 'path';
import * as child_process from 'child_process';
import { equip } from '../equip';

jest.mock('fs');
jest.mock('path');
jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
  throw new Error(`process.exit: ${code}`);
}) as never);

const execMock = jest.spyOn(child_process, 'exec');

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('equip command', () => {
  describe('happy path – when dependencies install and templates copy successfully', () => {
    it('should install dependencies and copy templates without errors', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const writeFileMock = (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      const copyFileMock = (fs.copyFileSync as jest.Mock).mockImplementation(() => {});
      execMock.mockImplementation((cmd: string, opts: any, cb: Function) => cb(null, 'install success'));

      // Act & Assert
      await expect(equip({ targetDir: 'app', dryRun: false })).resolves.not.toThrow();

      // Assert side effects
      expect(fs.existsSync).toHaveBeenCalledWith('app');
      expect(execMock).toHaveBeenCalledWith('npm install', { cwd: 'app' }, expect.any(Function));
      expect(writeFileMock).toHaveBeenCalled();
      expect(copyFileMock).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should throw when target directory is missing', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(equip({ targetDir: 'missing-dir', dryRun: false }))
        .rejects.toThrow(/not found/);
    });
  });

  describe('failure cases', () => {
    it('should exit the process when npm install fails', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      execMock.mockImplementation((cmd: string, opts: any, cb: Function) => cb(new Error('install error'), ''));

      // Act & Assert
      await expect(equip({ targetDir: 'app', dryRun: false }))
        .rejects.toThrow(/process.exit: 1/);
    });
  });

  describe('argument parsing – dry run', () => {
    it('should not perform write operations in dry-run mode', async () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      execMock.mockImplementation((cmd: string, opts: any, cb: Function) => cb(null, 'install success'));
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (fs.copyFileSync as jest.Mock).mockImplementation(() => {});

      // Act & Assert
      await expect(equip({ targetDir: 'app', dryRun: true })).resolves.not.toThrow();

      // Verify no file operations occurred
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(fs.copyFileSync).not.toHaveBeenCalled();
    });
  });
});