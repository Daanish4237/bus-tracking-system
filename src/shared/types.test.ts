/**
 * Property-based tests for GPS coordinate validation
 * Feature: bus-tracking-system
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { isValidGPSCoordinate } from './types';

describe('GPS Coordinate Validation', () => {
  // Feature: bus-tracking-system, Property 14: GPS Coordinate Validation
  // Validates: Requirements 7.1
  test('Property 14: accepts valid GPS coordinates and rejects invalid ones', () => {
    fc.assert(
      fc.property(
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true })
        }),
        (validCoord) => {
          // Valid coordinates should be accepted
          expect(isValidGPSCoordinate(validCoord)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        fc.oneof(
          // Invalid latitude (too low)
          fc.record({
            latitude: fc.double({ max: -90.001, noNaN: true }),
            longitude: fc.double({ min: -180, max: 180, noNaN: true })
          }),
          // Invalid latitude (too high)
          fc.record({
            latitude: fc.double({ min: 90.001, noNaN: true }),
            longitude: fc.double({ min: -180, max: 180, noNaN: true })
          }),
          // Invalid longitude (too low)
          fc.record({
            latitude: fc.double({ min: -90, max: 90, noNaN: true }),
            longitude: fc.double({ max: -180.001, noNaN: true })
          }),
          // Invalid longitude (too high)
          fc.record({
            latitude: fc.double({ min: -90, max: 90, noNaN: true }),
            longitude: fc.double({ min: 180.001, noNaN: true })
          })
        ),
        (invalidCoord) => {
          // Invalid coordinates should be rejected
          expect(isValidGPSCoordinate(invalidCoord)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 14: rejects non-object inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.string(),
          fc.integer(),
          fc.boolean()
        ),
        (invalidInput) => {
          expect(isValidGPSCoordinate(invalidInput)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 14: rejects objects with missing or invalid fields', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing latitude
          fc.record({
            longitude: fc.double({ min: -180, max: 180, noNaN: true })
          }),
          // Missing longitude
          fc.record({
            latitude: fc.double({ min: -90, max: 90, noNaN: true })
          }),
          // Non-numeric latitude
          fc.record({
            latitude: fc.string(),
            longitude: fc.double({ min: -180, max: 180, noNaN: true })
          }),
          // Non-numeric longitude
          fc.record({
            latitude: fc.double({ min: -90, max: 90, noNaN: true }),
            longitude: fc.string()
          })
        ),
        (invalidCoord) => {
          expect(isValidGPSCoordinate(invalidCoord)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 14: accepts boundary values', () => {
    // Test exact boundary values
    expect(isValidGPSCoordinate({ latitude: -90, longitude: -180 })).toBe(true);
    expect(isValidGPSCoordinate({ latitude: -90, longitude: 180 })).toBe(true);
    expect(isValidGPSCoordinate({ latitude: 90, longitude: -180 })).toBe(true);
    expect(isValidGPSCoordinate({ latitude: 90, longitude: 180 })).toBe(true);
    expect(isValidGPSCoordinate({ latitude: 0, longitude: 0 })).toBe(true);
  });

  test('Property 14: rejects NaN values', () => {
    expect(isValidGPSCoordinate({ latitude: NaN, longitude: 0 })).toBe(false);
    expect(isValidGPSCoordinate({ latitude: 0, longitude: NaN })).toBe(false);
    expect(isValidGPSCoordinate({ latitude: NaN, longitude: NaN })).toBe(false);
  });
});
