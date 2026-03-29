/**
 * Unit tests for stop status calculation logic
 * 
 * Tests cover:
 * - Basic status calculation (completed, current, upcoming)
 * - Edge cases: bus at first stop, bus at last stop, bus between stops
 * - Empty route handling
 * - Single stop routes
 */

import { describe, it, expect } from 'vitest';
import { calculateStopStatuses, calculateStopStatus } from './stopStatusCalculator';
import { BusLocation, Stop, StopStatus } from './types';

describe('stopStatusCalculator', () => {
  // Helper function to create a stop
  const createStop = (id: string, name: string, lat: number, lon: number): Stop => ({
    id,
    name,
    latitude: lat,
    longitude: lon,
    address: `${name} Address`,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Helper function to create a bus location
  const createBusLocation = (busId: string, routeId: string, lat: number, lon: number): BusLocation => ({
    busId,
    routeId,
    latitude: lat,
    longitude: lon,
    timestamp: new Date()
  });

  describe('calculateStopStatuses', () => {
    it('should return empty array for empty stops list', () => {
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128, -74.0060);
      const stops: Stop[] = [];

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toEqual([]);
    });

    it('should mark stop as CURRENT when bus is at the stop', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070),
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      // Bus is at stop-2 (within 100m threshold)
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7138, -74.0070);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(StopStatus.COMPLETED);
      expect(result[1].status).toBe(StopStatus.CURRENT);
      expect(result[2].status).toBe(StopStatus.UPCOMING);
    });

    it('should mark all stops as UPCOMING when bus is at first stop', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070),
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      // Bus is at first stop
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128, -74.0060);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(StopStatus.CURRENT);
      expect(result[1].status).toBe(StopStatus.UPCOMING);
      expect(result[2].status).toBe(StopStatus.UPCOMING);
    });

    it('should mark all previous stops as COMPLETED when bus is at last stop', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070),
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      // Bus is at last stop
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7148, -74.0080);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(StopStatus.COMPLETED);
      expect(result[1].status).toBe(StopStatus.COMPLETED);
      expect(result[2].status).toBe(StopStatus.CURRENT);
    });

    it('should handle bus between stops correctly', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7148, -74.0080),
        createStop('stop-3', 'Stop 3', 40.7168, -74.0100)
      ];
      // Bus is between stop-1 and stop-2 (far enough from both to not be "at" either)
      // Using coordinates that are more than 100m from both stops
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7138, -74.0070);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(3);
      // First stop should be completed, rest upcoming
      expect(result[0].status).toBe(StopStatus.COMPLETED);
      expect(result[1].status).toBe(StopStatus.UPCOMING);
      expect(result[2].status).toBe(StopStatus.UPCOMING);
    });

    it('should handle single stop route', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060)
      ];
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128, -74.0060);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(StopStatus.CURRENT);
    });

    it('should mark stops as UPCOMING when bus is before first stop', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070),
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      // Bus is well before the first stop (more than 200m away)
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7100, -74.0040);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(3);
      // All stops should be upcoming since bus hasn't reached first stop yet
      expect(result[0].status).toBe(StopStatus.UPCOMING);
      expect(result[1].status).toBe(StopStatus.UPCOMING);
      expect(result[2].status).toBe(StopStatus.UPCOMING);
    });

    it('should mark stops as COMPLETED when bus is past last stop', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070),
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      // Bus is past the last stop (more than 200m away)
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7170, -74.0100);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(3);
      // All stops should be completed
      expect(result[0].status).toBe(StopStatus.COMPLETED);
      expect(result[1].status).toBe(StopStatus.COMPLETED);
      expect(result[2].status).toBe(StopStatus.COMPLETED);
    });

    it('should include correct busId and routeId in all stop progress objects', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070)
      ];
      const busLocation = createBusLocation('bus-123', 'route-456', 40.7128, -74.0060);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(2);
      result.forEach(progress => {
        expect(progress.busId).toBe('bus-123');
        expect(progress.routeId).toBe('route-456');
      });
    });

    it('should set arrivalTime and departureTime to null', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060)
      ];
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128, -74.0060);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result[0].arrivalTime).toBeNull();
      expect(result[0].departureTime).toBeNull();
    });
  });

  describe('calculateStopStatus', () => {
    it('should calculate status for a specific stop', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070),
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7138, -74.0070);

      const result = calculateStopStatus(busLocation, stops[1], stops);

      expect(result.stopId).toBe('stop-2');
      expect(result.status).toBe(StopStatus.CURRENT);
    });

    it('should return UPCOMING status for stop not in route', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7138, -74.0070)
      ];
      const unknownStop = createStop('stop-999', 'Unknown Stop', 40.7200, -74.0100);
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128, -74.0060);

      const result = calculateStopStatus(busLocation, unknownStop, stops);

      expect(result.stopId).toBe('stop-999');
      expect(result.status).toBe(StopStatus.UPCOMING);
    });
  });

  describe('edge cases', () => {
    it('should handle two stops very close together', () => {
      const stops = [
        createStop('stop-1', 'Stop 1', 40.7128, -74.0060),
        createStop('stop-2', 'Stop 2', 40.7129, -74.0061), // Very close to stop-1
        createStop('stop-3', 'Stop 3', 40.7148, -74.0080)
      ];
      // Bus at stop-1
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128, -74.0060);

      const result = calculateStopStatuses(busLocation, stops);

      // Should mark stop-1 as current even though stop-2 is very close
      expect(result[0].status).toBe(StopStatus.CURRENT);
    });

    it('should handle route with many stops', () => {
      const stops = Array.from({ length: 20 }, (_, i) => 
        createStop(`stop-${i}`, `Stop ${i}`, 40.7128 + i * 0.001, -74.0060 + i * 0.001)
      );
      // Bus at stop 10
      const busLocation = createBusLocation('bus-1', 'route-1', 40.7128 + 10 * 0.001, -74.0060 + 10 * 0.001);

      const result = calculateStopStatuses(busLocation, stops);

      expect(result).toHaveLength(20);
      // First 10 stops should be completed
      for (let i = 0; i < 10; i++) {
        expect(result[i].status).toBe(StopStatus.COMPLETED);
      }
      // Stop 10 should be current
      expect(result[10].status).toBe(StopStatus.CURRENT);
      // Remaining stops should be upcoming
      for (let i = 11; i < 20; i++) {
        expect(result[i].status).toBe(StopStatus.UPCOMING);
      }
    });
  });
});

