import { describe, test, expect } from 'vitest';

// Root barrel imports
import * as rootImports from '../index';

// Individual subpath imports (these will work after build)
import * as errorModule from '../error';
import * as resultModule from '../result';
import * as assertModule from '../assert';
import * as typesModule from '../types/index';
import * as brandedModule from '../types/branded';

describe('Subpath Exports Compatibility', () => {
  describe('Root barrel exports', () => {
    test('should export all error utilities', () => {
      expect(rootImports.makeError).toBeDefined();
      expect(rootImports.isAppError).toBeDefined();
      expect(rootImports.toAppError).toBeDefined();
      expect(rootImports.humanize).toBeDefined();
      expect(rootImports.formatForDevelopers).toBeDefined();
    });

    test('should export all result utilities', () => {
      expect(rootImports.success).toBeDefined();
      expect(rootImports.failure).toBeDefined();
      expect(rootImports.isSuccess).toBeDefined();
      expect(rootImports.isFailure).toBeDefined();
      expect(rootImports.unwrap).toBeDefined();
      expect(rootImports.unwrapOr).toBeDefined();
      expect(rootImports.map).toBeDefined();
      expect(rootImports.mapError).toBeDefined();
      expect(rootImports.flatMap).toBeDefined();
      expect(rootImports.all).toBeDefined();
      expect(rootImports.getOrElse).toBeDefined();
    });

    test('should export all assertion utilities', () => {
      expect(rootImports.assert).toBeDefined();
      expect(rootImports.assertDefined).toBeDefined();
      expect(rootImports.assertNever).toBeDefined();
    });

    test('should export all type utilities', () => {
      // From types/index.ts
      expect(rootImports.Types).toBeDefined();

      // Brand type should be available via re-export
      // Note: brand/unbrand/isBranded are not exported as functions
    });
  });

  describe('Subpath module exports', () => {
    test('error module should export its utilities', () => {
      expect(errorModule.makeError).toBeDefined();
      expect(errorModule.isAppError).toBeDefined();
      expect(errorModule.toAppError).toBeDefined();
      expect(errorModule.ErrorCode).toBeDefined();
    });

    test('result module should export its utilities', () => {
      expect(resultModule.success).toBeDefined();
      expect(resultModule.failure).toBeDefined();
      expect(resultModule.isSuccess).toBeDefined();
      expect(resultModule.isFailure).toBeDefined();
      expect(resultModule.unwrap).toBeDefined();
      expect(resultModule.unwrapOr).toBeDefined();
      expect(resultModule.map).toBeDefined();
      expect(resultModule.mapError).toBeDefined();
      expect(resultModule.flatMap).toBeDefined();
      expect(resultModule.all).toBeDefined();
      expect(resultModule.getOrElse).toBeDefined();
    });

    test('assert module should export its utilities', () => {
      expect(assertModule.assert).toBeDefined();
      expect(assertModule.assertDefined).toBeDefined();
      expect(assertModule.assertNever).toBeDefined();
    });

    test('types module should export type utilities', () => {
      // This will test the re-exports from types/index.ts
      expect(typesModule).toBeDefined();
    });

    test('branded module should export brand utilities', () => {
      // Test functions that create branded types
      expect(brandedModule.createUserId).toBeDefined();
      expect(brandedModule.createEmail).toBeDefined();
      expect(brandedModule.isUserId).toBeDefined();
      expect(brandedModule.isEmail).toBeDefined();
      expect(brandedModule.createBrandedType).toBeDefined();
    });
  });

  describe('Export equivalence', () => {
    test('error exports should be identical between root and subpath', () => {
      expect(rootImports.makeError).toBe(errorModule.makeError);
      expect(rootImports.isAppError).toBe(errorModule.isAppError);
      expect(rootImports.toAppError).toBe(errorModule.toAppError);
      expect(rootImports.ErrorCode).toBe(errorModule.ErrorCode);
    });

    test('result exports should be identical between root and subpath', () => {
      expect(rootImports.success).toBe(resultModule.success);
      expect(rootImports.failure).toBe(resultModule.failure);
      expect(rootImports.isSuccess).toBe(resultModule.isSuccess);
      expect(rootImports.isFailure).toBe(resultModule.isFailure);
    });

    test('assert exports should be identical between root and subpath', () => {
      expect(rootImports.assert).toBe(assertModule.assert);
      expect(rootImports.assertDefined).toBe(assertModule.assertDefined);
      expect(rootImports.assertNever).toBe(assertModule.assertNever);
    });

    test('brand exports should be identical between root and subpath', () => {
      // Check specific branded type constructors
      expect(rootImports.createUserId).toBe(brandedModule.createUserId);
      expect(rootImports.createEmail).toBe(brandedModule.createEmail);
      expect(rootImports.isUserId).toBe(brandedModule.isUserId);
      expect(rootImports.isEmail).toBe(brandedModule.isEmail);
    });
  });
});
