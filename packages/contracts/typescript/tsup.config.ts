import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/zod/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  tsconfig: './tsconfig.json',
});
