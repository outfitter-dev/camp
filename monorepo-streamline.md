# Monorepo Streamlining Plan

## Executive Summary

This document outlines a phased approach to modernize the Outfitter monorepo, implementing Turborepo, Cloudflare caching, Bun-native builds, and package consolidation while minimizing disruption.

## Open Questions & Recommendations

### 1. **ESM-Only Strategy**

**Q: Should we maintain CJS compatibility for a transition period, or go ESM-only immediately?**

- Consider: Do any downstream consumers still require CJS?
- Recommendation: ESM-only with clear migration guide

**Your answer:** Let's go ESM-only right now. We can always add back compatibility for specific packages later if needed.

### 2. **Package Consolidation Scope**

**Q: Should we keep `changeset-config` separate or merge it into `baselayer`?**

- Consider: It's stable and serves a distinct purpose
- Recommendation: Keep separate for clarity

**Your answer:** I'm fine with this.

### 3. **Multiple Entry Points**

**Q: How should we handle packages with multiple exports (like contracts) with Bun build?**

- Consider: Bun build is simpler but less flexible than tsup
- Recommendation: Use multiple bun build commands or keep tsup for complex packages

**Your answer:** Let's double check and be 100% sure that Bun can't handle what we want it to do in this case. Consider if turbo can handle this. And if neither is the case, then tsup could be a last-resort option but only for specific and complex situations.

### 4. **Development Workflow**

**Q: Should we use Turborepo for local development or just CI?**

- Consider: Added complexity vs speed gains
- Recommendation: Start with CI only, expand to local if beneficial

**Your answer:** I'd say let's do CI only. I've already got the .env file set up in the root for the remote cache and turned on the worker. I'm hoping it works!

### 5. **Markdown Tooling**

**Q: Keep Prettier for markdown until Biome supports it, or switch to a different tool?**

- Consider: Biome markdown support is planned but not ready
- Recommendation: Keep Prettier for now, revisit in 6 months

**Your answer:** Let's keep Prettier for now. Ensure that `proseWrap` is set to `never` in the config. We might optionally change that to `preserve` at some point.

## Phase 1: Foundation Setup (Low Risk)

### Objectives

- Add Turborepo without changing existing builds
- Set up Cloudflare remote caching
- Establish new Git hooks with Lefthook

### Tasks

IMPORTANT: Check off each item with `[x]` as you complete them.

#### 1.1 Install Core Dependencies

- [ ] Add Turborepo to root devDependencies
- [ ] Add Lefthook to replace Husky
- [ ] Add stylelint + PostCSS parser for Tailwind
- [ ] Update bunfig.toml if needed

#### 1.2 Create Turborepo Configuration

