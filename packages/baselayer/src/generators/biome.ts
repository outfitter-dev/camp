import type { BiomeConfig, OutfitterConfig } from '../types/index.js';

/**
 * Type guard to check if a value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Type-safe deep merge utility for configuration objects
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

/**
 * Generates Biome configuration from OutfitterConfig
 *
 * @param config - The outfitter configuration object containing code style preferences
 * @returns A complete Biome configuration object with applied overrides
 * @throws {Error} If required configuration properties are missing or invalid
 */
export function generateBiomeConfig(config: OutfitterConfig): BiomeConfig {
  // Input validation
  if (!config || typeof config !== 'object') {
    throw new Error('Valid configuration object is required');
  }
  
  if (!config.codeStyle) {
    throw new Error('codeStyle configuration is required');
  }

  const { codeStyle, strictness = 'moderate', overrides } = config;

  // Validate codeStyle properties
  if (typeof codeStyle.indentWidth !== 'number' || codeStyle.indentWidth < 1) {
    throw new Error('Valid indentWidth (>= 1) is required');
  }
  
  if (typeof codeStyle.lineWidth !== 'number' || codeStyle.lineWidth < 1) {
    throw new Error('Valid lineWidth (>= 1) is required');
  }
  
  if (!['single', 'double'].includes(codeStyle.quoteStyle)) {
    throw new Error('quoteStyle must be either "single" or "double"');
  }

  // Base configuration from declarative preferences
  const baseConfig: BiomeConfig = {
    $schema: 'https://biomejs.dev/schemas/1.8.3.json',
    root: true,
    vcs: {
      enabled: true,
      clientKind: 'git',
      defaultBranch: 'main',
      useIgnoreFile: true,
    },
    formatter: {
      enabled: true,
      formatWithErrors: false,
      indentStyle: 'space',
      indentWidth: codeStyle.indentWidth,
      lineEnding: 'lf',
      lineWidth: codeStyle.lineWidth,
    },
    linter: {
      enabled: true,
      rules: generateLinterRules(strictness),
    },
    javascript: {
      formatter: {
        jsxQuoteStyle: codeStyle.quoteStyle === 'single' ? 'single' : 'double',
        quoteProperties: 'asNeeded',
        quoteStyle: codeStyle.quoteStyle,
        semicolons: codeStyle.semicolons,
        trailingCommas: codeStyle.trailingCommas,
        arrowParentheses: 'always',
      },
      parser: {
        unsafeParameterDecoratorsEnabled: true,
      },
    },
    json: {
      parser: {
        allowComments: true,
        allowTrailingCommas: true,
      },
    },
    files: {
      maxSize: 1048576,
      ignoreUnknown: false,
    },
  };

  // Apply overrides using type-safe deep merge
  const biomeOverrides = overrides?.biome ?? {};
  return deepMerge(baseConfig, biomeOverrides);
}

/**
 * Generate linter rules based on strictness level
 * @param strictness - The strictness level for linting rules ('relaxed', 'moderate', or 'pedantic')
 * @returns Configured linter rules object
 */
function generateLinterRules(strictness: OutfitterConfig['strictness']) {
  // Define base rules with proper const assertions for type safety
  const baseRules = {
    recommended: true as const,
    suspicious: {
      noExplicitAny: strictness === 'pedantic' ? 'error' : 'warn' as const,
      noConsole: 'off' as const, // Allow console in development
      noArrayIndexKey: 'warn' as const,
      noAssignInExpressions: 'warn' as const,
    },
    style: {
      noParameterAssign: 'error' as const,
      useConst: 'error' as const,
    },
    complexity: {
      noBannedTypes: 'error' as const,
      noUselessConstructor: 'error' as const,
    },
    correctness: {
      noUnusedVariables: strictness === 'relaxed' ? 'warn' : 'error' as const,
      noUnusedFunctionParameters: 'warn' as const,
    },
    performance: {
      noAccumulatingSpread: 'error' as const,
      noDelete: 'error' as const,
    },
    security: {
      noDangerouslySetInnerHtml: 'error' as const,
    },
    nursery: {} as Record<string, unknown>,
  };

  // Create a deep copy to avoid mutating the base rules
  const rules = structuredClone(baseRules);

  // Apply strictness-specific overrides
  switch (strictness) {
    case 'pedantic':
      rules.suspicious.noConsole = 'error';
      rules.correctness.noUnusedFunctionParameters = 'error';
      break;
    case 'relaxed':
      rules.suspicious.noExplicitAny = 'off';
      rules.correctness.noUnusedVariables = 'warn';
      break;
    // 'moderate' uses base configuration
  }

  return rules;
}