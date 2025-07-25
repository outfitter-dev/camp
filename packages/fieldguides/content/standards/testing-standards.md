---
slug: testing-standards
title: Test JavaScript/TypeScript apps with modern testing tools
description: Testing patterns and tools for comprehensive test coverage in JS/TS.
type: convention
---

# Testing Library Standards

Testing patterns, tools, and best practices for JavaScript/TypeScript applications.

## Related Documentation

- [Unit Testing Patterns](../patterns/testing-unit.md) - Component and function testing
- [Integration Testing](../patterns/testing-integration.md) - Multi-component testing
- [E2E Testing](../patterns/testing-e2e.md) - Full application testing
- [CI/CD Integration](../patterns/github-actions.md) - Running tests in pipelines
- [Testing React Components](../patterns/testing-react-components.md) - React component testing
- [TypeScript Standards](./typescript-standards.md) - Type-safe testing patterns
- [React Component Standards](./react-component-standards.md) - Component testing strategies
- [Configuration Standards](./configuration-standards.md) - Testing configurations
- [Deployment Standards](./deployment-standards.md) - Testing in CI/CD
- [Monorepo Standards](./monorepo-standards.md) - Testing across packages
- [Documentation Standards](./documentation-standards.md) - Test documentation

## Version Compatibility

This guide assumes:

- Vitest: 1.0+ (recommended test runner)
- Jest: 29.0+ (alternative test runner)
- TypeScript: 5.0+ (for type-safe testing)
- @testing-library/react: 14.0+ (for component testing)
- MSW: 2.0+ (for API mocking)
- Node.js: 18+ (for test runner features)
- @faker-js/faker: 8.0+ (for test data generation)

## Core Philosophy

### Test-Driven Development (TDD)

Follow the Red-Green-Refactor cycle for all new development:

1. **Red** - Write a failing test that captures the requirement
2. **Green** - Implement the minimum code to make the test pass
3. **Refactor** - Improve the design while keeping tests green

```typescript
// 📚 Educational: TDD Red-Green-Refactor example
// 1. Write the test first (RED)
describe('calculateDiscount', () => {
  it('should apply percentage discount to price', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });
});

// 2. Run test - it fails ❌
// 3. Implement minimal code (GREEN)
function calculateDiscount(price: number, percentage: number): number {
  return price - (price * percentage) / 100;
}
// 4. Test passes ✅ - now refactor if needed
```

### FIRST Principles

Tests should be:

- **Fast** - Run quickly to encourage frequent execution
- **Independent** - No dependencies between tests
- **Repeatable** - Same results in any environment
- **Self-validating** - Pass or fail without manual inspection
- **Timely** - Written just before production code

### Testing Pyramid

Maintain a healthy distribution of test types:

```text
         /\
        /E2E\      (5-10%)
       /------\
      /Integration\ (20-30%)
     /--------------\
    /   Unit Tests   \ (60-70%)
   /------------------\
```

## Choosing a Test Runner

### Framework-Agnostic Testing Principles

Before choosing a test runner, understand that good tests are framework-agnostic:

1. **Tests describe behavior, not implementation**
2. **Tests are isolated and independent**
3. **Tests follow Arrange-Act-Assert pattern**
4. **Tests use clear, descriptive names**

These principles apply whether you use Vitest, Jest, or any other framework.

### Vitest (Primary Recommendation)

Fast, TypeScript-first testing framework with excellent DX:

**When to use Vitest:**

- New projects starting with Vite
- Projects prioritizing TypeScript-first development
- Need for fast test execution with native ESM support
- Want unified configuration with Vite build tool

```typescript
// ✂️ Production-ready: Vitest configuration
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' for browser-like environment
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Jest (Strong Alternative)

Mature, battle-tested framework with extensive ecosystem:

**When to use Jest:**

- Existing projects already using Jest
- Need maximum ecosystem compatibility
- Working with Create React App or Next.js
- Require specific Jest-only features (like manual mocks)

```typescript
// ✂️ Production-ready: Jest configuration
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$'],
  // Jest-specific features
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};

