import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false, // Temporarily disabled due to TS6305 errors
  clean: true,
  minify: false,
  sourcemap: true,
});
