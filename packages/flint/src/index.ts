/**
 * @outfitter/flint - Unified formatting and linting setup
 *
 * This is the programmatic API for Flint.
 * For CLI usage, use the `flint` command.
 */

export { init } from './commands/init.js';
export { clean } from './commands/clean.js';
export { doctor } from './commands/doctor.js';

// Export types
export type { InitOptions, CleanOptions, DoctorOptions } from './types.js';

// Export core utilities for programmatic usage
export * from './core/index.js';
export * from './utils/index.js';