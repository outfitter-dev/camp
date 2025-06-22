# Proposal: Consolidate Markdown Formatting Under Rightdown

## Summary

This proposal outlines a plan to consolidate all markdown formatting and linting under `@outfitter/rightdown`, eliminating redundancy in our formatting toolchain and providing a single source of truth for markdown processing.

## Current State

### Formatter Responsibilities
1. **Biome**: Formats JS/TS/JSON files (primary formatter)
2. **Prettier**: Only formats YAML files (mostly redundant)
3. **markdownlint-cli2**: Lints markdown but doesn't format
4. **rightdown**: Currently a wrapper around markdownlint-cli2

### Issues with Current Approach
- Two formatters running in parallel (Biome + Prettier) when Prettier does very little
- Markdown files are only linted, not properly formatted
- No unified markdown processing tool with both linting and formatting
- Prettier configuration explicitly ignores most file types, making it redundant

## Proposed Changes

### 1. Enhance Rightdown
Transform rightdown from a simple wrapper into a comprehensive markdown processor:

```typescript
// New rightdown capabilities
export interface RightdownCapabilities {
  // Existing (from markdownlint-cli2)
  lint: boolean;
  fix: boolean;
  
  // New formatting features
  format: {
    smartTypography: boolean;    // Convert quotes, dashes, ellipses
    codeBlocks: boolean;         // Format and validate code blocks
    terminology: boolean;        // Enforce consistent terminology
    tableAlignment: boolean;     // Align markdown tables
    listFormatting: boolean;     // Consistent list formatting
  };
  
  // Enhanced features
  watch: boolean;              // Watch mode for continuous formatting
  dryRun: boolean;            // Preview changes without applying
}
```

### 2. Update Scripts
Modify package.json scripts to use rightdown for all markdown operations:

```json
{
  "scripts": {
    // Before
    "format": "biome format . && prettier --check .",
    "format:fix": "biome format . --write && prettier --write .",
    "lint:md": "markdownlint-cli2",
    
    // After
    "format": "biome format . && rightdown --check",
    "format:fix": "biome format . --write && rightdown --fix --format",
    "lint:md": "rightdown --lint-only"
  }
}
```

### 3. Migration Path

#### Phase 1: Feature Parity (Week 1-2)
- Add formatting capabilities to rightdown
- Ensure rightdown can handle all current markdownlint-cli2 use cases
- Add smart typography and code block formatting

#### Phase 2: Integration (Week 3)
- Update all package.json scripts to use rightdown
- Update CI/CD pipelines
- Migrate existing markdown lint configs to rightdown format

#### Phase 3: Cleanup (Week 4)
- Remove markdownlint-cli2 dependencies
- Evaluate if Prettier is still needed (only for YAML)
- Update documentation

### 4. Configuration Migration
Convert existing markdownlint configs to rightdown format:

```yaml
# .rightdown.config.yaml
extends: standard
formatting:
  smartTypography: true
  codeBlocks:
    validateLanguage: true
    formatContent: false  # Don't format code inside blocks
  terminology:
    - incorrect: "NPM"
      correct: "npm"
    - incorrect: "Javascript"
      correct: "JavaScript"
rules:
  MD013: false  # Line length (let editor wrap)
  MD033: false  # Allow HTML
```

## Benefits

1. **Single Source of Truth**: One tool for all markdown processing
2. **Enhanced Capabilities**: Formatting beyond what markdownlint provides
3. **Reduced Dependencies**: Remove markdownlint-cli2, potentially Prettier
4. **Consistent Experience**: Same tool for linting and formatting
5. **Performance**: One tool pass instead of multiple
6. **Customization**: Outfitter-specific markdown rules and formatting

## Risks and Mitigation

### Risk 1: Feature Gaps
**Mitigation**: Implement features incrementally, maintain backward compatibility during transition

### Risk 2: Breaking Existing Workflows
**Mitigation**: Provide migration guide, support both old and new configs temporarily

### Risk 3: Maintenance Burden
**Mitigation**: Keep rightdown as a thin wrapper where possible, contribute fixes upstream

## Implementation Details

### Core Features to Implement

1. **Smart Typography Transformer**
   ```typescript
   // Convert straight quotes to smart quotes
   // Convert -- to em dash, ... to ellipsis
   ```

2. **Code Block Enhancer**
   ```typescript
   // Validate language tags
   // Add missing language tags based on content
   // Format fence style (``` vs ~~~)
   ```

3. **Terminology Enforcer**
   ```typescript
   // Use existing consistent-terminology rule
   // Add auto-fix capability
   ```

4. **Table Formatter**
   ```typescript
   // Align columns
   // Consistent spacing
   // Fix malformed tables
   ```

### Configuration Schema
```typescript
interface RightdownConfig {
  extends?: 'strict' | 'standard' | 'relaxed';
  rules?: Record<string, boolean | any>;
  formatting?: {
    enable?: boolean;
    smartTypography?: boolean;
    codeBlocks?: {
      validateLanguage?: boolean;
      defaultLanguage?: string;
      formatContent?: boolean;
    };
    tables?: {
      align?: boolean;
      padding?: number;
    };
    lists?: {
      markerStyle?: 'consistent' | 'dash' | 'asterisk' | 'plus';
      indentSize?: number;
    };
  };
  terminology?: Array<{
    incorrect: string;
    correct: string;
    caseSensitive?: boolean;
  }>;
  ignores?: string[];
}
```

## Alternative Approaches Considered

1. **Keep Current Setup**: Rejected due to redundancy and lack of formatting
2. **Use Prettier for Markdown**: Rejected because it doesn't understand markdown semantics
3. **Build From Scratch**: Rejected due to maintenance burden

## Success Criteria

1. All markdown files pass formatting checks
2. No regression in existing lint rules
3. Improved markdown consistency across the monorepo
4. Reduced formatting time by 20%+
5. Single command for all markdown operations

## Timeline

- **Week 1-2**: Implement core formatting features
- **Week 3**: Integration and testing
- **Week 4**: Migration and cleanup
- **Week 5**: Documentation and training

## Next Steps

1. Review and approve this proposal
2. Create detailed technical design
3. Set up feature branch for development
4. Begin Phase 1 implementation

---

**Author**: Assistant  
**Date**: 2024-12-22  
**Status**: Draft  
**Related**: ADR-0007 (Rightdown Design)