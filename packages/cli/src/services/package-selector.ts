import type { PackageSelection, PresetType, Package } from '../types/index.js';
import type { TerrainFeatures } from '../utils/detect-terrain.js';
import type { FieldguideRecommendation } from '../config/fieldguide-mappings.js';
import { PRESET_CONFIGURATIONS, CONFIG_PACKAGES, UTILITY_PACKAGES } from '../constants/packages.js';
import { getRecommendedFieldguideIds } from '../config/fieldguide-mappings.js';
import * as prompts from '../ui/prompts.js';

export function getPresetSelection(preset: PresetType): PackageSelection {
  return PRESET_CONFIGURATIONS[preset];
}

export function getDefaultSelection(terrain: TerrainFeatures): PackageSelection {
  return {
    configs: CONFIG_PACKAGES.filter(p => p.selected).map(p => p.value),
    utils: UTILITY_PACKAGES.filter(p => p.selected).map(p => p.value),
    fieldguides: getRecommendedFieldguideIds(terrain),
  };
}

export async function getInteractiveSelection(
  terrain: TerrainFeatures,
  recommendedFieldguides: FieldguideRecommendation[]
): Promise<PackageSelection> {
  console.log(''); // Add spacing
  
  const selectedConfigs = await prompts.selectConfigurations(CONFIG_PACKAGES);
  const selectedUtils = await prompts.selectUtilities(UTILITY_PACKAGES);
  
  // Show recommended fieldguides
  if (recommendedFieldguides.length > 0) {
    prompts.showRecommendedFieldguides(recommendedFieldguides);
  }
  
  return {
    configs: selectedConfigs,
    utils: selectedUtils,
    fieldguides: getRecommendedFieldguideIds(terrain),
  };
}