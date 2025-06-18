---
'@outfitter/md-medic': minor
---

feat: add md-medic package for opinionated markdown linting

- New package providing advanced markdown linting and formatting
- Includes `mdic` CLI tool (Markdown Inspect & Correct)
- Three presets: strict, standard (default), and relaxed
- Custom rules beyond markdownlint:
  - consistent-terminology: Enforce correct spelling/capitalization
- Auto-fix support for many issues
- Configurable via `.mdic.config.yaml` files
- Can be installed globally or as a dev dependency
