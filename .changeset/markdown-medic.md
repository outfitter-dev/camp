---
"@outfitter/markdown-medic": minor
---

feat: add markdown-medic package for opinionated markdown linting

- New package providing advanced markdown linting and formatting
- Includes `mdlint` CLI tool for easy usage
- Three presets: strict, standard (default), and relaxed
- Custom rules beyond markdownlint:
  - consistent-terminology: Enforce correct spelling/capitalization
  - code-block-language: Require language tags on code blocks
  - frontmatter-required: Require YAML frontmatter
  - toc-required: Require TOC for long documents
  - no-dead-links: Check for broken local file links
- Auto-fix support for many issues
- Configurable via `.mdlint.yaml` files
- Can be installed globally or as a dev dependency