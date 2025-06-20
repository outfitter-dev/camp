export * from './config';
export * from './init';

export const configs = {
  eslint: '@outfitter/eslint-config',
  typescript: '@outfitter/typescript-config',
  utils: '@outfitter/contracts',
} as const;
