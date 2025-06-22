import { describe, it, expect } from 'vitest';
import * as rightdown from '../index.js';

describe('rightdown exports', () => {
  it('should export markdownlintCli2 object', () => {
    expect(rightdown).toHaveProperty('markdownlintCli2');
    expect(typeof rightdown.markdownlintCli2).toBe('object');
  });

  it('should export generateConfig function', () => {
    expect(rightdown).toHaveProperty('generateConfig');
    expect(typeof rightdown.generateConfig).toBe('function');
  });

  it('should export getPresetConfig function', () => {
    expect(rightdown).toHaveProperty('getPresetConfig');
    expect(typeof rightdown.getPresetConfig).toBe('function');
  });

  it('should export presets object', () => {
    expect(rightdown).toHaveProperty('presets');
    expect(rightdown.presets).toHaveProperty('strict');
    expect(rightdown.presets).toHaveProperty('standard');
    expect(rightdown.presets).toHaveProperty('relaxed');
  });

  it('should export defaultTerminology object', () => {
    expect(rightdown).toHaveProperty('defaultTerminology');
    expect(typeof rightdown.defaultTerminology).toBe('object');
  });

  it('should export type definitions', () => {
    // This just verifies the module loads without errors
    expect(rightdown).toBeDefined();
  });
});
