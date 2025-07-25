---
"@outfitter/formatting": minor
---

Add markdownlint-cli2 as an alternative markdown formatter

- Added markdownlint-cli2 as a new formatter type alongside remark
- Implemented conflict detection to prevent using both remark and markdownlint-cli2
- Created markdownlint-cli2 configuration generator with standard/strict/relaxed presets
- Updated documentation to explain the choice between remark and markdownlint-cli2
- Enhanced code block formatting to support Python, Go, and Rust via Prettier
- Updated remark scripts to explicitly handle .md, .mdx, and .mdc file extensions