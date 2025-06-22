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

## CLI Contract

Rightdown 2.1 must remain drop-in compatible with the existing CLI while surfacing the
new functionality.  The following contract is **binding** for the first public beta
(`2.1.0-beta.1`) and therefore drives the automated test-suite.

### Commands & Flags

| Command / Flag            | Alias | Description                                                                |
|---------------------------|-------|----------------------------------------------------------------------------|
| `rightdown`              |       | Lint/format all Markdown files (respecting `preset` or config file)        |
| `rightdown --fix`        | `-f`  | Format in-place (structure **and** code-blocks)                            |
| `rightdown --check`      | `-c`  | Run in CI mode: no writes, non-zero exit on any difference                 |
| `rightdown --init [lvl]` |       | Scaffold `.rightdown.config.yaml` (`lvl` = `strict|standard|relaxed`)       |
| `rightdown --config <p>` | `-C`  | Use explicit config path                                                   |
| `rightdown --version`    | `-v`  | Print version + detected tool versions (Prettier, Biome, markdownlint)     |

### Exit Codes

| Code | Meaning                                |
|------|----------------------------------------|
| 0    | No issues detected                     |
| 1    | Lint/formatting errors found           |
| 2    | Configuration error or invalid flag    |
| 3    | Unexpected runtime error              |

The exit-code matrix is used by both CI fixtures and unit tests (see **Testing
Strategy**).

## Definition of Done (DoD)

The feature is considered **complete** when ALL items are ✅.

1. ✅ `rightdown --fix` formats code-blocks for the languages defined in the
   default schema (JS/TS/JSON/YAML/HTML/CSS/Markdown).
2. ✅ `.rightdown.config.yaml` v2 is validated against a JSON schema at runtime;
   helpful diagnostics are printed on failure.
3. ✅ v1 config files continue to work unchanged.
4. ✅ Generated configs are written **only** when `--write-configs` is passed;
   otherwise they are built in-memory.
5. ✅ Optional Biome peer-dependency is lazily required; a clear warning is shown
   if a user assigns `biome` as a formatter but the package is missing.
6. ✅ Performance: formatting the fixture set (<250 files, 1 CPU core) completes
   in ≤1.5× the time of running raw markdownlint-cli2 alone.
7. ✅ Test coverage ≥ 90 % on core orchestrator, formatters, and CLI flags.
8. ✅ Documentation (README & website) updated and migration guide published.

## Risk Register

| Risk                                      | Impact | Likelihood | Mitigation                                         |
|-------------------------------------------|--------|------------|----------------------------------------------------|
| Biome size inflates install footprint     | High   | Medium     | Peer-dependency, lazy import, document tree-shaking|
| Formatter version conflicts               | Medium | Medium     | Pin recommended versions in generated `package.json`|
| Prettier v3 ESM-only in Node <18          | High   | Low        | Document minimum engine, load via dynamic import   |
| Large monorepos → OOM when compiling configs | Medium | Low     | Stream processing & file chunking                  |
| Unformatted exotic languages              | Low    | High       | Fallback : skip with verbose warning               |


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

*(See the detailed Definition-of-Done checklist above for the authoritative
criteria.)*