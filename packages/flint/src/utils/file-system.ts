/**
 * File system operations with Result pattern
 */
import { Result, success, failure, makeError, isSuccess, isFailure, ErrorCode } from '@outfitter/contracts';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';

export interface FileSystemError {
  type: 'FILE_SYSTEM_ERROR';
  code: string;
  message: string;
  path?: string;
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<Result<boolean, FileSystemError>> {
  try {
    await fs.access(filePath);
    return success(true);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return success(false);
    }
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to check file: ${error}`));
  }
}

/**
 * Read a text file
 */
export async function readFile(filePath: string): Promise<Result<string, FileSystemError>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return success(content);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to read file: ${error}`, { path: filePath }));
  }
}

/**
 * Write a text file
 */
export async function writeFile(filePath: string, content: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return success(undefined);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to write file: ${error}`, { path: filePath }));
  }
}

/**
 * Read and parse JSON file
 */
export async function readJSON<T = any>(filePath: string): Promise<Result<T, FileSystemError>> {
  const contentResult = await readFile(filePath);
  if (!isSuccess(contentResult)) {
    return contentResult;
  }

  try {
    const data = JSON.parse(contentResult.data) as T;
    return success(data);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to parse JSON: ${error}`, { path: filePath }));
  }
}

/**
 * Write JSON file
 */
export async function writeJSON(filePath: string, data: any): Promise<Result<void, FileSystemError>> {
  try {
    const content = JSON.stringify(data, null, 2);
    return writeFile(filePath, content);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to stringify JSON: ${error}`, { path: filePath }));
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return success(undefined);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to create directory: ${error}`, { path: dirPath }));
  }
}

/**
 * Remove file or directory
 */
export async function remove(targetPath: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
    return success(undefined);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to remove: ${error}`, { path: targetPath }));
  }
}

/**
 * Copy file
 */
export async function copyFile(src: string, dest: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.copyFile(src, dest);
    return success(undefined);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to copy file: ${error}`, { path: src }));
  }
}

/**
 * Move/rename file
 */
export async function moveFile(src: string, dest: string): Promise<Result<void, FileSystemError>> {
  try {
    await fs.rename(src, dest);
    return success(undefined);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to move file: ${error}`, { path: src }));
  }
}

/**
 * List files in directory
 */
export async function listFiles(dirPath: string): Promise<Result<string[], FileSystemError>> {
  try {
    const files = await fs.readdir(dirPath);
    return success(files);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to list files: ${error}`, { path: dirPath }));
  }
}

/**
 * Get file stats
 */
export async function getStats(filePath: string): Promise<Result<fs.Stats, FileSystemError>> {
  try {
    const stats = await fs.stat(filePath);
    return success(stats);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to get stats: ${error}`, { path: filePath }));
  }
}

/**
 * Find files matching glob pattern
 */
export async function findFiles(pattern: string, options?: any): Promise<Result<string[], FileSystemError>> {
  try {
    const files = await glob(pattern, options);
    return success(files);
  } catch (error) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, `Failed to glob files: ${error}`));
  }
}

/**
 * Read package.json from current directory
 */
export async function readPackageJson(): Promise<Result<any, FileSystemError>> {
  return readJSON('package.json');
}

/**
 * Write package.json to current directory
 */
export async function writePackageJson(data: any): Promise<Result<void, FileSystemError>> {
  return writeJSON('package.json', data);
}

/**
 * Create a backup of file content
 */
export async function backupFile(filePath: string, backupDir: string = '.flint-backup'): Promise<Result<string, FileSystemError>> {
  const existsResult = await fileExists(filePath);
  if (!isSuccess(existsResult)) {
    return failure(existsResult.error);
  }
  
  if (!existsResult.data) {
    return failure(makeError(ErrorCode.INTERNAL_ERROR, 'File does not exist', { path: filePath }));
  }

  const contentResult = await readFile(filePath);
  if (!isSuccess(contentResult)) {
    return contentResult;
  }

  const ensureDirResult = await ensureDir(backupDir);
  if (!isSuccess(ensureDirResult)) {
    return failure(ensureDirResult.error);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basename = path.basename(filePath);
  const backupPath = path.join(backupDir, `${basename}.${timestamp}.backup`);

  const writeResult = await writeFile(backupPath, contentResult.data);
  if (!isSuccess(writeResult)) {
    return failure(writeResult.error);
  }

  return success(backupPath);
}