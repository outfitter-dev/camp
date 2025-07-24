#!/usr/bin/env bun

// Bun build script for @outfitter/contracts
// Replaces tsup with native Bun build for improved performance

import { $ } from 'bun';

const entryPoints = [
  'src/index.ts',
  'src/error.ts', 
  'src/result.ts',
  'src/assert.ts',
  'src/types/index.ts',
  'src/types/branded.ts',
];

console.log('Building with Bun...');

// Clean dist directory
await $`rm -rf dist`;
await $`mkdir -p dist/types`;

// Build all entry points with Bun
const result = await Bun.build({
  entrypoints: entryPoints,
  outdir: './dist',
  format: 'esm',
  sourcemap: 'external',
  splitting: false, // Matches tsup config
  minify: false,
  target: 'node',
});

if (!result.success) {
  console.error('Build failed:');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log('✓ Bun build complete');

// Generate TypeScript declarations
console.log('Generating TypeScript declarations...');
await $`../../../node_modules/.bin/tsc --emitDeclarationOnly`;

console.log('✓ Build complete');