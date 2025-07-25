# Monorepo Restructure: Align with Preferred Tech Stack Guidelines

## Executive Summary

This proposal outlines a comprehensive restructuring of the Outfitter monorepo to align with the preferred tech stack guidelines defined in `@ai/rules/preferred-tech-stack.md`. The current organic growth has resulted in a structure that doesn't fully leverage the recommended monorepo patterns, particularly around the separation of development tools, reusable libraries, and configuration management.

## Motivation

The current monorepo structure has several organizational challenges:

1. **Mixed Responsibilities**: Development tools (CLIs) are mixed with reusable libraries in `packages/`
2. **Scattered Configuration**: Multiple `*-config` packages could be better organized
3. **Root-Level Clutter**: Configuration files scattered at repository root
4. **Non-Standard Structure**: Doesn't follow the preferred monorepo guidelines for scalability

## Current Structure Analysis

### Existing Layout
```text
outfitter-monorepo/
├── packages/                       # Mixed tools and libraries
│   ├── cli/                        # CLI tool (should be in tools/)
│   ├── flint/                      # CLI tool (should be in tools/)
│   ├── rightdown/                  # CLI tool (should be in tools/)
│   ├── baselayer/                  # Code generation tool
│   ├── fieldguides/                # Documentation system
│   ├── contracts/                  # Core library ✓
│   ├── contracts-zod/              # Extension library ✓
│   ├── biome-config/               # Config package
│   ├── eslint-config/              # Config package
│   ├── typescript-config/          # Config package
│   ├── prettier-config/            # Config package
│   ├── remark-config/              # Config package
│   ├── husky-config/               # Config package
│   ├── changeset-config/           # Config package
│   ├── formatting/                 # Utility library ✓
│   └── packlist/                   # Configuration manager ✓
├── ai/                             # AI-related files
├── docs/                           # Documentation ✓
├── scripts/                        # Automation scripts
├── biome.json                      # Root config files
├── eslint.config.mjs               # Root config files
├── prettier.config.ts              # Root config files
└── ...                            # Other root configs
```

### Issues with Current Structure

1. **Development tools mixed with libraries**: CLIs in `packages/` should be in `tools/`
2. **Configuration fragmentation**: Seven separate `*-config` packages
3. **Root config scatter**: Multiple configuration files at repository root
4. **Scalability concerns**: No clear path for future `apps/`, `services/`, or `infra/`

## Proposed Structure

### Target Layout
```text
outfitter-monorepo/
├── tools/                          # Development utilities & CLIs
│   ├── cli/                        # Outfitter CLI tool
│   ├── flint/                      # Formatting/linting setup
│   ├── rightdown/                  # Markdown formatter
│   ├── baselayer/                  # Code generation
│   ├── fieldguides/                # Documentation system
│   └── ai/                         # AI prompts & rules
├── packages/                       # Reusable libraries
│   ├── contracts/                  # Core Result patterns & types
│   │   └── typescript/            # TypeScript implementation
│   ├── contracts-zod/              # Zod extensions
│   ├── config/                     # Configuration packages (consolidated)
│   │   ├── biome/                  # Biome configurations
│   │   ├── eslint/                 # ESLint configurations
│   │   ├── typescript/             # TypeScript configurations
│   │   ├── prettier/               # Prettier configurations
│   │   ├── remark/                 # Remark configurations
│   │   ├── husky/                  # Git hooks
│   │   └── changeset/              # Version management
│   ├── formatting/                 # Formatting utilities
│   └── packlist/                   # Package management
├── config/                         # Shared project configurations
│   ├── biome.jsonc                 # Project Biome config
│   ├── eslint.config.mjs           # Project ESLint config
│   ├── prettier.config.ts          # Project Prettier config
│   ├── commitlint.config.mjs       # Commit linting
│   └── lint-staged.config.mjs      # Pre-commit hooks
├── docs/                           # Project documentation
├── scripts/                        # Automation scripts
├── ci/                             # CI/CD configurations (future)
├── package.json                    # Root workspace config
└── pnpm-workspace.yaml            # Workspace configuration
```

