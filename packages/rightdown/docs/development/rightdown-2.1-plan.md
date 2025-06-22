# Rightdown 2.1 Development Plan

## Overview

This document tracks the development of Rightdown 2.1, which transforms the tool from a markdownlint wrapper into a unified Markdown formatting orchestrator.

## Architecture

### Core Components

```text
rightdown/
├── src/
│   ├── core/
│   │   ├── config-reader.ts      # Reads .rightdown.config.yaml
│   │   ├── config-compiler.ts    # Generates tool-specific configs
│   │   └── orchestrator.ts       # Coordinates all tools
│   ├── formatters/
│   │   ├── base.ts              # Base formatter interface
│   │   ├── prettier.ts          # Prettier integration
│   │   ├── biome.ts            # Biome integration
│   │   └── markdownlint.ts    # Existing markdownlint wrapper
│   ├── processors/
│   │   ├── code-block.ts       # Extract/replace code blocks
│   │   └── remark.ts          # Future: Remark AST processing
│   └── cli/
│       └── commands/
│           └── format.ts       # Enhanced format command
```

### Config Schema (Draft)

```yaml
# .rightdown.config.yaml
version: 2
preset: standard

# Markdown structure rules (markdownlint)
rules:
  blanks-around-lists: true
  single-trailing-newline: true

# Code block formatting
formatters:
  # Default formatter for unknown languages
  default: prettier
  
  # Language-specific formatters
  languages:
    javascript: biome
    typescript: biome
    jsx: biome
    tsx: biome
    json: biome
    jsonc: biome
    yaml: prettier
    css: prettier
    html: prettier
    markdown: prettier  # For nested markdown

# Formatter-specific options
formatterOptions:
  prettier:
    printWidth: 80
    tabWidth: 2
    semi: true
  biome:
    # Biome-specific options
    indentStyle: space
    indentWidth: 2

# Output configuration
output:
  # Where to write generated configs (optional)
  configs:
    markdownlint: .markdownlint-cli2.jsonc
    prettier: false  # Don't generate, use API
    biome: false     # Don't generate, use API
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up new directory structure
- [ ] Create base formatter interface
- [ ] Implement config reader for v2 schema
- [ ] Add version detection (v1 vs v2 configs)

### Phase 2: Prettier Integration (Week 2)
- [ ] Add Prettier as dependency
- [ ] Implement code block extraction/replacement
- [ ] Create Prettier formatter adapter
- [ ] Test with various code block languages

### Phase 3: Biome Integration (Week 3)
- [ ] Add Biome as optional peer dependency
- [ ] Create Biome formatter adapter
- [ ] Implement language routing logic
- [ ] Test JS/TS formatting

### Phase 4: Orchestration (Week 4)
- [ ] Build orchestrator to coordinate tools
- [ ] Implement parallel processing for performance
- [ ] Add progress reporting
- [ ] Handle errors gracefully

### Phase 5: Polish & Release (Week 5-6)
- [ ] Backward compatibility with v1 configs
- [ ] Migration guide and tooling
- [ ] Performance optimization
- [ ] Comprehensive test suite
- [ ] Documentation updates

## Technical Decisions

### Dependencies
- **Required**: markdownlint-cli2, prettier
- **Optional**: @biomejs/biome (peer dependency)
- **Future**: remark, remark-parse, remark-stringify

### Breaking Changes
- None! v1 configs continue to work
- v2 features require explicit version declaration
- Gradual migration path provided

### Performance Considerations
- Parallelize code block formatting
- Cache formatted results
- Lazy load optional formatters
- Stream processing for large files

## Testing Strategy

### Unit Tests
- Config reading/compilation
- Individual formatter adapters
- Code block extraction/replacement
- Error handling

### Integration Tests
- Full formatting pipeline
- Multiple formatters together
- Large file handling
- Edge cases (empty blocks, nested languages)

### E2E Tests
- CLI commands with various options
- Real-world markdown files
- Performance benchmarks

## Next Steps

1. Create feature branch ✓
2. Set up development environment
3. Start with config reader implementation
4. Build incrementally, test thoroughly

## Success Criteria

- [ ] Single command formats everything
- [ ] Performance comparable to individual tools
- [ ] Clear migration path from v1
- [ ] No breaking changes
- [ ] Comprehensive test coverage
- [ ] Well-documented APIs