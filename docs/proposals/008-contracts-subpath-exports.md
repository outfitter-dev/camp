# Proposal 008: Sub-path Exports for @outfitter/contracts

**Status**: Draft  
**Author**: Max (Claude Code)  
**Date**: 2025-01-19  
**Reviewers**: TBD

## Summary

Add sub-path exports to `@outfitter/contracts` for fine-grained imports while maintaining backward compatibility. This enables better tree-shaking and bundle optimization for browser/lambda consumers without breaking existing usage.

## Problem Statement

Currently, `@outfitter/contracts` only exports through a root barrel (`src/index.ts`), which has several limitations:

1. **Bundle bloat**: Consumers importing a single function pull in the entire package
2. **Tree-shaking limitations**: Some bundlers struggle with deep barrel exports
3. **Performance impact**: Particularly problematic for browser apps and serverless functions
4. **Development experience**: Harder to understand actual dependencies

Example current usage that imports everything:
```typescript
import { makeError, success, failure } from '@outfitter/contracts';
// ^ Bundles ALL contract utilities, not just these three functions
```

## Proposed Solution

### Core Approach

Add well-named sub-path entry points while keeping the root barrel intact:

```typescript
// New sub-path imports (tree-shakable)
import { makeError } from '@outfitter/contracts/error';
import { success, failure } from '@outfitter/contracts/result';
import { assert } from '@outfitter/contracts/assert';
import { Branded } from '@outfitter/contracts/types';

// Existing barrel import (still works)
import { makeError, success, failure } from '@outfitter/contracts';
```

### Sub-path Structure

The sub-paths map 1-for-1 to the existing file structure:

- `@outfitter/contracts/error`   → AppError helpers
- `@outfitter/contracts/result`  → Result-pattern utilities  
- `@outfitter/contracts/assert`  → assert and assertNever helpers
- `@outfitter/contracts/branded` → branded-type utilities
- `@outfitter/contracts/types`   → general utility types (DeepReadonly, etc.)

## Implementation Details

### Build Configuration Changes

**1. Update tsup config** (`packages/contracts/typescript/tsup.config.ts`):
```diff
export default defineConfig({
- entry: ['src/index.ts'],
+ entry: [
+   'src/index.ts',            // root barrel
+   'src/error.ts',
+   'src/result.ts', 
+   'src/assert.ts',
+   'src/types/index.ts',
+   'src/types/branded.ts',
+ ],
  format: ['cjs', 'esm'],
  treeshake: true,         // ensure per-entry shakeability
  splitting: false,        // avoid a shared chunk that defeats tree-shaking
  dts: true,               // emit declaration files alongside JS
  // ... rest unchanged
});
```

**2. Add package.json exports** (`packages/contracts/typescript/package.json`):
```json
{
  "exports": {
    ".": {
      "types":   "./dist/index.d.ts",
      "import":  "./dist/index.mjs", 
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./error": {
      "types":   "./dist/error.d.ts",
      "import":  "./dist/error.mjs",
      "require": "./dist/error.js",
      "default": "./dist/error.js"
    },
    "./result": {
      "types":   "./dist/result.d.ts",
      "import":  "./dist/result.mjs",
      "require": "./dist/result.js",
      "default": "./dist/result.js"
    },
    "./assert": {
      "types":   "./dist/assert.d.ts",
      "import":  "./dist/assert.mjs",
      "require": "./dist/assert.js",
      "default": "./dist/assert.js"
    },
    "./branded": {
      "types":   "./dist/types/branded.d.ts",
      "import":  "./dist/types/branded.mjs",
      "require": "./dist/types/branded.js",
      "default": "./dist/types/branded.js"
    },
    "./types": {
      "types":   "./dist/types/index.d.ts",
      "import":  "./dist/types/index.mjs",
      "require": "./dist/types/index.js",
      "default": "./dist/types/index.js"
    }
  },
  "sideEffects": false
}
```

### TypeScript Compatibility

Existing build process (`tsc --emitDeclarationOnly`) will automatically generate matching `.d.ts` files for all entry points.

### Node & Tooling Compatibility

Sub-path exports require one of the following:

* **Node.js ≥ 14.13** (or ≥ 12.20 with the `--experimental-exports` flag)
* A bundler that understands the *exports* field (webpack 5, Rollup ≥ 2.4, esbuild, Vite, etc.)

For older environments:

