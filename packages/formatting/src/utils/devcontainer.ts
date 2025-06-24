/**
 * DevContainer utilities
 */

import type { FormatterDetection } from '../types/index.js';

/**
 * Get the appropriate base image based on available formatters
 */
export function getImageForFormatters(formatters: FormatterDetection): string {
  // If we have Node.js-based tools, use Node image
  if (formatters.prettier || formatters.remark) {
    return 'mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye';
  }
  
  // If only Biome, use a lighter base
  if (formatters.biome) {
    return 'mcr.microsoft.com/devcontainers/base:bullseye';
  }
  
  // Default to Node image for future compatibility
  return 'mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye';
}

/**
 * Determine if formatters need Node.js
 */
export function needsNodeJS(formatters: FormatterDetection): boolean {
  return !!(formatters.prettier || formatters.remark);
}

/**
 * Get recommended VS Code extensions for formatters
 */
export function getExtensionsForFormatters(formatters: FormatterDetection): string[] {
  const extensions: string[] = [];
  
  if (formatters.prettier) {
    extensions.push('esbenp.prettier-vscode');
  }
  
  if (formatters.biome) {
    extensions.push('biomejs.biome');
  }
  
  if (formatters.remark) {
    extensions.push('unifiedjs.vscode-remark');
  }
  
  // Always include these
  extensions.push(
    'editorconfig.editorconfig',
    'davidanson.vscode-markdownlint',
    'dbaeumer.vscode-eslint',
  );
  
  return extensions;
}