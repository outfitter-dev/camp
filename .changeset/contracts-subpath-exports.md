---
"@outfitter/contracts": minor
---

Add sub-path exports for fine-grained imports and better tree-shaking

You can now import from specific modules to reduce bundle size:

```typescript
// New sub-path imports (tree-shakable)
import { makeError } from '@outfitter/contracts/error';
import { success, failure } from '@outfitter/contracts/result';
import { assert } from '@outfitter/contracts/assert';
import { createUserId } from '@outfitter/contracts/branded';
import { DeepReadonly } from '@outfitter/contracts/types';

// Existing barrel import (still works)
import { makeError, success, failure } from '@outfitter/contracts';
```

This is a non-breaking change - all existing imports continue to work. The sub-path exports enable better tree-shaking and smaller bundles for applications that only use a subset of the utilities.

Note: Sub-path exports require Node.js ≥ 14.13 or a modern bundler that supports the package.json "exports" field.