// Feature: bus-tracking-system, Property 8: Stop Status Assignment
/**
 * Property-Based Tests for Stop Status Assignment
 *
 * Property 8: For any bus being tracked on a route with N stops, the system must assign
 * a completion status (completed, current, or upcoming) to ALL N stops.
 *
 * Validates: Requirements 4.1
 */
import * as fc from 'fast-check';

describe('Property 8: Stop Status Assignment', () => {
  // Arbitrary for a single stop at a given index
  const stopArb = (index: number) =>
    fc.record({
      latitude: fc.float({ min: -89, max: 89, noNaN: true }),
      longitude: fc.float({ min: -179, max: 179, noNaN: true }),
    }).map(({ latitude, longitude }) => ({
      id: `stop-${index}`,
      name: `Stop ${index}`,
      latitude,
      longitude,
      address: `Address ${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  // Arbitrary for an array of 1–20 stops
  const stopsArb = fc.integer({ min: 1, max: 20 }).chain((n) =>
    fc.tuple(...Array.from({ length: n }, (_, i) => stopArb(i))) as fc.Arbitrary<Stop[]>
  );

  const busLocationArb = fc.record({
    latitude: fc.float({ min: -89, max: 89, noNaN: true }),
    longitude: fc.float({ min: -179, max: 179, noNaN: true }),
  }).map(({ latitude, longitude }): BusLocation => ({
    busId: 'bus-prop-test',
    routeId: 'route-prop-test',
    latitude,
    longitude,
    timestamp: new Date(),
  }));

  it('every stop in the route receives a valid status (completed, current, or upcoming)', () => {
    const validStatuses = new Set<string>([
      StopStatus.COMPLETED,
      StopStatus.CURRENT,
      StopStatus.UPCOMING,
    ]);

    fc.assert(
      fc.property(stopsArb, busLocationArb, (stops, busLocation) => {
        const result = calculateStopStatuses(busLocation, stops);

        // Result must have exactly N entries — one per stop
        if (result.length !== stops.length) return false;

        // Every stop must have a valid status
        return result.every((progress) => validStatuses.has(progress.status));
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: bus-tracking-system, Property 9: Stop Completion on Passage
/**
 * Property-Based Tests for Stop Completion on Passage
 *
 * Property 9: For any bus and stop, when the bus's GPS location moves past that stop's
 * location (based on sequence and proximity), the system must mark that stop as completed.
 *
 * Validates: Requirements 4.2
 */
describe('Property 9: Stop Completion on Passage', () => {
  // Generate N stops laid out at increasing latitudes (0.01° apart ≈ 1.1 km)
  // so sequence is unambiguous and stops are well beyond the 200m approach threshold.
  const stopsInLineArb = fc.integer({ min: 2, max: 10 }).map((n) =>
    Array.from({ length: n }, (_, i): Stop => ({
      id: `stop-${i}`,
      name: `Stop ${i}`,
      latitude: 40.0 + i * 0.01,   // each stop ~1.1 km apart
      longitude: -74.0,
      address: `Address ${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  it('all stops before the bus position are marked COMPLETED', () => {
    fc.assert(
      fc.property(stopsInLineArb, (stops) => {
        // Pick a bus index k in [1, n-1] so there is at least one stop before it
        const k = Math.floor(stops.length / 2) || 1;

        // Place the bus exactly at stop k's coordinates (within proximity threshold)
        const busLocation: BusLocation = {
          busId: 'bus-prop9',
          routeId: 'route-prop9',
          latitude: stops[k].latitude,
          longitude: stops[k].longitude,
          timestamp: new Date(),
        };

        const result = calculateStopStatuses(busLocation, stops);

        // All stops with index < k must be COMPLETED
        for (let i = 0; i < k; i++) {
          if (result[i].status !== StopStatus.COMPLETED) return false;
        }
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
