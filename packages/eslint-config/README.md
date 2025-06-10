# @outfitter/eslint-config

> Shared ESLint configuration for consistent code quality across Outfitter projects

## Installation

```bash
npm install --save-dev @outfitter/eslint-config
# or
pnpm add -D @outfitter/eslint-config
```

## Usage

### Modern Flat Config (Recommended)

Create an `eslint.config.mjs` file in your project root:

```javascript
import outfitterConfig from '@outfitter/eslint-config';

export default [
  ...outfitterConfig,
  {
    // Your custom rules here
  }
];
```

### Legacy Config (Deprecated)

For projects not yet using ESLint's flat config, create an `.eslintrc.js`:

```javascript
module.exports = {
  extends: ['@outfitter/eslint-config/legacy'],
  // Your custom rules here
};
```

## What's Included

This configuration includes:

- **TypeScript Support**: Full TypeScript linting with strict type checking
- **React & JSX**: React-specific rules and JSX syntax support
- **React Hooks**: Ensures correct usage of React hooks
- **Accessibility**: JSX accessibility rules via `eslint-plugin-jsx-a11y`
- **Import Management**: Import/export syntax validation and organization

### Key Rules

- **Type Safety**: Errors on `any` usage and non-null assertions
- **React 17+**: Configured for React 17+ (no need to import React)
- **Unused Variables**: Allows underscore-prefixed unused parameters
- **Import Resolution**: TypeScript-aware import resolution

## Peer Dependencies

This package requires:

- `eslint` (^8.0.0 or ^9.0.0)
- `typescript` (^5.0.0)

## Customization

Override any rules in your project's ESLint config:

```javascript
export default [
  ...outfitterConfig,
  {
    rules: {
      // Example: Allow console.log in development
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      
      // Example: Customize TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
    }
  }
];
```

## Migration Guide

### From Legacy to Flat Config

1. Rename `.eslintrc.*` to `eslint.config.mjs`
2. Convert the configuration:

```javascript
// Before (.eslintrc.js)
module.exports = {
  extends: ['@outfitter/eslint-config/legacy'],
  rules: {
    'no-console': 'warn'
  }
};

// After (eslint.config.mjs)
import outfitterConfig from '@outfitter/eslint-config';

export default [
  ...outfitterConfig,
  {
    rules: {
      'no-console': 'warn'
    }
  }
];
```

## Development

This package is part of the [@outfitter/camp](https://github.com/outfitter-dev/camp) monorepo.

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Type check
pnpm type-check
```

## License

MIT