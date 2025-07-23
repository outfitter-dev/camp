# Preferred Tech Stack

## General

- Guiding principles: Best tool for the job

## TypeScript Projects

- Build with the [monorepo structure](#monorepo-structure) in mind
- Use the preferred [package management](#package-management) details

### Monorepo Structure

- Follow the monorepo structure below
- Not all projects will need all directories, use your best judgement
- **Rules of Thumb:**
  - End-user deliverable? → `apps/`  
  - Business logic or data models? → `packages/`
  - Infrastructure or ops? → `infra/`
  - Documentation? → `docs/`
  - Tool or utility for project-wide development? → `tools/`
- **Simplify when it makes sense:**
  - `worker/` → `apps/` if nothing else in `services/`

```text
project/
 ├── apps/                          # All deployable applications
 │   ├── api/                       # Backend API
 │   ├── cli/                       # Command-line interface
 │   ├── desktop/                   # Desktop app (Tauri)
 │   ├── docs/                      # Documentation website (Astro Starlight)
 │   ├── mobile/                    # Mobile app (React Native, Expo, etc.)
 │   ├── web/                       # Frontend web app (Next.js, TanStack, etc.)
 │   └── ...
 ├── packages/                      # Reusable libraries and shared code
 │   ├── ai/                        # Shared AI services
 │   ├── api-client/                # Generated/typed API client
 │   ├── auth/                      # Authentication/authorization logic
 │   ├── config/                    # Shared configuration schemas
 │   ├── database/                  # Database schemas, migrations, ORM setup
 │   ├── encryption/                # Encryption services
 │   ├── logger/                    # Logging utilities
 │   ├── notification/              # Notification services
 │   ├── testing/                   # Shared test utilities, fixtures
 │   ├── ui/                        # Shared UI components
 │   ├── utils/                     # Shared utilities, helper functions, etc.
 │   └── ...
 ├── services/                      # Background jobs or services that run as long-lived processes
 │   ├── worker/                    # Background worker (Bun, Hono, Cloudflare Workers, etc.)
 │   └── ...
 ├── docs/                          # Project documentation
 │   ├── api/                       # API documentation
 │   ├── architecture/              # Diagrams & system design
 │   ├── decisions/                 # ADRs (Architecture Decision Records)
 │   ├── deployment/                # Deployment guides
 │   └── development/               # Local dev setup
 ├── tests/                         # Integration & E2E tests that span apps
 │   ├── e2e/                       # End-to-end tests
 │   ├── integration/               # Integration tests
 │   └── performance/               # Performance tests
 ├── environments/                  # Environment-specific configs
 │   ├── local/
 │   ├── staging/
 │   └── production/
 ├── infra/                         # Infrastructure as code
 │   ├── terraform/                 # Terraform configurations
 │   ├── docker/                    # Docker configurations
 │   └── k8s/                       # Kubernetes manifests
 ├── data/                          # Static data, fixtures, seeds
 ├── assets/                        # Images, fonts, media (if not app-specific)
 ├── schemas/                       # API schemas, OpenAPI specs, GraphQL
 ├── scripts/                       # Project-wide automation scripts
 ├── tools/                         # CLI utilities, scripts, etc. for development
 ├── ci/                            # CI/CD configuration
 │   ├── workflows/                 # GitHub Actions
 │   └── scripts/                   # Utility scripts, helpers for build & deploy
 ├── config/                        # Shared configuration files
 │   ├── tsconfig.base.json         # Base TypeScript configs
 │   ├── vitest.base.json           # Base TypeScript configs
 │   ├── editorconfig.base.json     # Base editorconfig configs
 │   ├── vscode-settings.base.json  # Base VSCode settings
 │   ├── prettier.base.json         # Base prettier configs
 │   ├── stylelint.base.json        # Base stylelint configs
 │   └── other configs...
 ├── types/                         # Shared TypeScript types
 ├── .changeset/                    # Version management (if using changesets)
 │
 ├── biome.jsonc                    # Code formatting
 ├── package.json                   # Root package configuration
 ├── README.md                      # Project README
 └── ...
```

### Package Management

- Use: Bun Workspaces, Turborepo, GitHub Actions

### Package Naming Conventions

Use scoped packages with consistent naming:

```typescript
// In package.json names:
"@company/ui"           // UI components
"@company/api-client"   // API client  
"@company/auth"         // Authentication
"@company/database"     // Database utilities
"@company/utils"        // General utilities
"@company/config"       // Configuration schemas
"@company/logger"       // Logging utilities
```

### Structure Guidelines

**Key Principles:**

- Not all projects need all directories - use judgment
- Keep related functionality together
- Separate deployable apps from reusable packages
- Environment-specific configs in dedicated directories
- Infrastructure as code in `infra/`
- Cross-cutting concerns in `packages/`

**Build Artifacts:**

- Build outputs go to `dist/` or `build/` within each package/app
- Use `.gitignore` to exclude build artifacts
- Consider caching strategies for CI/CD performance

**Testing Strategy:**

- Unit tests: Within each package/app
- Integration tests: In root `tests/` directory
- E2E tests: In `tests/e2e/` for full user journeys
- Performance tests: In `tests/performance/`