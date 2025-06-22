import { describe, it, expect } from 'vitest';
import { Result, isSuccess, isFailure } from '@outfitter/contracts';
import type { AppError } from '@outfitter/contracts';

// Base formatter interface (to be implemented)
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
  format(code: string, language: string, options?: Record<string, unknown>): Promise<Result<string, AppError>>;

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<string>;
}

// Mock implementation for testing
class MockFormatter implements IFormatter {
  constructor(
    public readonly name: string,
    private available: boolean = true,
    private version: string = '1.0.0'
  ) {}

  async isAvailable(): Promise<Result<boolean, AppError>> {
    // Will be implemented
    throw new Error('Not implemented');
  }

  async getVersion(): Promise<Result<string, AppError>> {
    // Will be implemented
    throw new Error('Not implemented');
  }

  async format(code: string, language: string): Promise<Result<string, AppError>> {
    // Will be implemented
    throw new Error('Not implemented');
  }

  getSupportedLanguages(): Array<string> {
    return ['javascript', 'typescript', 'json'];
  }
}

describe('IFormatter Interface', () => {
  it('should define the formatter interface', () => {
    const formatter = new MockFormatter('test');
    
    expect(formatter.name).toBe('test');
    expect(formatter.getSupportedLanguages()).toContain('javascript');
  });

  it('should check formatter availability', async () => {
    const availableFormatter = new MockFormatter('available', true);
    const unavailableFormatter = new MockFormatter('unavailable', false);
    
    const availableResult = await availableFormatter.isAvailable();
    expect(isSuccess(availableResult)).toBe(true);
    if (availableResult.success) {
      expect(availableResult.data).toBe(true);
    }
    
    const unavailableResult = await unavailableFormatter.isAvailable();
    expect(isSuccess(unavailableResult)).toBe(true);
    if (unavailableResult.success) {
      expect(unavailableResult.data).toBe(false);
    }
  });

  it('should get formatter version', async () => {
    const formatter = new MockFormatter('test', true, '2.5.0');
    const result = await formatter.getVersion();
    
    expect(isSuccess(result)).toBe(true);
    if (result.success) {
      expect(result.data).toBe('2.5.0');
    }
  });

  it('should format code', async () => {
    const formatter = new MockFormatter('test');
    const code = 'const x=1;';
    const result = await formatter.format(code, 'javascript');
    
    expect(isSuccess(result)).toBe(true);
    if (result.success) {
      expect(result.data).toBe('const x = 1;');
    }
  });

  it('should handle formatting errors', async () => {
    const formatter = new MockFormatter('test');
    const invalidCode = 'const x = {';
    const result = await formatter.format(invalidCode, 'javascript');
    
    expect(isFailure(result)).toBe(true);
    if (!result.success) {
      expect(result.error.code).toBe('FORMATTER_FAILED');
    }
  });
});