## Detailed Restructuring Plan

### Phase 1: Directory Structure Setup

**Create new directories:**
```bash
mkdir -p tools config packages/config
mkdir -p packages/config/{biome,eslint,typescript,prettier,remark,husky,changeset}
mkdir -p ci
```

### Phase 2: Move Development Tools to `tools/`

**Rationale**: These packages provide development utilities and CLIs, not reusable libraries.

```bash
# Move development tools
git mv packages/cli tools/
git mv packages/flint tools/
git mv packages/rightdown tools/
git mv packages/baselayer tools/
git mv packages/fieldguides tools/
git mv ai tools/
```

**Packages affected:**

- `packages/cli/` → `tools/cli/`
- `packages/flint/` → `tools/flint/`
- `packages/rightdown/` → `tools/rightdown/`
- `packages/baselayer/` → `tools/baselayer/`
- `packages/fieldguides/` → `tools/fieldguides/`
- `ai/` → `tools/ai/`

### Phase 3: Consolidate Configuration Packages

**Rationale**: Related configuration packages should be grouped under a single namespace.

```bash
# Move and consolidate config packages
git mv packages/biome-config/* packages/config/biome/
git mv packages/eslint-config/* packages/config/eslint/
git mv packages/typescript-config/* packages/config/typescript/
git mv packages/prettier-config/* packages/config/prettier/
git mv packages/remark-config/* packages/config/remark/
git mv packages/husky-config/* packages/config/husky/
git mv packages/changeset-config/* packages/config/changeset/

# Remove old directories
rm -rf packages/biome-config
rm -rf packages/eslint-config
rm -rf packages/typescript-config
rm -rf packages/prettier-config
rm -rf packages/remark-config
rm -rf packages/husky-config
rm -rf packages/changeset-config
```

**Package name changes:**

- `@outfitter/biome-config` → `@outfitter/config-biome`
- `@outfitter/eslint-config` → `@outfitter/config-eslint`
- `@outfitter/typescript-config` → `@outfitter/config-typescript`
- `@outfitter/prettier-config` → `@outfitter/config-prettier`
- `@outfitter/remark-config` → `@outfitter/config-remark`
- `@outfitter/husky-config` → `@outfitter/config-husky`
- `@outfitter/changeset-config` → `@outfitter/config-changeset`

### Phase 4: Move Root Configuration Files

**Rationale**: Centralize project-wide configuration files for better organization.

```bash
# Move root configuration files
git mv biome.json config/biome.jsonc
git mv eslint.config.mjs config/eslint.config.mjs
git mv prettier.config.ts config/prettier.config.ts
git mv commitlint.config.mjs config/commitlint.config.mjs
git mv lint-staged.config.mjs config/lint-staged.config.mjs
```

### Phase 5: Update Package References

**Files requiring updates:**

1. **`pnpm-workspace.yaml`**:
   ```yaml
   packages:
     - 'packages/*'
     - 'packages/config/*'
     - 'tools/*'
   ```

2. **Root `tsconfig.json`** - Update project references:
   ```json
   {
     "references": [
       { "path": "./packages/contracts/typescript" },
       { "path": "./packages/contracts-zod" },
       { "path": "./packages/config/typescript" },
       { "path": "./packages/config/biome" },
       { "path": "./packages/formatting" },
       { "path": "./packages/packlist" },
       { "path": "./tools/cli" },
       { "path": "./tools/flint" },
       { "path": "./tools/rightdown" },
       { "path": "./tools/baselayer" },
       { "path": "./tools/fieldguides" }
     ]
   }
   ```

3. **Configuration file paths** - Update imports to reference `config/` directory
4. **Package.json dependencies** - Update all workspace references
5. **Import statements** - Update all relative imports across packages
6. **Documentation** - Update all README files with new paths

