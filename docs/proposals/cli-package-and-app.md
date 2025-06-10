# CLI: Package vs App Migration Proposal

## Summary

This proposal examines whether `@outfitter/cli` should remain in `packages/` as
a shared library or migrate to `apps/` as a standalone application, establishing
patterns for similar decisions across Outfitter projects.

## Current State

`@outfitter/cli` currently lives in `packages/cli/` and:

- Is published to npm as `@outfitter/cli`
- Can be installed globally via `npm install -g @outfitter/cli`
- Depends on `@outfitter/packlist` as a library
- Provides the `camp` command for managing development configurations

## Decision Framework

### When to use `packages/`

A CLI belongs in `packages/` when it:

- **Is consumed as a library** by other packages/apps
- **Exports reusable APIs** beyond just CLI commands
- **Provides programmatic interfaces** that other tools depend on
- **Shares core business logic** that needs to be accessible elsewhere

Examples:

- `@outfitter/packlist` - Core configuration logic used by CLI and potentially
  other tools
- Build tool CLIs that expose JavaScript APIs (like `esbuild`, `tsup`)
- Testing frameworks with both CLI and programmatic usage

### When to use `apps/`

A CLI belongs in `apps/` when it:

- **Is purely an end-user tool** with no library consumers
- **Has unique deployment requirements** (different Node version, special
  builds)
- **Contains application-specific logic** not reusable elsewhere
- **Needs isolated dependencies** that shouldn't affect other packages

Examples:

- Developer tools that only provide commands (like `create-react-app`)
- Internal company CLIs for specific workflows
- CLIs with heavy dependencies or native bindings

## Analysis for @outfitter/cli

### Arguments for keeping in `packages/`

1. **Potential for programmatic usage**: Other Outfitter tools might want to
   invoke camp operations programmatically
2. **Shared deployment model**: Published to npm like other packages
3. **Lightweight dependencies**: Only depends on other workspace packages and
   standard Node libraries
4. **Pattern consistency**: Establishes pattern for other tool CLIs in the
   monorepo

### Arguments for moving to `apps/`

1. **Primary usage is as CLI**: Most users will `npm install -g` and use
   commands
2. **No current library consumers**: No other packages import from
   `@outfitter/cli`
3. **Application-like lifecycle**: Has versions, releases, and user-facing
   changes
4. **Clear separation of concerns**: CLI is the delivery mechanism, `packlist`
   is the library

## Recommendation

**Keep `@outfitter/cli` in `packages/` for now**, but structure it to support
both CLI and programmatic usage:

```typescript
// packages/cli/src/index.ts
export * from './commands';
export * from './api';

// packages/cli/src/cli.ts (or bin/cli.ts)
#!/usr/bin/env node
import { program } from 'commander';
// CLI-specific setup
```

This approach:

- Maintains flexibility for future programmatic usage
- Follows established patterns in the ecosystem
- Allows easy migration to `apps/` later if needed
- Provides clear guidance for similar decisions

## Migration Path (if needed later)

If we later decide to move to `apps/`:

1. Create `apps/cli/` directory
2. Move CLI-specific code to `apps/cli/`
3. Extract any reusable logic to appropriate packages
4. Update build and publish configurations
5. Maintain backwards compatibility during transition

## Patterns for Other Projects

### Multi-language Projects (Go + TypeScript/React)

For projects with mixed languages:

```
monorepo/
├── apps/
│   ├── api/          # Go backend
│   │   ├── main.go
│   │   └── go.mod
│   └── tui/          # TypeScript/React frontend
│       ├── src/
│       └── package.json
├── packages/         # Shared TypeScript packages
│   ├── ui/
│   └── types/
└── tools/           # Build and development tools
```

Key considerations:

- Language-specific apps in `apps/` with their own build systems
- Shared TypeScript packages in `packages/`
- Clear build orchestration via Turbo or similar
- Separate dependency management per language

### Decision Checklist

When deciding package vs app placement:

- [ ] Will other packages/apps import this as a library?
- [ ] Does it export a programmatic API?
- [ ] Does it have unique deployment/runtime requirements?
- [ ] Is it primarily user-facing or developer-facing?
- [ ] Does it need isolated dependencies?
- [ ] Will it have a different release cycle?

If mostly "no" to first two and "yes" to others → `apps/` If mostly "yes" to
first two → `packages/`

## Next Steps

1. Document this pattern in monorepo standards
2. Add `apps/` directory to monorepo structure
3. Create examples for common patterns
4. Update build tooling to support both structures
