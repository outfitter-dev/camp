import { Result, type AppError } from '@outfitter/contracts';

/**
 * Base formatter interface for code formatting integrations
 */
export interface IFormatter {
  /**
   * Name of the formatter (e.g., 'prettier', 'biome')
   */
  readonly name: string;

  /**
   * Check if the formatter is available (installed)
   */
  isAvailable(): Promise<Result<boolean, AppError>>;

  /**
   * Get version information
   */
  getVersion(): Promise<Result<string, AppError>>;

  /**
   * Format code with the given language
   */
  format(
    code: string, 
    language: string, 
    options?: Record<string, unknown>
  ): Promise<Result<string, AppError>>;

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<string>;
}