- [ ] Create `turbo.json` (see [Turborepo Config](#turborepo-config))
- [ ] Fix outputs configuration (remove .next/**, fix tsbuildinfo)
- [ ] Test with existing scripts
- [ ] Verify dependency graph is correct

#### 1.3 Set Up Cloudflare Cache

- [x] Deploy Cloudflare Worker (see [Cloudflare Setup](#cloudflare-setup))
- [x] Configure environment variables
- [ ] Test cache hits locally
- [ ] Verify TURBO_REMOTE_CACHE_SIGNATURE_KEY is set

#### 1.4 Migrate Git Hooks

- [ ] Create `.lefthook.yml` (see [Lefthook Config](#lefthook-config))
- [ ] Run `lefthook install`
- [ ] Remove Husky configuration
- [ ] Test all hooks work correctly

### Checkpoint 1 ✓

- [ ] All tests pass with `turbo run test`
- [ ] Git hooks trigger correctly
- [ ] Cloudflare cache shows hits in logs
- [ ] No changes to package builds yet

## Phase 2: Build System Migration (Medium Risk)

### Objectives

- Migrate from tsup to Bun build for simple packages
- Update all packages to ESM-only
- Establish pattern for complex packages

### ESM Migration Checklist

**Before starting Phase 2, be aware of these ESM requirements:**

| Step | Action | Common Gotcha |
|------|--------|---------------|
| `"type": "module"` | Add to all package.json files | Node treats `.js` as ESM now |
| Exports field | Change `"import"` to `"default"` | Drop `"require"` completely |
| Import extensions | Add `.js` to relative imports | TypeScript still uses `.ts` in source |
| Dynamic imports | Already ESM-compatible | No changes needed |
| Bin files | Update shebangs if needed | Use `#!/usr/bin/env bun` for CLI tools |
| Test framework | Vitest already supports ESM | Jest would need `--experimental-vm-modules` |
| Third-party tools | Check ESM compatibility | Most modern tools support it |

### Tasks

#### 2.1 Update Package.json Files

- [ ] Add `"type": "module"` to all packages (see [Package.json Updates](#packagejson-updates))
- [ ] Remove dual format exports
- [ ] Update file extensions in bin fields

#### 2.2 Migrate Simple Packages First

Start with packages that have single entry points:

- [ ] `biome-config` - Update build script (see [Simple Build Migration](#simple-build-migration))
- [ ] `typescript-config` - No build needed
- [ ] `changeset-config` - Update build script
- [ ] Test each package builds correctly

#### 2.3 Handle Complex Packages

For packages with multiple entry points:

- [ ] `contracts` - Create custom build script (see [Complex Build Migration](#complex-build-migration))
- [ ] Update tsup configs to ESM-only as interim step
- [ ] Test all entry points work

#### 2.4 Update Import Statements

- [ ] Fix any `.js` extension imports
- [ ] Update dynamic imports if needed
- [ ] Run type checking across all packages

### Checkpoint 2 ✓

- [ ] All packages build with either Bun or updated tsup
- [ ] Type definitions generate correctly
- [ ] All packages are ESM-only
- [ ] Import/export tests pass

## Phase 3: Package Consolidation (Medium Risk)

### Objectives

- Merge thin wrapper configs into baselayer
- Remove deprecated packages
- Simplify dependency tree

### Tasks

#### 3.1 Expand Baselayer

- [ ] Move biome-config logic into baselayer (see [Baselayer Expansion](#baselayer-expansion))
- [ ] Move prettier-config into baselayer
- [ ] Move remark-config into baselayer
- [ ] Update baselayer exports

#### 3.2 Update Dependent Packages

- [ ] Update imports in all packages
- [ ] Remove workspace dependencies to merged packages
- [ ] Update flint to use baselayer

#### 3.3 Remove Deprecated Packages

- [ ] Archive eslint-config
- [ ] Remove rightdown (after confirming no usage)
- [ ] Remove merged config packages
- [ ] Update workspace configuration

### Checkpoint 3 ✓

- [ ] Baselayer exports all configs correctly
- [ ] No broken imports
- [ ] Workspace installs cleanly
- [ ] All tests pass

## Phase 4: Optimization & Cleanup (Low Risk)

### Objectives

- Optimize Turborepo pipeline
- Update CI/CD
- Clean up remaining configuration

### Tasks

#### 4.1 Optimize Turborepo Pipeline

- [ ] Add better output caching rules
- [ ] Configure team settings
- [ ] Set up local caching

#### 4.2 Update GitHub Actions

- [ ] Update CI workflow (see [CI Configuration](#ci-configuration))
- [ ] Add Turbo team token
- [ ] Verify remote caching works

#### 4.3 Final Cleanup

- [ ] Remove old build artifacts
- [ ] Update documentation
- [ ] Create migration guide
- [ ] Tag releases

### Checkpoint 4 ✓

- [ ] CI runs significantly faster
- [ ] Local builds are simplified
- [ ] Documentation is updated
- [ ] Ready for release

## Configuration Files

### Biome Config (with Ultracite)

**File:** `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.1.2/schema.json",
  "extends": ["ultracite"],
  "json": {
    "parser": {
      "allowComments": true,
      "allowTrailingCommas": true
    }
  }
}
```

### Turborepo Config

**File:** `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  },
  "remoteCache": {
    "signature": true
  }
}
```

### Lefthook Config

**File:** `.lefthook.yml`

```yaml
# Lefthook configuration
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,ts,jsx,tsx,json}"
      run: bunx biome check --write {staged_files}
      stage_fixed: true
    markdown:
      glob: "*.md"
      run: |
        bunx prettier --write {staged_files} &&
        bunx markdownlint-cli2 {staged_files}
      stage_fixed: true

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit

pre-push:
  commands:
    types:
      run: turbo run type-check --affected
    test:
      run: turbo run test --affected
```

### Prettier Config

**File:** `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "proseWrap": "never",
  "endOfLine": "lf",
  "arrowParens": "always",
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "proseWrap": "never"
      }
    }
  ]
}
```

### Stylelint Config (for Tailwind)

**File:** `stylelint.config.js`

```javascript
export default {
  extends: ['stylelint-config-tailwindcss'],
  customSyntax: '@stylelint/postcss-css-in-js',
  rules: {
    'tailwindcss/classnames-order': 'warn'
  }
};
```

**Dependencies to install:**
```bash
bun add -D stylelint stylelint-config-tailwindcss @stylelint/postcss-css-in-js postcss
```

### Markdownlint Config

**File:** `.markdownlint.json`

```json
{
  "default": true,
  "line-length": false,
  "no-duplicate-heading": {
    "siblings_only": true
  }
}
```

### Package.json Updates

**Example for all packages:**

```diff
{
  "name": "@outfitter/example",
  "version": "1.0.0",
+ "type": "module",
  "main": "./dist/index.js",
- "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
-     "import": "./dist/index.mjs",
-     "require": "./dist/index.js"
+     "default": "./dist/index.js"
    }
  },
  "scripts": {
-   "build": "tsup",
+   "build": "bun build src/index.ts --outdir dist --target node",
+   "postbuild": "tsc --emitDeclarationOnly",
    "dev": "bun run --watch src/index.ts",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  }
}
```

### Simple Build Migration

**For packages with single entry:**

```bash
# Old tsup command
tsup src/index.ts --format esm,cjs

# New bun command
bun build src/index.ts --outdir dist --target node
```

### Complex Build Migration

**For contracts package with multiple entries:**

With Bun 1.2+, we can now handle multiple entries efficiently:

#### Option 1: Bun multi-entry build (recommended - Bun 1.2+)

```json
{
  "scripts": {
    "build": "bun run build:clean && bun run build:entries && bun run build:types",
    "build:clean": "rm -rf dist",
    "build:entries": "bun build src/index.ts src/error.ts src/result.ts src/assert.ts src/types/index.ts src/types/branded.ts --outdir dist --target node",
    "build:types": "tsc --emitDeclarationOnly"
  }
}
```

#### Option 2: Individual build scripts

```json
{
  "scripts": {
    "build": "bun run build:clean && bun run build:all && bun run build:types",
    "build:clean": "rm -rf dist",
    "build:all": "bun run build:index && bun run build:error && bun run build:result && bun run build:assert && bun run build:types-index && bun run build:types-branded",
    "build:index": "bun build src/index.ts --outdir dist --target node",
    "build:error": "bun build src/error.ts --outdir dist --target node",
    "build:result": "bun build src/result.ts --outdir dist --target node",
    "build:assert": "bun build src/assert.ts --outdir dist --target node",
    "build:types-index": "bun build src/types/index.ts --outdir dist/types --target node",
    "build:types-branded": "bun build src/types/branded.ts --outdir dist/types --target node",
    "build:types": "tsc --emitDeclarationOnly"
  }
}
```

#### Option 3 – Keep tsup for complex packages (last resort)

```json
{
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly"
  }
}
```

With updated tsup.config.ts:

```javascript
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/error.ts',
    'src/result.ts',
    'src/assert.ts',
    'src/types/index.ts',
    'src/types/branded.ts'
  ],
  format: ['esm'], // ESM only
  dts: false,
  clean: true,
  target: 'node18'
})
```

### Baselayer Expansion

**New structure for baselayer:**

```typescript
// packages/baselayer/src/configs/biome.ts
export const biomeConfig = {
  $schema: "https://biomejs.dev/schemas/2.1.2/schema.json",
  extends: ["ultracite"],
  json: {
    parser: {
      allowComments: true,
      allowTrailingCommas: true
    }
  }
};

// packages/baselayer/src/configs/prettier.ts
export const prettierConfig = {
  semi: true,
  singleQuote: true,
  proseWrap: 'never',
  // ... rest of config
};

// packages/baselayer/src/index.ts
export * from './configs/biome.js';
export * from './configs/prettier.js';
export * from './configs/remark.js';
```

### Cloudflare Setup

> [!IMPORTANT]
> ✅ THIS IS DONE
> `TURBO_API=https://turborepo-remote-cache.galligan.workers.dev`
> `TURBO_TEAM=team_outfitter`
> `TURBO_TOKEN` and `TURBO_REMOTE_CACHE_SIGNATURE_KEY` both set in `.env` and added to Cloudflare secrets

**Steps:**

```bash
# 1. Clone the worker template
git clone https://github.com/AdiRishi/turborepo-remote-cache-cloudflare.git
cd turborepo-remote-cache-cloudflare

# 2. Configure wrangler.toml
name = "outfitter-turbo-cache"
main = "src/index.ts"
compatibility_date = "2023-05-18"

[[r2_buckets]]
binding = "R2_CACHE"
bucket_name = "outfitter-turbo-cache"

# 3. Deploy
wrangler deploy

# 4. Set in repository
echo "TURBO_API=https://outfitter-turbo-cache.workers.dev" >> .env
```

### CI Configuration

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run CI
        run: turbo run lint type-check test build
        env:
          TURBO_API: ${{ secrets.TURBO_API }}
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: team_outfitter
          TURBO_REMOTE_CACHE_SIGNATURE_KEY: ${{ secrets.TURBO_REMOTE_CACHE_SIGNATURE_KEY }}
```

## Success Metrics

1. **Build Speed**: 50%+ faster CI builds with caching
2. **Package Count**: Reduce from 16 to ~10 packages
3. **Configuration Files**: Consolidate 5+ configs into baselayer
4. **Developer Experience**: Single build command, unified tooling
5. **Type Safety**: Maintained or improved with better ESM support

## Rollback Plan

If issues arise at any checkpoint:

1. Git history preserves all changes
2. Each phase can be reverted independently
3. Keep backup branch before starting
4. Document any downstream breaking changes

## Next Steps

1. Review and answer open questions above
2. Create feature branch: `feat/monorepo-streamline`
3. Start with Phase 1
4. Check in at each checkpoint
