import { z } from 'zod';
import type { Result } from '@outfitter/contracts';
import { success, failure } from '@outfitter/contracts';
import { readFileSync } from 'node:fs';

/**
 * Schema for package.json files with the fields we care about
 */
export const PackageJsonSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'Version must be in semver format'),
  type: z.enum(['module', 'commonjs']).optional(),
  scripts: z.record(z.string()).optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  engines: z
    .object({
      node: z.string().optional(),
      npm: z.string().optional(),
    })
    .optional(),
  repository: z
    .union([
      z.string(),
      z.object({
        type: z.string(),
        url: z.string(),
        directory: z.string().optional(),
      }),
    ])
    .optional(),
  license: z.string().optional(),
  private: z.boolean().optional(),
});

export type PackageJson = z.infer<typeof PackageJsonSchema>;

/**
 * Read and validate a package.json file
 * @param path Path to the package.json file
 * @returns Result containing validated PackageJson or an error
 */
export function readPackageJson(path: string): Result<PackageJson, Error> {
  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw);

    const result = PackageJsonSchema.safeParse(parsed);
    if (!result.success) {
      const errors = result.error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return failure(new Error(`Invalid package.json: ${errors}`));
    }

    return success(result.data);
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        return failure(new Error(`Package.json not found at ${path}`));
      }
      if (error.message.includes('JSON')) {
        return failure(new Error(`Invalid JSON in package.json: ${error.message}`));
      }
      return failure(error);
    }
    return failure(new Error('Unknown error reading package.json'));
  }
}

/**
 * Validate package.json data without reading from disk
 * @param data Raw package.json data
 * @returns Result containing validated PackageJson or an error
 */
export function validatePackageJson(data: unknown): Result<PackageJson, Error> {
  const result = PackageJsonSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return failure(new Error(`Invalid package.json: ${errors}`));
  }

  return success(result.data);
}
