export interface PacklistConfig {
  eslint?: boolean;
  typescript?: boolean;
  utils?: boolean;
  prettier?: boolean;
}

export const defaultConfig: PacklistConfig = {
  eslint: true,
  typescript: true,
  utils: true,
  prettier: true,
};