### Phase 6: Package Renaming Strategy

**Configuration Packages:**

- Rename following pattern: `@outfitter/config-[tool]`
- Update all `extends` references in consuming projects
- Publish new versions with migration guides

**Tool Packages:**

- Consider whether tools should be published or internal-only
- If published, maintain backward compatibility during transition

## Benefits of Restructuring

### 1. **Clear Separation of Concerns**

- **Tools**: Development utilities, CLIs, and project-specific tooling
- **Packages**: Reusable libraries that can be published and consumed
- **Config**: Centralized configuration management

### 2. **Improved Scalability**

- Structure supports future additions of `apps/`, `services/`, `infra/`
- Clear patterns for where new packages/tools should go
- Easier to understand for new contributors

### 3. **Better Configuration Management**

- Related configurations grouped logically
- Easier to maintain and update
- Clear separation between project configs and publishable configs

### 4. **Standards Compliance**

- Aligns with preferred tech stack guidelines
- Follows established monorepo patterns
- Consistent with industry best practices

### 5. **Enhanced Developer Experience**

- Clearer mental model of repository structure
- Easier navigation and discovery
- Better IDE support with logical groupings

## Implementation Considerations

### Breaking Changes

**Published Packages:**

- Configuration packages will have new names
- Import paths will change
- Requires major version bumps

**Internal References:**

- All workspace dependencies need updates
- TypeScript project references require changes
- Build scripts and CI need adjustments

### Migration Timeline

**Phase 1: Preparation** (1 day)

- Create new directory structure
- Update workspace configuration

**Phase 2: Move Operations** (1 day)

- Execute git moves
- Update basic references

**Phase 3: Reference Updates** (2-3 days)

- Update all package.json files
- Fix import statements
- Update TypeScript references

**Phase 4: Testing & Validation** (1-2 days)

- Run full test suite
- Verify build processes
- Test publishing pipeline

**Phase 5: Documentation** (1 day)

- Update all README files
- Update architectural documentation
- Create migration guides

### Risk Mitigation

1. **Backup Strategy**: Create branch before restructuring
2. **Incremental Approach**: Move packages in logical groups
3. **Testing**: Validate each phase before proceeding
4. **Rollback Plan**: Document reverse operations
5. **Communication**: Update team on breaking changes

## Future Structure Extensions

The proposed structure provides clear paths for future growth:

```text
outfitter-monorepo/
├── apps/                           # Future: Deployable applications
│   ├── api/                        # Backend API
│   ├── web/                        # Frontend application
│   └── docs-site/                  # Documentation website
├── services/                       # Future: Long-lived processes
│   └── worker/                     # Background worker
├── infra/                          # Future: Infrastructure as code
│   ├── terraform/                  # Terraform configurations
│   └── docker/                     # Docker configurations
├── tests/                          # Future: Cross-cutting tests
│   ├── e2e/                        # End-to-end tests
│   └── integration/                # Integration tests
└── environments/                   # Future: Environment configs
    ├── local/
    ├── staging/
    └── production/
```

## Conclusion

This restructuring aligns the Outfitter monorepo with established best practices while maintaining all existing functionality. The changes provide a clearer mental model, better separation of concerns, and improved scalability for future growth.

The implementation requires careful coordination due to the breaking changes involved, but the long-term benefits of improved organization, maintainability, and adherence to standards justify the migration effort.

## Next Steps

1. **Review and approve** this proposal with the team
2. **Plan migration window** to minimize disruption
3. **Execute restructuring** following the phased approach
4. **Update CI/CD pipelines** to work with new structure
5. **Publish migration guides** for consuming projects
6. **Monitor** for any issues post-migration

---

**Author**: Claude Code Assistant  
**Date**: 2025-07-23  
**Status**: Proposal  
**Impact**: High - Breaking changes to repository structure