export default config;
```

### Migration Between Frameworks

Good test design makes migration straightforward:

```typescript
// 📚 Educational: Framework-agnostic test example
// Framework-agnostic test
describe('UserService', () => {
  it('should create a new user', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' };
    const service = new UserService();

    // Act
    const user = await service.create(userData);

    // Assert
    expect(user.id).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });
});
```

This test works identically in both Vitest and Jest.

## Test Organization

### File Structure

```text
src/
   components/
      Button/
         Button.tsx
         Button.test.tsx      # Unit tests
         Button.stories.tsx    # Storybook stories
   services/
      auth/
         auth.service.ts
         auth.service.test.ts
   test/
      setup.ts                  # Global test setup
      utils.ts                  # Test utilities
      factories/                # Test data factories
      mocks/                    # Mock implementations
   __tests__/
       integration/              # Integration tests
       e2e/                      # End-to-end tests
```

## Testing Utilities

### Custom Test Utils

```typescript
// ✂️ Production-ready: Custom test utilities with providers
// src/test/utils.ts
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
```

### Test Data Factories

```typescript
// ✂️ Production-ready: Test data factory pattern
// src/test/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import type { User, CreateUserInput } from '@/types';

export const userFactory = {
  build: (overrides: Partial<User> = {}): User => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar: faker.image.avatar(),
    role: 'user',
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  }),

  buildCreateInput: (
    overrides: Partial<CreateUserInput> = {}
  ): CreateUserInput => ({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.internet.password({ length: 12 }),
    ...overrides,
  }),

  buildList: (count: number, overrides: Partial<User> = {}): User[] =>
    Array.from({ length: count }, () => userFactory.build(overrides)),
};
```

## Mocking Strategies

### API Mocking with MSW

```typescript
// ✂️ Production-ready: MSW mock handlers
// src/test/mocks/handlers.ts
import { rest } from 'msw';
import { userFactory } from '../factories';

export const handlers = [
  rest.get('/api/users/:id', (req, res, ctx) => {
    const { id } = req.params;
    const user = userFactory.build({ id: id as string });
    return res(ctx.json(user));
  }),

  rest.post('/api/users', async (req, res, ctx) => {
    const body = await req.json();
    const user = userFactory.build(body);
    return res(ctx.status(201), ctx.json(user));
  }),

  rest.delete('/api/users/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  }),
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Module Mocking

```typescript
// 📚 Educational: Module mocking patterns
// Vitest example
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock a module
vi.mock('@/services/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock with factory
vi.mock('@/services/database', () => {
  return {
    db: {
      user: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});
```

## Component Testing

### React Testing Library

```typescript
// ✂️ Production-ready: React component testing
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  const user = userEvent.setup();

  it('should handle form submission', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show validation errors', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    // Submit empty form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Check errors
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### React Server Component Testing

```typescript
// ✂️ Production-ready: Testing React Server Components
import { render } from '@testing-library/react';
import { ProductList } from './ProductList';
import { getProducts } from '@/lib/products';

// Mock server-side data fetching
vi.mock('@/lib/products');

describe('ProductList Server Component', () => {
  it('should render products from server', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 10.99 },
      { id: 2, name: 'Product 2', price: 20.99 },
    ];

    vi.mocked(getProducts).mockResolvedValue(mockProducts);

    // Server Components are async
    const Component = await ProductList({ category: 'electronics' });
    const { container } = render(Component);

    expect(container).toHaveTextContent('Product 1');
    expect(container).toHaveTextContent('Product 2');
    expect(getProducts).toHaveBeenCalledWith({ category: 'electronics' });
  });

  it('should handle server component with client components', async () => {
    // Test composition of Server and Client Components
    const { AddToCartButton } = await import('./AddToCartButton');

    const ServerComponent = await ProductList({ featured: true });
    const { getByRole } = render(ServerComponent);

    // Client components within server components work normally
    const buttons = getByRole('button', { name: /add to cart/i });
    expect(buttons).toBeInTheDocument();
  });
});

