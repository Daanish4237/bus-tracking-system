/**
 * Property-based tests for the data store
 */

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { setRoute, getRouteById, setStop, getStopById, getStopsForRoute } from './dataStore';
import { Route, Stop } from '../../shared/types';

// Arbitrary for a valid Route object (id, name, ordered stopIds with at least 2 entries)
const validRouteArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  stopIds: fc.array(
    fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
    { minLength: 2, maxLength: 20 }
  ),
  isActive: fc.boolean(),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Feature: bus-tracking-system, Property 11: Route Data Persistence Round-Trip
describe('Property 11: Route Data Persistence Round-Trip', () => {
  test('storing a route and retrieving it preserves all fields', () => {
    // Validates: Requirements 5.1, 5.3
    fc.assert(
      fc.property(validRouteArb, (route: Route) => {
        setRoute(route);
        const retrieved = getRouteById(route.id);

        // Must be found
        if (retrieved === undefined) return false;

        // All fields must be preserved
        return (
          retrieved.id === route.id &&
          retrieved.name === route.name &&
          retrieved.isActive === route.isActive &&
          retrieved.createdAt.getTime() === route.createdAt.getTime() &&
          retrieved.updatedAt.getTime() === route.updatedAt.getTime() &&
          retrieved.stopIds.length === route.stopIds.length &&
          retrieved.stopIds.every((stopId, index) => stopId === route.stopIds[index])
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Arbitrary for a valid Stop object
const validStopArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  latitude: fc.double({ min: -90, max: 90, noNaN: true }),
  longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  address: fc.string({ minLength: 0, maxLength: 200 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// Feature: bus-tracking-system, Property 12: Stop Data Persistence Round-Trip
describe('Property 12: Stop Data Persistence Round-Trip', () => {
  test('storing a stop and retrieving it preserves all fields', () => {
    // Validates: Requirements 5.2, 5.5
    fc.assert(
      fc.property(validStopArb, (stop: Stop) => {
        setStop(stop);
        const retrieved = getStopById(stop.id);

        // Must be found
        if (retrieved === undefined) return false;

        // All fields must be preserved
        return (
          retrieved.id === stop.id &&
          retrieved.name === stop.name &&
          retrieved.latitude === stop.latitude &&
          retrieved.longitude === stop.longitude &&
          retrieved.address === stop.address &&
          retrieved.createdAt.getTime() === stop.createdAt.getTime() &&
          retrieved.updatedAt.getTime() === stop.updatedAt.getTime()
        );
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: bus-tracking-system, Property 2: Stop Sequence Completeness and Order
describe('Property 2: Stop Sequence Completeness and Order', () => {
  test('retrieving stops for a route returns all N stops in their defined sequential order', () => {
    // Validates: Requirements 1.3, 1.4, 4.4, 5.4
    fc.assert(
      fc.property(
        // Generate unique stop IDs (array of distinct non-empty strings)
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 2, maxLength: 20 }
        ).filter(ids => new Set(ids).size === ids.length),
        (stopIds: string[]) => {
          const routeId = `test-route-${Math.random().toString(36).slice(2)}`;
          const now = new Date();

          // Create and store a stop for each stopId
          stopIds.forEach((stopId, index) => {
            const stop: Stop = {
              id: stopId,
              name: `Stop ${index + 1}`,
              latitude: 0,
              longitude: 0,
              address: `Address ${index + 1}`,
              createdAt: now,
              updatedAt: now,
            };
            setStop(stop);
          });

          // Create and store the route with the ordered stopIds
          const route: Route = {
            id: routeId,
            name: 'Test Route',
            stopIds,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          };
          setRoute(route);

          // Retrieve stops for the route
          const retrievedStops = getStopsForRoute(routeId);

          // Must return all N stops
          if (retrievedStops.length !== stopIds.length) return false;

          // Must be in the exact same sequential order
          return retrievedStops.every((stop: Stop, index: number) => stop.id === stopIds[index]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
