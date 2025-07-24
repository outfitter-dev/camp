# Monorepo Update

## 1. Objectives & Guiding Principles

- **Simplify** — prune every config or package that is just a thin wrapper.
- **Speed** — Bun for bundling + Turborepo w/ Cloudflare remote cache.
- **Separation of concerns** — format ≠ lint ≠ test; keep each tool in its sweet spot.
- **ESM-only** — every package `"type":"module"`; ship `.js` bundles only. No `.mjs` needed on modern Node (≥ 20) or Bun.

## 2. Package-Level Actions

| Keep                                                                   | Merge into **baselayer**                                                               | Remove                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `contracts`, `contracts-zod`, `cli`, `packlist`, `flint`, `formatting` | `biome-config`, `changeset-config`, `husky-config`, `remark-config`, `prettier-config` | `rightdown`, all `remark-*` deps, `eslint-config`, `husky` |

_Why_

- Husky is gone → Lefthook binary + YAML is enough.
- Rightdown & Remark go until Biome gains Markdown formatting (not yet) ([GitHub][1]).
- ESLint/Prettier configs are redundant once Biome/Prettier live in **baselayer**.

## 3. Updated Toolchain Matrix

| Purpose   | Tool                                                                                  | Notes                                                                        |
| --------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Build     | **`bun build`**                                                                       | Replace `tsup`. One step per package: `bun build src/index.ts --outdir dist` |
| Types     | `tsc --emitDeclarationOnly`                                                           | Turbo task `types` before `build`                                            |
| Format    | **Biome** (`js/ts/json/jsx`), **Prettier v3** (md/yaml), **stylelint** (CSS/Tailwind) |                                                                              |
| Lint      | **Biome lint**, `markdownlint-cli2`, `stylelint`                                      |                                                                              |
| Git hooks | **Lefthook** (Go binary) + **Commitlint**                                             |                                                                              |
| Tests     | **Vitest** (unit/integration) + **Playwright** (E2E) ([Strapi][2])                    |                                                                              |

## 4. Configuration Files (root)

```jsonc
// turbo.jsonc
{
  "pipeline": {
    "format": { "outputs": [] },
    "lint": { "dependsOn": ["format"], "outputs": [] },
    "types": { "outputs": ["{packages,apps}/*/dist/**/*.d.ts"] },
    "build": {
      "dependsOn": ["^build", "types"],
      "outputs": ["{packages,apps}/*/dist/**"],
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["{packages,apps}/*/coverage/**"],
    },
  },
  "remoteCache": {
    "url": "https://<your-worker>.workers.dev", // deploy step below
    "staffAuthentication": false,
  },
}
```

```yaml
# .lefthook.yml
pre-commit:
  parallel: true
  commands:
    biome_format:
      run: bunx biome format --write {staged_files}
    biome_lint:
      run: bunx biome lint --no-errors-on-unmatched-files {staged_files}
    styles:
      run: bunx stylelint {staged_files} --fix
    markdown:
      run: bunx markdownlint-cli2 {staged_files}
commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit $1
```

```js
// commitlint.config.js (ESM works when loaded via Node ≥20)
export default { extends: ['@commitlint/config-conventional'] };
```

```js
// stylelint.config.js
export default {
  extends: ['stylelint-config-tailwindcss'],
  rules: { 'tailwindcss/classnames-order': 'warn' },
};
```

```json
// biome.json  (workspace-aware)
{
  "$schema": "https://biomejs.dev/schemas/1.0.0/schema.json",
  "formatter": { "enabled": true },
  "linter": { "rules": { "nursery/useConsistentReactImports": "warn" } },
  "files": {
    "ignore": ["dist/**", "coverage/**", "*.md", "*.yaml", "*.yml"]
  }
}
```

```js
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**'],
  },
});
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'bun run dev', port: 3000 },
  reporter: [['html', { open: 'never' }]],
});
```

## 5. Cloudflare Remote Cache Setup

```bash
# 1 · Deploy worker
npx wrangler init turbo-cache
# copy repo https://github.com/AdiRishi/turborepo-remote-cache-cloudflare
wrangler deploy
# 2 · Link turbo
turbo login && turbo link
# 3 · env var in CI
export TURBO_API="https://<worker>.workers.dev"
```

Cloudflare Worker template provides R2 or KV storage options ([GitHub][3], [adirishi.github.io][4]).

## 6. CI (GitHub Actions)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: oven-sh/setup-bun@v1
    with: { bun-version: 'latest' }
  - run: bun install --frozen-lockfile
  - run: turbo run lint types build test --team outfitter
    env:
      TURBO_API: ${{ secrets.TURBO_API }}
```

## 7. Simplified Package Scripts

```jsonc
{
  "scripts": {
    "format": "biome format .",
    "lint": "biome lint . && markdownlint-cli2 . && stylelint \"**/*.{css,scss,pcss}\"",
    "types": "tsc -b",
    "build": "bun build src/index.ts --outdir dist",
    "test": "vitest",
    "test:e2e": "playwright test",
    "release": "turbo run build && changeset version && changeset publish",
  },
}
```

## 8. Edge-Case Notes & Caveats

- **Node shim still required** for Commitlint CLI inside Lefthook; keep Node ≥ 20 in dev containers ([GitHub][5]).
- **Markdown**: stick with Prettier + markdownlint until Biome lands support (issue open) ([GitHub][1]).
- **Browser tests**: Vitest’s browser mode still experimental; Playwright is stable for CI runs ([vitest.dev][6], [Strapi][2]).
- **Remote cache**: free KV tier OK for small artifacts; use R2 for > 10 MB entries ([adirishi.github.io][7]).

## 9. Next Steps Checklist

1. Remove deprecated packages & deps from `package.json`/`bunfig.toml`.
2. Merge configs into **baselayer**; bump internal imports.
3. Add above config files; run `lefthook install`.
4. Deploy Cloudflare worker & set `TURBO_API`.
5. Convert each package: `tsup → bun build` and drop CJS entrypoints.
6. Push branch; verify Turbo cache hits in CI.

Once those boxes are ticked, you’ll have a leaner, faster, easier-to-reason-about monorepo — ready for Bun-powered local dev that mirrors your Cloudflare-accelerated CI. Let me know if any edge case (e.g., downstream consumers requiring CJS) still matters and we’ll adapt the plan!

[1]: https://github.com/biomejs/biome/discussions/923?utm_source=chatgpt.com 'Does biome support formatting of markdown files? #923 - GitHub'
[2]: https://strapi.io/blog/nextjs-testing-guide-unit-and-e2e-tests-with-vitest-and-playwright?utm_source=chatgpt.com 'Nextjs Testing Guide: Unit and E2E Tests with Vitest & Playwright'
[3]: https://github.com/AdiRishi/turborepo-remote-cache-cloudflare?utm_source=chatgpt.com 'AdiRishi/turborepo-remote-cache-cloudflare - GitHub'
[4]: https://adirishi.github.io/turborepo-remote-cache-cloudflare/?utm_source=chatgpt.com 'Turborepo Remote Cache'
[5]: https://github.com/evilmartians/lefthook/issues/688?utm_source=chatgpt.com 'Not working with bun without node · Issue #688 · evilmartians/lefthook'
[6]: https://vitest.dev/guide/browser/?utm_source=chatgpt.com 'Browser Mode | Guide - Vitest'
[7]: https://adirishi.github.io/turborepo-remote-cache-cloudflare/introduction/getting-started?utm_source=chatgpt.com 'Getting Started | Turborepo Remote Cache - GitHub Pages'
