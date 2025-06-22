# ADR-0020: `@outfitter/contracts-effect` — Effect-powered runtime layer

- **Status**: Proposed
- **Date**: 2025-06-22
- **Deciders**: Max

---

## Objective

Introduce a **new workspace package** – `@outfitter/contracts-effect` – that layers the
[`effect`](https://github.com/Effect-TS/effect) runtime on top of our existing
`@outfitter/contracts` primitives. This gives teams an **opt-in** path to fibers,
structured concurrency, resource-safe scopes and richer error diagnostics while
keeping the current lightweight, zero-dependency `contracts` package intact.

## Motivation

| Need | How Effect Helps |
| --- | --- |
| Parallel API calls, cancellation, retries | Fibers, `Effect.retry`, cancellation tokens |
| Rich error context | `Cause<E>` chain vs. flat `AppError` |
| Plumbing resources (DB pools, file handles) safely | `Scope`, `Layer` |
| Composition with third-party libs | Ecosystem already provides `@effect/schema`, `@effect/stream`, etc. |

At the same time, most services only need the simple `Result` pattern.  Isolating
Effect in its *own* package prevents unnecessary dependency weight for those
consumers and lets adoption happen incrementally.

## Scope & Deliverables

```
packages/contracts-effect/
├─ src/
│  ├─ conversions.ts     // Result ↔ Effect helpers
│  ├─ errors.ts          // AppError ↔ Cause mapping
│  ├─ prelude.ts         // re-export Effect, pipe, Layer, etc.
│  └─ index.ts           // public barrel (exports everything above)
├─ tsconfig.json         // extends shared @outfitter/typescript-config/base.json
└─ package.json          // deps: effect, @outfitter/contracts
```

### Key API surface

```ts
// Result → Effect (failures become Effect.fail)
export function fromResult<A>(r: Result<A, AppError>): Effect.Effect<AppError, A>;

// Effect → Result (runs effect, returns Success/Failure)
export async function effectToResult<A>(fx: Effect.Effect<AppError, A>): Promise<Result<A, AppError>>;

// Lift AppError mapping into Effect domain
export const mapAppError: <A>(
  fn: (e: AppError) => AppError,
) => (fx: Effect.Effect<AppError, A>) => Effect.Effect<AppError, A>;

// Dependency-injection helpers
export type AppLayer<R> = Layer.Layer<never, never, R>;
```

### Tooling

* Add package to **root `tsconfig.references`** and `pnpm` workspace.  
* Copy build script pattern: `tsup && tsc --emitDeclarationOnly`.  
* Optional: lint script `scripts/check-contracts-effect-imports.ts` mirroring the
  existing import-hygiene checker.

## Adoption Path

1. **Non-breaking**: existing code keeps using `Result`.
2. New code may call `fromResult` for interop or write native Effect code:  

   ```ts
   const userFx = fromResult(findUser(id));
   const enriched = Effect.flatMap(userFx, enrichProfile);
   ```
3. Once mature, teams may refactor core flows entirely into Effect.

## Timeline (draft)

| Week | Activities |
| --- | --- |
| 0-1 | Design spike, gather feedback, finalise API |
| 2   | Implementation + unit tests (Vitest) |
| 3   | Docs, CI integration, publish `0.1.0-alpha` |
| 4-5 | Dog-food in CLI & Baselayer packages; fix gaps |
| 6   | Tag `1.0.0`, announce to all teams |

## Success Criteria

* Package adds **< 20 kB** gzipped to consumers that import it.
* At least one production service migrates a workflow to Effect with no
  regressions.
* Developers report simpler parallel / retry logic compared to Promises.
* No build-time or bundle-size impact for packages that do **not** import it.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| **Learning curve** for FP concepts | Internal workshop, cheat-sheets |
| Upstream Effect still 0.x / 2.x | Keep adapter thin; version pin + renovate alerts |
| Two abstractions (`Result` & `Effect`) coexist | Guidelines: *Result for simple sync, Effect for async/parallel* |

## Alternatives Considered

1. **Fold Effect helpers into `@outfitter/contracts`** – forces the dependency on
   every consumer; violates single-purpose principle.
2. **Remain Promise-only** – limits future scalability and leads to many
   bespoke concurrency utilities.

---

### Decision requested

Approve creation of `packages/contracts-effect` under the scope and timeline
outlined above.
