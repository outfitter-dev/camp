/**
 * Biome configuration for Outfitter projects
 * Uses Ultracite as the base with Outfitter-specific overrides
 */
export const biomeConfig = {
  $schema: 'https://biomejs.dev/schemas/2.1.2/schema.json',
  extends: ['ultracite'],
  json: {
    parser: {
      allowComments: true,
      allowTrailingCommas: true,
    },
  },
};

export default biomeConfig;