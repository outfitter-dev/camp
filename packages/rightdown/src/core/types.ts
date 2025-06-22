/**
 * Rightdown v2 configuration types
 */

export interface RightdownConfigV1 {
  preset?: 'strict' | 'standard' | 'relaxed';
  rules?: Record<string, unknown>;
  ignores?: Array<string>;
  terminology?: Array<{
    incorrect: string;
    correct: string;
    caseSensitive?: boolean;
  }>;
}

export interface RightdownConfigV2 {
  version: 2;
  preset?: 'strict' | 'standard' | 'relaxed';
  rules?: Record<string, unknown>;
  formatters?: {
    default?: string;
    languages?: Record<string, string>;
  };
  formatterOptions?: Record<string, Record<string, unknown>>;
  ignores?: Array<string>;
  terminology?: Array<{
    incorrect: string;
    correct: string;
    caseSensitive?: boolean;
  }>;
  output?: {
    diagnostics?: boolean;
    progress?: boolean;
    color?: boolean;
  };
}

export type RightdownConfig = RightdownConfigV1 | RightdownConfigV2;

export function isV2Config(config: RightdownConfig): config is RightdownConfigV2 {
  return 'version' in config && config.version === 2;
}