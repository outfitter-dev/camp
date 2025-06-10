import { describe, it, expect } from 'vitest';

import {
  assertNever,
  exhaustiveCheck,
  assert,
  assertDefined,
  isDefined,
  isNullish,
  assertUnreachable,
} from '../assert';

describe('Assert utilities', () => {
  describe('assertNever', () => {
    it('should throw error with unexpected value', () => {
      const value = 'unexpected' as never;
      expect(() => assertNever(value)).toThrow(
        'Unexpected value: "unexpected"'
      );
    });

    it('should provide compile-time exhaustiveness checking', () => {
      type Status = 'active' | 'inactive';

      function processStatus(status: Status): string {
        switch (status) {
          case 'active':
            return 'Active';
          case 'inactive':
            return 'Inactive';
          default:
            // This would be a compile error if a case was missed
            return assertNever(status);
        }
      }

      expect(processStatus('active')).toBe('Active');
      expect(processStatus('inactive')).toBe('Inactive');
    });

    it('should throw an error when called', () => {
      expect(() => assertNever(undefined as never)).toThrow(
        'Unhandled value: undefined'
      );
    });

    it('should handle different never-like inputs', () => {
      // This is a type-level test, but we can simulate the call
      const callWith = (val: any) => () => assertNever(val as never);
      expect(callWith(null)).toThrow('Unhandled value: null');
      expect(callWith('string')).toThrow('Unhandled value: "string"');
    });
  });

  describe('exhaustiveCheck', () => {
    it('should return default value for unhandled cases', () => {
      const value = 'unexpected' as never;
      const result = exhaustiveCheck(value, 'default');

      expect(result).toBe('default');
    });

    it('should handle exhaustive checks gracefully', () => {
      type Color = 'red' | 'blue';

      function getHex(color: Color): string {
        switch (color) {
          case 'red':
            return '#FF0000';
          case 'blue':
            return '#0000FF';
          default:
            return exhaustiveCheck(color, '#000000');
        }
      }

      expect(getHex('red')).toBe('#FF0000');
      expect(getHex('blue')).toBe('#0000FF');
    });
  });

  describe('assert', () => {
    it('should not throw for a truthy condition', () => {
      expect(() => assert(true)).not.toThrow();
      expect(() => assert(1)).not.toThrow();
      expect(() => assert('string')).not.toThrow();
      expect(() => assert({})).not.toThrow();
    });

    it('should throw for a falsy condition', () => {
      expect(() => assert(false)).toThrow('Assertion failed');
      expect(() => assert(0)).toThrow('Assertion failed');
      expect(() => assert('')).toThrow('Assertion failed');
      expect(() => assert(null)).toThrow('Assertion failed');
      expect(() => assert(undefined)).toThrow('Assertion failed');
    });

    it('should use a custom message when provided', () => {
      expect(() => assert(false, 'Custom message')).toThrow('Custom message');
    });

    it('should narrow types correctly', () => {
      function processValue(value: string | null) {
        assert(value !== null, 'Value must not be null');
        // TypeScript now knows value is string
        return value.toUpperCase();
      }

      expect(processValue('hello')).toBe('HELLO');
      expect(() => processValue(null)).toThrow('Value must not be null');
    });
  });

  describe('assertDefined', () => {
    it('should not throw for a defined value', () => {
      expect(() => assertDefined('')).not.toThrow();
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
    });

    it('should throw for null or undefined', () => {
      expect(() => assertDefined(null)).toThrow('Value must not be null');
      expect(() => assertDefined(undefined)).toThrow('Value must not be null');
    });

    it('should use custom error message', () => {
      expect(() => assertDefined(null, 'Custom message')).toThrow(
        'Custom message'
      );
    });

    it('should narrow types correctly', () => {
      function getLength(value?: string) {
        assertDefined(value, 'Value is required');
        // TypeScript now knows value is string
        return value.length;
      }

      expect(getLength('hello')).toBe(5);
      expect(() => getLength(undefined)).toThrow('Value is required');
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });

    it('should work as a filter', () => {
      const values: (string | null | undefined)[] = [
        'a',
        null,
        'b',
        undefined,
        'c',
      ];
      const defined = values.filter(isDefined);

      expect(defined).toEqual(['a', 'b', 'c']);
      // TypeScript knows defined is string[]
      expect(defined.map(s => s.toUpperCase())).toEqual(['A', 'B', 'C']);
    });
  });

  describe('isNullish', () => {
    it('should return true for null and undefined', () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isNullish(0)).toBe(false);
      expect(isNullish('')).toBe(false);
      expect(isNullish(false)).toBe(false);
      expect(isNullish([])).toBe(false);
      expect(isNullish({})).toBe(false);
    });
  });

  describe('assertUnreachable', () => {
    it('should throw error', () => {
      expect(() => assertUnreachable()).toThrow(
        'This code should be unreachable'
      );
    });

    it('should be used to ensure all paths are covered', () => {
      type Operation = 'add' | 'subtract' | 'multiply';

      function calculate(op: Operation, a: number, b: number): number {
        if (op === 'add') {
          return a + b;
        } else if (op === 'subtract') {
          return a - b;
        } else if (op === 'multiply') {
          return a * b;
        }
        // This ensures all operations are handled
        assertUnreachable();
      }

      expect(calculate('add', 2, 3)).toBe(5);
      expect(calculate('subtract', 5, 3)).toBe(2);
      expect(calculate('multiply', 2, 3)).toBe(6);
    });
  });
});
