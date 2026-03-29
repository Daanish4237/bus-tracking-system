/**
 * Tests for geographic utility functions
 * Feature: bus-tracking-system
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDistance, isAtStop, STOP_PROXIMITY_THRESHOLD } from './geoUtils';
import { GPSCoordinate, Stop } from './types';

describe('calculateDistance', () => {
  test('calculates zero distance for identical coordinates', () => {
    const distance = calculateDistance(0, 0, 0, 0);
    expect(distance).toBe(0);
  });

  test('calculates correct distance for known coordinates', () => {
    // Distance between New York City (40.7128° N, 74.0060° W) and 
    // Los Angeles (34.0522° N, 118.2437° W) is approximately 3,944 km
    const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900000); // > 3,900 km
    expect(distance).toBeLessThan(4000000); // < 4,000 km
  });

  test('calculates correct distance for nearby points', () => {
    // Two points approximately 100 meters apart
    // Using a simple approximation: at equator, 1 degree latitude ≈ 111 km
    // So 0.0009 degrees ≈ 100 meters
    const distance = calculateDistance(0, 0, 0.0009, 0);
    expect(distance).toBeGreaterThan(90); // Allow some margin
    expect(distance).toBeLessThan(110);
  });

  test('handles coordinates at equator', () => {
    const distance = calculateDistance(0, 0, 0, 1);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(120000); // Less than 120 km (rough estimate)
  });

  test('handles coordinates at poles', () => {
    const distance = calculateDistance(90, 0, 90, 180);
    expect(distance).toBeCloseTo(0, 5); // At north pole, all longitudes converge (within floating point precision)
  });

  test('handles negative coordinates', () => {
    const distance = calculateDistance(-45, -90, -45, -90);
    expect(distance).toBe(0);
  });

  test('distance is symmetric', () => {
    const d1 = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
    const d2 = calculateDistance(34.0522, -118.2437, 40.7128, -74.0060);
    expect(d1).toBeCloseTo(d2, 5);
  });

  test('satisfies triangle inequality', () => {
    // For any three points A, B, C: distance(A,C) <= distance(A,B) + distance(B,C)
    const lat1 = 40.7128, lon1 = -74.0060; // New York
    const lat2 = 41.8781, lon2 = -87.6298; // Chicago
    const lat3 = 34.0522, lon3 = -118.2437; // Los Angeles

    const dAC = calculateDistance(lat1, lon1, lat3, lon3);
    const dAB = calculateDistance(lat1, lon1, lat2, lon2);
    const dBC = calculateDistance(lat2, lon2, lat3, lon3);

    expect(dAC).toBeLessThanOrEqual(dAB + dBC + 1); // +1 for floating point tolerance
  });

  test('property: distance is always non-negative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat1, lon1, lat2, lon2) => {
          const distance = calculateDistance(lat1, lon1, lat2, lon2);
          expect(distance).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: distance is zero if and only if coordinates are identical', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          const distance = calculateDistance(lat, lon, lat, lon);
          expect(distance).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: distance is symmetric', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat1, lon1, lat2, lon2) => {
          const d1 = calculateDistance(lat1, lon1, lat2, lon2);
          const d2 = calculateDistance(lat2, lon2, lat1, lon1);
          expect(d1).toBeCloseTo(d2, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: distance is bounded by Earth circumference', () => {
    const EARTH_CIRCUMFERENCE = 40075000; // meters at equator
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat1, lon1, lat2, lon2) => {
          const distance = calculateDistance(lat1, lon1, lat2, lon2);
          // Maximum distance on Earth's surface is half the circumference
          expect(distance).toBeLessThanOrEqual(EARTH_CIRCUMFERENCE / 2 + 1000); // +1000m tolerance
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('isAtStop', () => {
  test('returns true when bus is exactly at stop', () => {
    const busLocation: GPSCoordinate = { latitude: 40.7128, longitude: -74.0060 };
    const stop: Stop = {
      id: 'stop-1',
      name: 'Test Stop',
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    expect(isAtStop(busLocation, stop)).toBe(true);
  });

  test('returns true when bus is within threshold', () => {
    const busLocation: GPSCoordinate = { latitude: 40.7128, longitude: -74.0060 };
    // Stop is approximately 50 meters away (0.00045 degrees ≈ 50m at this latitude)
    const stop: Stop = {
      id: 'stop-1',
      name: 'Test Stop',
      latitude: 40.71325,
      longitude: -74.0060,
      address: '123 Main St',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    expect(isAtStop(busLocation, stop)).toBe(true);
  });

  test('returns false when bus is beyond threshold', () => {
    const busLocation: GPSCoordinate = { latitude: 40.7128, longitude: -74.0060 };
    // Stop is approximately 200 meters away (0.0018 degrees ≈ 200m at this latitude)
    const stop: Stop = {
      id: 'stop-1',
      name: 'Test Stop',
      latitude: 40.7146,
      longitude: -74.0060,
      address: '123 Main St',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    expect(isAtStop(busLocation, stop)).toBe(false);
  });

  test('returns true when bus is exactly at threshold boundary', () => {
    const busLocation: GPSCoordinate = { latitude: 0, longitude: 0 };
    // Calculate a point exactly 100 meters away
    // At equator: 1 degree latitude ≈ 111,320 meters
    // So 100 meters ≈ 0.000898 degrees
    const stop: Stop = {
      id: 'stop-1',
      name: 'Test Stop',
      latitude: 0.000898,
      longitude: 0,
      address: '123 Main St',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = isAtStop(busLocation, stop);
    // Should be true since we're at or very close to the threshold
    expect(result).toBe(true);
  });

  test('handles stops at different latitudes', () => {
    const busLocation: GPSCoordinate = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
    const stop: Stop = {
      id: 'stop-1',
      name: 'Sydney Stop',
      latitude: -33.8688,
      longitude: 151.2093,
      address: 'Sydney Opera House',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    expect(isAtStop(busLocation, stop)).toBe(true);
  });

  test('property: bus at exact stop location is always at stop', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (lat, lon, stopId, stopName) => {
          const busLocation: GPSCoordinate = { latitude: lat, longitude: lon };
          const stop: Stop = {
            id: stopId,
            name: stopName,
            latitude: lat,
            longitude: lon,
            address: 'Test Address',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          expect(isAtStop(busLocation, stop)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: if distance > threshold, isAtStop returns false', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -89, max: 89, noNaN: true }), // Avoid poles for this test
        fc.double({ min: -179, max: 179, noNaN: true }),
        fc.double({ min: 0.002, max: 1, noNaN: true }), // Offset that ensures > 100m
        (lat, lon, offset) => {
          const busLocation: GPSCoordinate = { latitude: lat, longitude: lon };
          const stop: Stop = {
            id: 'stop-1',
            name: 'Test Stop',
            latitude: lat + offset,
            longitude: lon,
            address: 'Test Address',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const distance = calculateDistance(
            busLocation.latitude,
            busLocation.longitude,
            stop.latitude,
            stop.longitude
          );
          if (distance > STOP_PROXIMITY_THRESHOLD) {
            expect(isAtStop(busLocation, stop)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: if distance <= threshold, isAtStop returns true', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        fc.double({ min: 0, max: 0.0009, noNaN: true }), // Small offset ensuring <= 100m
        (lat, lon, offset) => {
          const busLocation: GPSCoordinate = { latitude: lat, longitude: lon };
          const stop: Stop = {
            id: 'stop-1',
            name: 'Test Stop',
            latitude: lat + offset,
            longitude: lon,
            address: 'Test Address',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const distance = calculateDistance(
            busLocation.latitude,
            busLocation.longitude,
            stop.latitude,
            stop.longitude
          );
          if (distance <= STOP_PROXIMITY_THRESHOLD) {
            expect(isAtStop(busLocation, stop)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('STOP_PROXIMITY_THRESHOLD', () => {
  test('is set to 100 meters as specified in requirements', () => {
    expect(STOP_PROXIMITY_THRESHOLD).toBe(100);
  });
});

// Feature: bus-tracking-system, Property 15: Proximity-Based Stop Detection
describe('Property 15: Proximity-Based Stop Detection', () => {
  /**
   * Validates: Requirements 7.3
   *
   * For any bus location and stop location, when the distance between them is
   * less than or equal to the proximity threshold (100 meters), the system must
   * consider the bus as being at that stop. Conversely, when the distance is
   * greater than the threshold, the bus must NOT be considered at that stop.
   *
   * Strategy: generate a stop location, then derive a bus location that is
   * guaranteed to be within (or outside) the threshold using degree offsets.
   * At any latitude, 0.0009 degrees of latitude ≈ 100 m, so:
   *   - within threshold: offset in [0, 0.0009] degrees
   *   - outside threshold: offset > 0.002 degrees (≈ 222 m minimum)
   */

  test('property: when distance <= threshold, isAtStop returns true', () => {
    // Validates: Requirements 7.3
    fc.assert(
      fc.property(
        // Stop location (avoid poles to keep degree-to-meter conversion stable)
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        // Small lat offset that keeps the bus within ~100 m of the stop
        fc.double({ min: 0, max: 0.0009, noNaN: true }),
        (stopLat, stopLon, latOffset) => {
          const stop: Stop = {
            id: 'stop-p15',
            name: 'Property 15 Stop',
            latitude: stopLat,
            longitude: stopLon,
            address: 'Test Address',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const busLocation: GPSCoordinate = {
            latitude: stopLat + latOffset,
            longitude: stopLon
          };
          const distance = calculateDistance(
            busLocation.latitude, busLocation.longitude,
            stop.latitude, stop.longitude
          );
          // Only assert when the generated offset actually produces distance <= threshold
          if (distance <= STOP_PROXIMITY_THRESHOLD) {
            expect(isAtStop(busLocation, stop)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: when distance > threshold, isAtStop returns false', () => {
    // Validates: Requirements 7.3
    fc.assert(
      fc.property(
        // Stop location (avoid poles)
        fc.double({ min: -89, max: 89, noNaN: true }),
        fc.double({ min: -179, max: 179, noNaN: true }),
        // Lat offset that guarantees > 100 m separation (0.002 deg ≈ 222 m at equator)
        fc.double({ min: 0.002, max: 1, noNaN: true }),
        (stopLat, stopLon, latOffset) => {
          const stop: Stop = {
            id: 'stop-p15',
            name: 'Property 15 Stop',
            latitude: stopLat,
            longitude: stopLon,
            address: 'Test Address',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const busLocation: GPSCoordinate = {
            latitude: stopLat + latOffset,
            longitude: stopLon
          };
          const distance = calculateDistance(
            busLocation.latitude, busLocation.longitude,
            stop.latitude, stop.longitude
          );
          // Only assert when the generated offset actually produces distance > threshold
          if (distance > STOP_PROXIMITY_THRESHOLD) {
            expect(isAtStop(busLocation, stop)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
