# ADR-NNN: [Title]

**Status**: Proposed | Accepted | Deprecated | Superseded **Date**: YYYY-MM-DD
**Deciders**: [List of people involved]

## Context

[2-3 sentences on why this decision is needed now]

## Decision Drivers

1. **Scale**: [Current → Projected]
2. **Constraints**: [Technical, organizational]
3. **Trade-offs We're Willing to Make**: [Explicit list]

## Options Analysis

| Option | Pros | Cons | Complexity | Risk |
| ------ | ---- | ---- | ---------- | ---- |
| [A]    | ...  | ...  | Medium     | Low  |
| [B]    | ...  | ...  | High       | Med  |

## Decision

We will use Option [X]

[2-3 sentences with specific evidence and rationale]

## Consequences

### Positive

- [Benefit 1]
- [Benefit 2]

### Negative

- [Trade-off 1]
- [Trade-off 2]

### Neutral

- [Side effect 1]
- [Side effect 2]

## Implementation

```mermaid
graph LR
    A[Current State] -->|Week 1-2| B[Foundation]
    B -->|Week 3-4| C[Migration]
    C -->|Week 5| D[Validation]
    D -->|Week 6| E[Cleanup]
```

**Save as**: `docs/project/decisions/NNN-[title].md`
