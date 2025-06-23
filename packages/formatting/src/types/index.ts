/**
 * Types for the @outfitter/formatting package
 */

/**
 * Available formatters that can be detected and configured
 */
export type FormatterType = 'prettier' | 'biome' | 'remark';

/**
 * Detection result for a specific formatter
 */
export interface FormatterDetection {
  /** The formatter type */
  type: FormatterType;
  /** Whether the formatter is available */
  available: boolean;
  /** Version if available */
  version?: string;
  /** Location where found (local, global, system) */
  location?: 'local' | 'global' | 'system';
  /** Full path to the executable */
  path?: string;
  /** Any detection errors */
  error?: string;
}

/**
 * Result of detecting all formatters
 */
export interface FormatterDetectionResult {
  /** Individual formatter detection results */
  formatters: FormatterDetection[];
  /** List of available formatter types */
  available: FormatterType[];
  /** List of missing formatter types */
  missing: FormatterType[];
}

/**
 * Configuration preset options
 */
export interface PresetConfig {
  /** Preset name */
  name: 'standard' | 'strict' | 'relaxed';
  /** Line width for formatting */
  lineWidth: number;
  /** Indentation settings */
  indentation: {
    style: 'space' | 'tab';
    width: number;
  };
  /** Quote style settings */
  quotes: {
    style: 'single' | 'double';
    jsx: 'single' | 'double';
  };
  /** Semicolon usage */
  semicolons: 'always' | 'asNeeded';
  /** Trailing comma settings */
  trailingComma: 'all' | 'es5' | 'none';
  /** Bracket spacing */
  bracketSpacing: boolean;
  /** Arrow parentheses */
  arrowParens: 'always' | 'asNeeded';
  /** End of line character */
  endOfLine: 'lf' | 'crlf' | 'cr' | 'auto';
}

/**
 * Setup options for the formatting tool
 */
export interface SetupOptions {
  /** Preset to use */
  preset?: PresetConfig['name'];
  /** Custom preset configuration (overrides preset) */
  presetConfig?: Partial<PresetConfig>;
  /** Formatters to configure (auto-detected if not specified) */
  formatters?: FormatterType[];
  /** Whether to install missing formatters */
  installMissing?: boolean;
  /** Whether to update package.json scripts */
  updateScripts?: boolean;
  /** Target directory for setup */
  targetDir?: string;
  /** Dry run mode - don't write files */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Generated configuration files
 */
export interface GeneratedConfig {
  /** File path relative to target directory */
  path: string;
  /** File content */
  content: string;
  /** Formatter this config is for */
  formatter: FormatterType;
  /** Whether this file was generated (vs already existed) */
  generated: boolean;
}

/**
 * Setup operation result
 */
export interface SetupResult {
  /** Whether setup was successful */
  success: boolean;
  /** Generated configuration files */
  configs: GeneratedConfig[];
  /** Updated package.json scripts */
  scripts: Record<string, string>;
  /** Any errors that occurred */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Information messages */
  info: string[];
}