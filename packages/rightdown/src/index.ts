// Main exports for programmatic usage

// Core functionality
export { ConfigReader } from './core/config-reader.js';
export { ConfigCompiler } from './core/config-compiler.js';
export { Orchestrator } from './core/orchestrator.js';
export type { OrchestratorOptions, FormatResult } from './core/orchestrator.js';
export type { RightdownConfig, TerminologyRule } from './core/types.js';
export { RIGHTDOWN_ERROR_CODES } from './core/errors.js';

// Formatters
export type { IFormatter, FormatOptions, FormatResult as FormatterResult } from './formatters/base.js';
export { PrettierFormatter } from './formatters/prettier.js';
export { BiomeFormatter } from './formatters/biome.js';

// Processors
export { AstProcessor } from './processors/ast.js';
export type { CodeBlock, ExtractResult } from './processors/ast.js';

// Legacy exports for backward compatibility
export { default as markdownlintCli2 } from 'markdownlint-cli2';
export {
  defaultTerminology,
  generateConfig,
  type MdlintConfig,
  type GeneratorOptions,
} from './config-generator.js';
export type { PresetName } from './presets/index.js';
export { getPresetConfig, presets } from './presets/index.js';
export { customRulePaths } from './utils/paths.js';