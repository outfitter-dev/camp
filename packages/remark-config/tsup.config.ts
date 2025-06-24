import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/presets/standard.ts',
    'src/presets/strict.ts',
    'src/presets/relaxed.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  tsconfig: './tsconfig.json',
});
