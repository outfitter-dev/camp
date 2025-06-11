export interface EquipOptions {
  preset?: PresetType;
  yes?: boolean;
}

export interface PackageSelection {
  configs: string[];
  utils: string[];
  fieldguides: string[];
}

export interface Package {
  name: string;
  value: string;
  selected: boolean;
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
export type PresetType = 'minimal' | 'standard' | 'full';

export interface InstallCommand {
  command: string;
  installVerb: string;
  devFlag: string;
}