1. Consumers can continue to import the root barrel (`require('@outfitter/contracts')`) – this path remains CommonJS-compatible.
2. Jest 26/27 requires `jest-resolve` ≥ 28 or the [`jest-node-exports-resolver`](https://github.com/jestjs/jest/issues/9771) workaround.

The package.json will include an `"engines": { "node": ">=14.13" }` entry to make the requirement explicit.

## Migration Strategy

### Phase 1: Non-Breaking Release (v1.1.0)

1. **Ship sub-path exports** - Add new import paths
2. **Maintain root barrel** - Existing imports continue working
3. **Update documentation** - Add migration examples
4. **Internal testing** - Verify both import styles work

### Phase 2: Gradual Adoption

1. **Tooling guidance** - Provide ESLint/Biome rules for new projects
2. **Automated migration** - Codemod for existing codebases
3. **Bundle size measurement** - Quantify tree-shaking improvements

### Phase 3: Future Deprecation (v2.0.0+)

1. **Deprecation warnings** - Add to root barrel imports (≥6 months notice)
2. **Community feedback** - Assess adoption before removing
3. **Optional removal** - Only if high adoption and clear benefits

## Cross-Linting Compatibility

### Problem
Our monorepo uses Biome, but external teams may use ESLint and want consistent import standards.

### Solution: Multi-Tool Documentation

Provide clear guidance for popular linting tools:

**ESLint users:**
```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    paths: [{
      name: '@outfitter/contracts',
      message: 'Use sub-path imports (@outfitter/contracts/error) for better tree-shaking'
    }],
    patterns: [{
      group: ['@outfitter/contracts/*'],
      message: 'Prefer the dedicated sub-path instead of a deep relative import'
    }]
  }]
}
```

**Biome users (v2.0+):**
```json
{
  "linter": {
    "rules": {
      "nursery/noRestrictedImports": {
        "level": "error", 
        "options": {
          "paths": {
            "@outfitter/contracts": "Use sub-path imports for better tree-shaking"
          }
        }
      }
    }
  }
}
```

**Biome users (v1.x):**
- Documentation-based guidance
- Optional ESLint bridge for enforcement

## Automated Migration

### Codemod Script

Provide `ts-morph` based codemod for automatic migration:

```typescript
// scripts/migrate-contracts-imports.ts
const symbolToSubpath: Record<string, string> = {
  // Result pattern
  success: 'result',
  failure: 'result', 
  isSuccess: 'result',
  isFailure: 'result',
  
  // Error handling
  makeError: 'error',
  isAppError: 'error',
  toAppError: 'error',
  
  // Assertions
  assert: 'assert',
  assertNever: 'assert',
  
  // Types
  Brand: 'types',
  Branded: 'types',
};

// Implementation converts:
// import { makeError, success } from '@outfitter/contracts';
// 
// To:
// import { makeError } from '@outfitter/contracts/error';
// import { success } from '@outfitter/contracts/result';
```

Usage:
```bash
pnpm run migrate:contracts-imports
```

## Testing Strategy

### Backward Compatibility Tests
```typescript
// Ensure root barrel still works
import * as rootImports from '@outfitter/contracts';
import * as errorImports from '@outfitter/contracts/error';

test('root barrel includes all exports', () => {
  expect(rootImports.makeError).toBeDefined();
  expect(rootImports.success).toBeDefined();
  // ... verify all symbols exist
});

test('sub-path exports work correctly', () => {
  expect(errorImports.makeError).toBe(rootImports.makeError);
  // ... verify symbol equivalence
});
```

### Bundle Size Testing
- Measure bundle size with/without sub-path imports
- Document tree-shaking improvements
- Test across popular bundlers (webpack, rollup, esbuild)

## Risks and Mitigations

### Risk: Build Complexity
**Impact**: More entry points = longer builds, more complex output **Mitigation**: Measure build time impact, optimize if needed

### Risk: Maintenance Overhead  
**Impact**: More exports to test and maintain **Mitigation**: Automated testing for all entry points, clear ownership

### Risk: Tool Compatibility
**Impact**: Some bundlers might not handle exports correctly **Mitigation**: Test with popular tools, provide fallback documentation

### Risk: Developer Confusion
**Impact**: Two ways to import the same symbols **Mitigation**: Clear migration guide, consistent documentation

### Risk: Semantic-Versioning Drift
**Impact**: Once a sub-path is published, its removal would constitute a **breaking** change. Forgetting this could lead to inadvertent majors. **Mitigation**: Treat every new sub-path export as part of the public API surface and document it in the contracts changelog. Add an automated check in CI that blocks deleting or renaming an existing export path without a major-version label.

## Success Metrics

1. **Bundle size reduction**: Measure tree-shaking improvements in real projects
2. **Adoption rate**: Track usage of sub-path vs barrel imports
3. **Community feedback**: Monitor issues/questions about imports  
4. **Build performance**: Ensure no significant build time regression

## Timeline

### Week 1: Implementation
- [ ] Update build configuration
- [ ] Add package.json exports
- [ ] Verify output structure
- [ ] Add backward compatibility tests

### Week 2: Documentation & Tooling
- [ ] Update README with migration examples
- [ ] Create codemod script
- [ ] Add linting guidance for multiple tools
- [ ] Internal monorepo testing

### Week 3: Release & Migration
- [ ] Ship v1.1.0 with sub-path exports
- [ ] Update internal projects using codemod
- [ ] Measure bundle size improvements
- [ ] Gather feedback from early adopters

### Future: Deprecation (TBD)
- [ ] Monitor adoption metrics
- [ ] Consider deprecating root barrel in v2.0.0+
- [ ] Maintain backward compatibility until high adoption

## Alternatives Considered

### 1. Split into Multiple Packages
**Pros**: Maximum granularity, clear separation **Cons**: Version management complexity, more publishing overhead **Decision**: Sub-path exports provide similar benefits with less complexity

### 2. Keep Current Barrel-Only Approach
**Pros**: Simple, no migration needed  
**Cons**: Bundle bloat continues, performance impact for browser/lambda **Decision**: Benefits of tree-shaking outweigh migration costs

### 3. Major Breaking Change (v2.0.0)
**Pros**: Forces adoption, cleaner long-term **Cons**: Breaks existing consumers, adoption friction **Decision**: Non-breaking approach better for gradual migration

## Open Questions

1. **Enforcement timing**: When should we add linting rules to discourage barrel imports?
2. **Deprecation timeline**: How long to maintain dual import support?
3. **Bundle size targets**: What level of improvement justifies the complexity?
4. **Tool support**: Should we create shared configs for popular linting tools?

## Conclusion

Sub-path exports provide a clear path to better bundle optimization while maintaining backward compatibility. The implementation is low-risk with high potential benefits for performance-sensitive consumers.

The approach aligns with modern package design patterns (React, Next.js, etc.) and provides a foundation for future package architecture decisions.

**Recommendation**: Proceed with implementation as outlined, starting with non-breaking v1.1.0 release.