export * from './init';
export * from './config';

export const configs = {
  eslint: '@outfitter/eslint-config',
  typescript: '@outfitter/typescript-config',
  utils: '@outfitter/typescript-utils',
} as const;
