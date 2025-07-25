import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSuccess, isFailure } from '@outfitter/contracts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  fileExists,
  readFile,
  writeFile,
  readJSON,
  writeJSON,
  ensureDir,
  remove,
  copyFile,
  moveFile,
  listFiles,
  getStats,
  findFiles,
  readPackageJson,
  writePackageJson,
  backupFile,
} from '../file-system';

vi.mock('node:fs/promises');
vi.mock('glob', () => ({
  glob: vi.fn(),
}));

describe('file-system utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await fileExists('/test/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.access).mockRejectedValue(error);

      const result = await fileExists('/test/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });

    it('should return error for other failures', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('Permission denied'));

      const result = await fileExists('/test/file.txt');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('file content');

      const result = await readFile('/test/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('file content');
      }
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read failed'));

      const result = await readFile('/test/file.txt');
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.message).toContain('Read failed');
      }
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await writeFile('/test/file.txt', 'content');
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'utf-8');
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Write failed'));

      const result = await writeFile('/test/file.txt', 'content');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('readJSON', () => {
    it('should read and parse JSON file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{"key": "value"}');

      const result = await readJSON('/test/file.json');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({ key: 'value' });
      }
    });

    it('should return error for invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      const result = await readJSON('/test/file.json');
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.message).toContain('Failed to parse JSON');
      }
    });

    it('should return error for read failure', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read failed'));

      const result = await readJSON('/test/file.json');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('writeJSON', () => {
    it('should stringify and write JSON', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await writeJSON('/test/file.json', { key: 'value' });
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/file.json',
        '{\n  "key": "value"\n}',
        'utf-8'
      );
    });

    it('should return error for circular reference', async () => {
      const circular: any = { key: 'value' };
      circular.self = circular;

      const result = await writeJSON('/test/file.json', circular);
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.message).toContain('Failed to stringify JSON');
      }
    });
  });

  describe('ensureDir', () => {
    it('should create directory', async () => {
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const result = await ensureDir('/test/dir');
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.mkdir).mockRejectedValue(new Error('Mkdir failed'));

      const result = await ensureDir('/test/dir');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove file or directory', async () => {
      vi.mocked(fs.rm).mockResolvedValue(undefined);

      const result = await remove('/test/target');
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith('/test/target', { recursive: true, force: true });
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.rm).mockRejectedValue(new Error('Remove failed'));

      const result = await remove('/test/target');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('copyFile', () => {
    it('should copy file', async () => {
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await copyFile('/src/file.txt', '/dest/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.copyFile).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.copyFile).mockRejectedValue(new Error('Copy failed'));

      const result = await copyFile('/src/file.txt', '/dest/file.txt');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('moveFile', () => {
    it('should move/rename file', async () => {
      vi.mocked(fs.rename).mockResolvedValue(undefined);

      const result = await moveFile('/src/file.txt', '/dest/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.rename).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.rename).mockRejectedValue(new Error('Move failed'));

      const result = await moveFile('/src/file.txt', '/dest/file.txt');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['file1.txt', 'file2.txt'] as any);

      const result = await listFiles('/test/dir');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['file1.txt', 'file2.txt']);
      }
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('List failed'));

      const result = await listFiles('/test/dir');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should get file stats', async () => {
      const mockStats = { size: 1024, isFile: () => true };
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);

      const result = await getStats('/test/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.size).toBe(1024);
      }
    });

    it('should return error on failure', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('Stat failed'));

      const result = await getStats('/test/file.txt');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const glob = await import('glob');
      vi.mocked(glob.glob).mockResolvedValue(['file1.js', 'file2.js']);

      const result = await findFiles('**/*.js');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['file1.js', 'file2.js']);
      }
    });

    it('should return error on failure', async () => {
      const glob = await import('glob');
      vi.mocked(glob.glob).mockRejectedValue(new Error('Glob failed'));

      const result = await findFiles('**/*.js');
      
      expect(isFailure(result)).toBe(true);
    });
  });

  describe('readPackageJson', () => {
    it('should read package.json from current directory', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{"name": "test-package"}');

      const result = await readPackageJson();
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({ name: 'test-package' });
      }
      expect(fs.readFile).toHaveBeenCalledWith('package.json', 'utf-8');
    });
  });

  describe('writePackageJson', () => {
    it('should write package.json to current directory', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await writePackageJson({ name: 'test-package' });
      
      expect(isSuccess(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        'package.json',
        '{\n  "name": "test-package"\n}',
        'utf-8'
      );
    });
  });

  describe('backupFile', () => {
    it('should create backup of existing file', async () => {
      // Mock file exists
      vi.mocked(fs.access).mockResolvedValue(undefined);
      
      // Mock read file
      vi.mocked(fs.readFile).mockResolvedValue('original content');
      
      // Mock mkdir
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      
      // Mock write file
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await backupFile('/test/file.txt');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toMatch(/\.flint-backup\/file\.txt\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.backup$/);
      }
      expect(fs.writeFile).toHaveBeenCalledWith(expect.any(String), 'original content', 'utf-8');
    });

    it('should fail if file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.access).mockRejectedValue(error);

      const result = await backupFile('/test/file.txt');
      
      expect(isFailure(result)).toBe(true);
      expect(result.error.message).toBe('File does not exist');
    });

    it('should use custom backup directory', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('content');
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await backupFile('/test/file.txt', '/custom/backup');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toMatch(/^\/custom\/backup\/file\.txt\./);
      }
      expect(fs.mkdir).toHaveBeenCalledWith('/custom/backup', { recursive: true });
    });
  });
});