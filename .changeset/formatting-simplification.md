---
"@outfitter/formatting": major
---

feat(formatting): simplify to leverage Ultracite for zero-config setup

BREAKING CHANGES:
- Removed preset system (standard/strict/relaxed)
- Removed YAML preset parsing and inheritance
- Removed ESLint and Remark generators
- Removed code block formatting plugin
- Changed CLI from `setup` to `init` command

New approach:
- Single `init` command runs ultracite init + complementary tools
- Ultracite handles all JS/TS formatting and linting
- Prettier handles non-JS/TS files
- markdownlint-cli2 for markdown linting
- Adds EditorConfig, VS Code settings, and git attributes

Migration:
```bash
# Remove old package
pnpm remove @outfitter/formatting

# Install new version
pnpm add -D @outfitter/formatting@next

# Run new init command
npx @outfitter/formatting init
```