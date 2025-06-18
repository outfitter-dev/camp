---
"outfitter": minor
---

feat: add monorepo support to equip command

- Automatically detect workspace/monorepo environments
- Add `-w` flag for pnpm/yarn/npm when in workspace root (default behavior)
- Add `--filter <target>` option to install to specific workspace packages
- Add `--workspace-root` option to explicitly install to workspace root
- Show helpful context messages when operating in monorepo mode

This resolves the `ERR_PNPM_ADDING_TO_ROOT` error when using outfitter in monorepos.
