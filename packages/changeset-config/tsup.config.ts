import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disabled due to TS6305 errors
  clean: true,
  minify: false,
  sourcemap: true,
});
