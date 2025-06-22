import { readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { 
  Result, 
  success, 
  failure, 
  makeError,
  type AppError 
} from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from './errors.js';
import { 
  type RightdownConfig, 
  type RightdownConfigV2,
  isV2Config 
} from './types.js';

export class ConfigReader {
  /**
   * Read and parse a Rightdown configuration file
   */
  async read(path: string): Promise<Result<RightdownConfig, AppError>> {
    try {
      // Check if file exists
      if (!existsSync(path)) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.FILE_NOT_FOUND,
            `Configuration file not found: ${path}`
          )
        );
      }

      // Read file contents
      const content = readFileSync(path, 'utf-8');

      // Parse YAML
      let config: unknown;
      try {
        config = yaml.load(content);
      } catch (error) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_YAML,
            'Failed to parse YAML configuration',
            { path },
            error as Error
          )
        );
      }

      // Validate config
      return this.validateConfig(config);
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.IO_ERROR,
          'Failed to read configuration file',
          { path },
          error as Error
        )
      );
    }
  }

  /**
   * Validate a configuration object
   */
  validateConfig(config: unknown): Result<RightdownConfig, AppError> {
    if (!config || typeof config !== 'object') {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
          'Configuration must be an object'
        )
      );
    }

    const configObj = config as Record<string, unknown>;

    // Check if it's a v2 config
    if ('version' in configObj) {
      return this.validateV2Config(configObj);
    }

    // Otherwise, treat as v1
    return this.validateV1Config(configObj);
  }

  /**
   * Validate v1 configuration
   */
  private validateV1Config(config: Record<string, unknown>): Result<RightdownConfig, AppError> {
    // Validate preset if present
    if (config.preset !== undefined) {
      const validPresets = ['strict', 'standard', 'relaxed'];
      if (!validPresets.includes(config.preset as string)) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `Invalid preset: ${config.preset}. Must be one of: ${validPresets.join(', ')}`
          )
        );
      }
    }

    // Validate rules if present
    if (config.rules !== undefined && typeof config.rules !== 'object') {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
          'Rules must be an object'
        )
      );
    }

    // Validate ignores if present
    if (config.ignores !== undefined) {
      if (!Array.isArray(config.ignores)) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            'Ignores must be an array'
          )
        );
      }
      if (!config.ignores.every(item => typeof item === 'string')) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            'All ignore patterns must be strings'
          )
        );
      }
    }

    // Validate terminology if present
    if (config.terminology !== undefined) {
      const result = this.validateTerminology(config.terminology);
      if (!result.success) {
        return result;
      }
    }

    return success(config as RightdownConfig);
  }

  /**
   * Validate v2 configuration
   */
  private validateV2Config(config: Record<string, unknown>): Result<RightdownConfig, AppError> {
    // Check version
    if (config.version !== 2) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.UNSUPPORTED_VERSION,
          `Unsupported configuration version: ${config.version}. Only version 2 is supported.`
        )
      );
    }

    // Validate preset if present
    if (config.preset !== undefined) {
      const validPresets = ['strict', 'standard', 'relaxed'];
      if (!validPresets.includes(config.preset as string)) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `Invalid preset: ${config.preset}. Must be one of: ${validPresets.join(', ')}`
          )
        );
      }
    }

    // Validate formatters if present
    if (config.formatters !== undefined) {
      const result = this.validateFormatters(config.formatters);
      if (!result.success) {
        return result;
      }
    }

    // Validate formatterOptions if present
    if (config.formatterOptions !== undefined) {
      if (typeof config.formatterOptions !== 'object' || config.formatterOptions === null) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            'formatterOptions must be an object'
          )
        );
      }
    }

    // Validate output if present
    if (config.output !== undefined) {
      const result = this.validateOutput(config.output);
      if (!result.success) {
        return result;
      }
    }

    // Validate common fields (same as v1)
    const v1Result = this.validateV1Config(config);
    if (!v1Result.success) {
      return v1Result;
    }

    return success(config as RightdownConfigV2);
  }

  /**
   * Validate formatters configuration
   */
  private validateFormatters(formatters: unknown): Result<void, AppError> {
    if (typeof formatters !== 'object' || formatters === null) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
          'formatters must be an object'
        )
      );
    }

    const formattersObj = formatters as Record<string, unknown>;

    // Validate default formatter if present
    if (formattersObj.default !== undefined && typeof formattersObj.default !== 'string') {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
          'formatters.default must be a string'
        )
      );
    }

    // Validate languages if present
    if (formattersObj.languages !== undefined) {
      if (typeof formattersObj.languages !== 'object' || formattersObj.languages === null) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            'formatters.languages must be an object'
          )
        );
      }

      const languages = formattersObj.languages as Record<string, unknown>;
      for (const [lang, formatter] of Object.entries(languages)) {
        if (typeof formatter !== 'string') {
          return failure(
            makeError(
              RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
              `formatters.languages.${lang} must be a string`
            )
          );
        }
      }
    }

    return success(undefined);
  }

  /**
   * Validate output configuration
   */
  private validateOutput(output: unknown): Result<void, AppError> {
    if (typeof output !== 'object' || output === null) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
          'output must be an object'
        )
      );
    }

    const outputObj = output as Record<string, unknown>;
    const booleanFields = ['diagnostics', 'progress', 'color'];

    for (const field of booleanFields) {
      if (outputObj[field] !== undefined && typeof outputObj[field] !== 'boolean') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `output.${field} must be a boolean`
          )
        );
      }
    }

    return success(undefined);
  }

  /**
   * Validate terminology configuration
   */
  private validateTerminology(terminology: unknown): Result<void, AppError> {
    if (!Array.isArray(terminology)) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
          'terminology must be an array'
        )
      );
    }

    for (let i = 0; i < terminology.length; i++) {
      const term = terminology[i];
      if (typeof term !== 'object' || term === null) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}] must be an object`
          )
        );
      }

      const termObj = term as Record<string, unknown>;
      
      if (typeof termObj.incorrect !== 'string') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}].incorrect must be a string`
          )
        );
      }

      if (typeof termObj.correct !== 'string') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}].correct must be a string`
          )
        );
      }

      if (termObj.caseSensitive !== undefined && typeof termObj.caseSensitive !== 'boolean') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}].caseSensitive must be a boolean`
          )
        );
      }
    }

    return success(undefined);
  }

  /**
   * Type guard for v2 config
   */
  isV2Config(config: RightdownConfig): config is RightdownConfigV2 {
    return isV2Config(config);
  }
}