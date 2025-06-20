#!/usr/bin/env node
/**
 * Check for barrel imports from @outfitter/contracts
 * Encourages use of sub-path imports for better tree-shaking
 */

import { readFileSync, existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { globSync } from 'glob';

// ANSI color codes for consistent output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
} as const;

// More precise regex that handles various import patterns including:
// - Named imports: import { foo, bar } from '@outfitter/contracts'
// - Default imports: import contracts from '@outfitter/contracts'
// - Namespace imports: import * as contracts from '@outfitter/contracts'
// - Mixed imports: import contracts, { foo } from '@outfitter/contracts'
const BARREL_IMPORT_PATTERN = /import\s+(?:(?:\*\s+as\s+\w+)|(?:\w+(?:\s*,\s*\{\s*[^}]+\s*\})?)|(?:\{\s*[^}]+\s*\}))\s+from\s+['"]@outfitter\/contracts['"];?\s*$/gm;

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/out/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/__tests__/**',
  '**/test/**',
  '**/tests/**',
  '**/scripts/**',
  '**/*.d.ts',
] as const;

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'] as const;

// Available sub-path exports with descriptions
const SUB_PATH_EXPORTS = {
  '@outfitter/contracts/error': 'Error handling utilities (makeError, ErrorCode)',
  '@outfitter/contracts/result': 'Result type and utilities (Ok, Err, Result)',
  '@outfitter/contracts/assert': 'Assertion utilities and type guards',
  '@outfitter/contracts/branded': 'Branded type utilities for type safety',
  '@outfitter/contracts/types': 'General type utilities and helpers',
} as const;

interface ImportIssue {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly import: string;
  readonly suggestion: string;
}

interface CheckResult {
  readonly issues: readonly ImportIssue[];
  readonly filesScanned: number;
  readonly hasIssues: boolean;
}

/**
 * Generate a contextual suggestion for the barrel import based on import specifiers
 */
function generateSuggestion(importStatement: string): string {
  const specifierMatch = importStatement.match(/import\s+([^from]+)\s+from/);
  if (!specifierMatch) return 'Use sub-path imports';

  const specifier = specifierMatch[1].trim();
  if (specifier.includes('{')) {
    const namedImports = specifier
      .replace(/[{}]/g, '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const suggestions = namedImports.map(name => {
      if (/error|Error|makeError|ErrorCode/i.test(name)) return '@outfitter/contracts/error';
      if (/result|Result|Ok|Err/i.test(name)) return '@outfitter/contracts/result';
      if (/assert|Assert|guard|Guard/i.test(name)) return '@outfitter/contracts/assert';
      if (/brand|Brand|branded|Branded/i.test(name)) return '@outfitter/contracts/branded';
      return '@outfitter/contracts/types';
    });

    const uniqueSuggestions = [...new Set(suggestions)];
    return uniqueSuggestions.length === 1
      ? `import ${specifier} from '${uniqueSuggestions[0]}'`
      : `Split into: ${uniqueSuggestions.join(', ')}`;
  }

  return 'Use appropriate sub-path import (see available options below)';
}

/**
 * Find the exact position of an import in the file content
 */
function findImportPosition(content: string, importMatch: string): { line: number; column: number } {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedImport = importMatch.trim();
    const column = line.indexOf(trimmedImport);
    if (column !== -1) {
      return { line: i + 1, column: column + 1 };
    }
  }

  return { line: 1, column: 1 };
}

/**
 * Check a single file for barrel imports
 */
function checkFile(filePath: string): ImportIssue[] {
  try {
    if (!existsSync(filePath)) {
      console.warn(`${colors.yellow}Warning: File ${filePath} does not exist${colors.reset}`);
      return [];
    }

    const content = readFileSync(filePath, 'utf-8');
    const issues: ImportIssue[] = [];
    let match: RegExpExecArray | null;

    BARREL_IMPORT_PATTERN.lastIndex = 0;
    while ((match = BARREL_IMPORT_PATTERN.exec(content)) !== null) {
      const importStmt = match[0].trim();
      const pos = findImportPosition(content, importStmt);
      issues.push({
        file: filePath,
        line: pos.line,
        column: pos.column,
        import: importStmt,
        suggestion: generateSuggestion(importStmt),
      });
    }

    return issues;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`${colors.yellow}Warning: Failed to check file ${filePath}: ${msg}${colors.reset}`);
    return [];
  }
}

/**
 * Main function to check all files for barrel imports
 */
function checkImports(): CheckResult {
  const pattern = `**/*{${SUPPORTED_EXTENSIONS.join(',')}}`;
  const files = globSync(pattern, { ignore: IGNORE_PATTERNS, cwd: process.cwd(), absolute: false });

  if (files.length === 0) {
    console.warn(`${colors.yellow}Warning: No files found to check${colors.reset}`);
    return { issues: [], filesScanned: 0, hasIssues: false };
  }

  const allIssues: ImportIssue[] = [];
  for (const file of files) {
    allIssues.push(...checkFile(file));
  }

  return { issues: allIssues, filesScanned: files.length, hasIssues: allIssues.length > 0 };
}

/**
 * Format and display the results
 */
function displayResults(result: CheckResult): void {
  if (!result.hasIssues) {
    console.log(`${colors.green}✅ No barrel imports from @outfitter/contracts found${colors.reset}`);
    console.log(`${colors.dim}   Scanned ${result.filesScanned} files${colors.reset}`);
    return;
  }

  console.error(`\n${colors.red}❌ Found ${result.issues.length} barrel import(s) from @outfitter/contracts:${colors.reset}\n`);
  const issuesByFile = result.issues.reduce((acc, issue) => {
    const rel = relative(process.cwd(), resolve(issue.file));
    (acc[rel] ||= []).push(issue);
    return acc;
  }, {} as Record<string, ImportIssue[]>);

  for (const [file, issues] of Object.entries(issuesByFile)) {
    console.error(`  ${colors.red}📄 ${file}:${colors.reset}`);
    for (const issue of issues) {
      console.error(`    ${colors.dim}Line ${issue.line}:${issue.column}${colors.reset} - ${issue.import}`);
      console.error(`    ${colors.yellow}💡 ${issue.suggestion}${colors.reset}`);
    }
    console.error('');
  }

  console.error(`${colors.blue}📚 Available sub-path imports:${colors.reset}`);
  for (const [path, desc] of Object.entries(SUB_PATH_EXPORTS)) {
    console.error(`  ${colors.green}•${colors.reset} ${path} - ${colors.dim}${desc}${colors.reset}`);
  }
  console.error('');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log(`${colors.blue}🔍 Checking for barrel imports from @outfitter/contracts...${colors.reset}\n`);
  const result = checkImports();
  displayResults(result);
  if (result.hasIssues) process.exit(1);
}

if (require.main === module) {
  main().catch(err => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${colors.red}❌ Error checking imports: ${msg}${colors.reset}`);
    process.exit(1);
  });
}

export { checkImports, type ImportIssue, type CheckResult };