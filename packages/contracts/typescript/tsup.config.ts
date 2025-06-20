import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', // root barrel
    'src/error.ts',
    'src/result.ts',
    'src/assert.ts',
    'src/types/index.ts',
    'src/types/branded.ts',
  ],
  format: ['cjs', 'esm'],
  treeshake: true, // ensure per-entry shakeability
  splitting: false, // avoid a shared chunk that defeats tree-shaking
  dts: false, // TypeScript handles this via tsc --emitDeclarationOnly
  clean: true,
  sourcemap: true,
  tsconfig: './tsconfig.json',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
});
