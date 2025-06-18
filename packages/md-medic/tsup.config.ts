import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  // Copy custom rules to dist
  onSuccess: 'mkdir -p dist/rules && cp -r src/rules/*.js dist/rules/',
});
