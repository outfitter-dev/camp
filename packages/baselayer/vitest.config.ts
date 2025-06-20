import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@outfitter/contracts': resolve(__dirname, '../contracts/typescript/src'),
      '@outfitter/contracts-zod': resolve(__dirname, '../contracts-zod/src'),
    },
  },
});