// Testing Server Actions
describe('Server Actions', () => {
  it('should test server action', async () => {
    const { updateProduct } = await import('./actions');

    // Mock database call
    const mockDb = vi.fn().mockResolvedValue({ success: true });
    vi.mock('@/lib/db', () => ({ db: { update: mockDb } }));

    const formData = new FormData();
    formData.append('id', '123');
    formData.append('name', 'Updated Product');

    const result = await updateProduct(formData);

    expect(result).toEqual({ success: true });
    expect(mockDb).toHaveBeenCalledWith({
      id: '123',
      name: 'Updated Product',
    });
  });
});
```

### Hook Testing

```typescript
// ✂️ Production-ready: React hook testing
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should reset counter', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});
```

## Async Testing

### Testing Promises

```typescript
// 📚 Educational: Async testing patterns
describe('Async operations', () => {
  it('should handle successful async operation', async () => {
    const data = await fetchUserData('123');

    expect(data).toEqual({
      id: '123',
      name: 'John Doe',
    });
  });

  it('should handle failed async operation', async () => {
    await expect(fetchUserData('invalid')).rejects.toThrow('User not found');
  });

  it('should handle async operation with loading states', async () => {
    const { result } = renderHook(() => useAsyncData());

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.fetch();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Testing Timers

```typescript
// ✂️ Production-ready: Timer testing with fake timers
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Timer operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    debounced();
    debounced();
    debounced();

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should retry failed operations', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockRejectedValueOnce(new Error('Another failure'))
      .mockResolvedValueOnce('Success');

    const promise = retryWithBackoff(operation, { maxAttempts: 3 });

    // Fast-forward through retries
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('Success');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
```

## Snapshot Testing

```typescript
// 📚 Educational: Snapshot testing examples
describe('Component snapshots', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <Card title="Test Card" description="Test description" />
    );

    expect(container).toMatchSnapshot();
  });

  it('should match inline snapshot', () => {
    const result = formatUserName({ firstName: 'John', lastName: 'Doe' });

    expect(result).toMatchInlineSnapshot(`"Doe, John"`);
  });
});
```

## Coverage Configuration

```json
// 🚧 Pseudo-code: Test script configuration
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### Coverage Thresholds

```typescript
// 🚧 Pseudo-code: Coverage threshold configuration
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# ✂️ Production-ready: CI/CD test workflow
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```bash
# ✂️ Production-ready: Husky pre-commit setup
# Install husky
npm install --save-dev husky lint-staged
npx husky init

# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```json
// 🚧 Pseudo-code: Lint-staged configuration
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"]
  }
}
```

## Best Practices

### Do's ✅

- Write tests before implementation (TDD)
- Keep tests focused and independent
- Use descriptive test names that explain behavior
- Clean up resources in afterEach hooks
- Test behavior, not implementation details
- Maintain test coverage above 80%
- Run tests locally before pushing
- Use deterministic test data

### Don'ts ❌

- Share mutable state between tests
- Use arbitrary timeouts or sleep
- Mock external libraries you don't own
- Write tests after implementation (except bug fixes)
- Ignore flaky tests
- Test private methods directly
- Depend on test execution order
- Use production data in tests

## Troubleshooting

### Common Issues and Solutions

#### Tests Hanging or Timing Out

- Check for missing `await` keywords
- Ensure proper cleanup of timers and listeners
- Use appropriate test timeouts: `it('test', () => {}, { timeout: 10000 })`

#### Flaky Tests in CI

- Use deterministic test data
- Replace time-dependent code with fake timers
- Ensure proper test isolation
- Increase timeouts for CI environments

#### Mock Functions Not Working

- Set up mocks before importing modules
- Clear mocks between tests: `beforeEach(() => vi.clearAllMocks())`
- Verify mock imports match module structure

#### Memory Leaks

- Clean up resources in afterEach hooks
- Avoid global state between tests
- Profile with `node --inspect` if needed

## Advanced Patterns

### Custom Matchers

```typescript
// ✂️ Production-ready: Custom Jest/Vitest matchers
// test/matchers.ts
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// Usage
expect(result).toBeWithinRange(1, 10);
```

### Test Data Builders

```typescript
// ✂️ Production-ready: Builder pattern for test data
class UserBuilder {
  private user = {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
  };

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withRole(role: 'user' | 'admin'): this {
    this.user.role = role;
    return this;
  }

  build() {
    return { ...this.user };
  }
}

// Usage
const adminUser = new UserBuilder()
  .withEmail('admin@example.com')
  .withRole('admin')
  .build();
```
