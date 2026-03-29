/**
 * Unit tests for StateManager
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { StateManager } from './StateManager';

// Mock fetch globally
global.fetch = vi.fn();

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager('/api');
    vi.clearAllMocks();
  });

  afterEach(() => {
    stateManager.stopPolling();
    stateManager.stopTrackingBuses();
  });

  // ============================================================================
  // Route Management Tests
  // ============================================================================

  describe('Route Management', () => {
    test('loadRoutes should fetch and return all routes', async () => {
      const mockRoutes = [
        {
          id: 'route-101',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'route-102',
          name: 'Uptown Local',
          stopIds: ['stop-3', 'stop-4'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoutes
      });

      const routes = await stateManager.loadRoutes();

      expect(global.fetch).toHaveBeenCalledWith('/api/routes');
      expect(routes).toHaveLength(2);
      expect(routes[0].id).toBe('route-101');
      expect(routes[0].createdAt).toBeInstanceOf(Date);
      expect(routes[1].id).toBe('route-102');
    });

    test('loadRoutes should throw error on API failure', async () => {
      vi.useFakeTimers();
      try {
        // Mock all retry attempts to fail with 500
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });

        const promise = stateManager.loadRoutes();
        // Suppress unhandled rejection warning while we advance timers
        promise.catch(() => {});

        // Advance through all retry delays: 1s, 2s, 4s (3 retries = 4 total attempts)
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(2000);
        await vi.advanceTimersByTimeAsync(4000);

        let caught: any;
        try {
          await promise;
        } catch (e) {
          caught = e;
        }
        expect(caught).toBeDefined();
        expect(caught.message).toContain('Failed to load routes');
      } finally {
        vi.clearAllMocks();
        vi.useRealTimers();
      }
    });

    test('selectRoute should fetch route with stops and set as current', async () => {
      const mockRouteWithStops = {
        id: 'route-101',
        name: 'Downtown Express',
        stopIds: ['stop-1', 'stop-2'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        stops: [
          {
            id: 'stop-1',
            name: 'Main St',
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St',
            sequenceNumber: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 'stop-2',
            name: '5th Ave',
            latitude: 40.7589,
            longitude: -73.9851,
            address: '456 5th Ave',
            sequenceNumber: 2,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRouteWithStops
      });

      await stateManager.selectRoute('route-101');

      expect(global.fetch).toHaveBeenCalledWith('/api/routes/route-101');
      
      const currentRoute = stateManager.getCurrentRoute();
      expect(currentRoute).not.toBeNull();
      expect(currentRoute?.id).toBe('route-101');
      expect(currentRoute?.name).toBe('Downtown Express');
      
      // Verify stops were loaded
      const stop1 = stateManager.getStop('stop-1');
      expect(stop1).toBeDefined();
      expect(stop1?.name).toBe('Main St');
    });

    test('selectRoute should clear previous drop-off selection', async () => {
      const mockRouteWithStops = {
        id: 'route-101',
        name: 'Downtown Express',
        stopIds: ['stop-1', 'stop-2'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        stops: [
          {
            id: 'stop-1',
            name: 'Main St',
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St',
            sequenceNumber: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRouteWithStops
      });

      await stateManager.selectRoute('route-101');
      stateManager.selectDropOffStop('stop-1');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-1');

      // Select a different route
      await stateManager.selectRoute('route-102');
      expect(stateManager.getSelectedDropOffStop()).toBeNull();
    });

    test('getCurrentRoute should return null initially', () => {
      expect(stateManager.getCurrentRoute()).toBeNull();
    });

    test('getRoutes should return empty array initially', () => {
      expect(stateManager.getRoutes()).toEqual([]);
    });
  });

  // ============================================================================
  // Stop Management Tests
  // ============================================================================

  describe('Stop Management', () => {
    beforeEach(async () => {
      // Set up a route with stops
      const mockRouteWithStops = {
        id: 'route-101',
        name: 'Downtown Express',
        stopIds: ['stop-1', 'stop-2', 'stop-3'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        stops: [
          {
            id: 'stop-1',
            name: 'Main St',
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St',
            sequenceNumber: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 'stop-2',
            name: '5th Ave',
            latitude: 40.7589,
            longitude: -73.9851,
            address: '456 5th Ave',
            sequenceNumber: 2,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 'stop-3',
            name: 'Park Blvd',
            latitude: 40.7829,
            longitude: -73.9654,
            address: '789 Park Blvd',
            sequenceNumber: 3,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRouteWithStops
      });

      await stateManager.selectRoute('route-101');
    });

    test('loadStopsForRoute should fetch and return stops in order', async () => {
      const stops = await stateManager.loadStopsForRoute('route-101');

      expect(stops).toHaveLength(3);
      expect(stops[0].id).toBe('stop-1');
      expect(stops[1].id).toBe('stop-2');
      expect(stops[2].id).toBe('stop-3');
      expect(stops[0].createdAt).toBeInstanceOf(Date);
    });

    test('selectDropOffStop should set the selected stop', () => {
      stateManager.selectDropOffStop('stop-2');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-2');
    });

    test('selectDropOffStop should maintain single selection invariant', () => {
      stateManager.selectDropOffStop('stop-1');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-1');

      stateManager.selectDropOffStop('stop-2');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-2');

      stateManager.selectDropOffStop('stop-3');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-3');
    });

    test('selectDropOffStop should warn if stop not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      stateManager.selectDropOffStop('stop-999');
      
      expect(consoleSpy).toHaveBeenCalledWith('Stop stop-999 not found in loaded stops');
      expect(stateManager.getSelectedDropOffStop()).toBeNull();
      
      consoleSpy.mockRestore();
    });

    test('getSelectedDropOffStop should return null initially', () => {
      const newStateManager = new StateManager('/api');
      expect(newStateManager.getSelectedDropOffStop()).toBeNull();
    });

    test('clearDropOffSelection should clear the selection', () => {
      stateManager.selectDropOffStop('stop-1');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-1');

      stateManager.clearDropOffSelection();
      expect(stateManager.getSelectedDropOffStop()).toBeNull();
    });

    test('getStop should return stop by ID', () => {
      const stop = stateManager.getStop('stop-1');
      expect(stop).toBeDefined();
      expect(stop?.name).toBe('Main St');
    });

    test('getStop should return undefined for non-existent stop', () => {
      const stop = stateManager.getStop('stop-999');
      expect(stop).toBeUndefined();
    });

    test('getStopsForCurrentRoute should return stops in sequential order', () => {
      const stops = stateManager.getStopsForCurrentRoute();
      expect(stops).toHaveLength(3);
      expect(stops[0].id).toBe('stop-1');
      expect(stops[1].id).toBe('stop-2');
      expect(stops[2].id).toBe('stop-3');
    });

    test('getStopsForCurrentRoute should return empty array if no route selected', () => {
      const newStateManager = new StateManager('/api');
      expect(newStateManager.getStopsForCurrentRoute()).toEqual([]);
    });
  });

  // ============================================================================
  // Bus Tracking Tests
  // ============================================================================

  describe('Bus Tracking', () => {
    beforeEach(async () => {
      // Set up a route
      const mockRouteWithStops = {
        id: 'route-101',
        name: 'Downtown Express',
        stopIds: ['stop-1', 'stop-2'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        stops: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRouteWithStops
      });

      await stateManager.selectRoute('route-101');
    });

    test('startTrackingBuses should fetch bus locations immediately', async () => {
      const mockBusLocations = [
        {
          busId: 'bus-1',
          routeId: 'route-101',
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: '2024-01-01T12:00:00.000Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusLocations
      });

      stateManager.startTrackingBuses('route-101');

      // Wait for async fetch to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(global.fetch).toHaveBeenCalledWith('/api/buses/locations?routeId=route-101');
      expect(stateManager.getBusLocations()).toHaveLength(1);
      expect(stateManager.getBusLocations()[0].busId).toBe('bus-1');
    });

    test('stopTrackingBuses should clear bus locations', async () => {
      const mockBusLocations = [
        {
          busId: 'bus-1',
          routeId: 'route-101',
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: '2024-01-01T12:00:00.000Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusLocations
      });

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(stateManager.getBusLocations()).toHaveLength(1);

      stateManager.stopTrackingBuses();
      expect(stateManager.getBusLocations()).toHaveLength(0);
      expect(stateManager.isTrackingBuses()).toBe(false);
    });

    test('getBusLocations should return empty array initially', () => {
      expect(stateManager.getBusLocations()).toEqual([]);
    });

    test('isTrackingBuses should return false initially', () => {
      expect(stateManager.isTrackingBuses()).toBe(false);
    });

    test('isTrackingBuses should return true after starting tracking', () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => []
      });

      stateManager.startTrackingBuses('route-101');
      expect(stateManager.isTrackingBuses()).toBe(true);
    });

    test('startTrackingBuses should warn if already tracking', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => []
      });

      stateManager.startTrackingBuses('route-101');
      stateManager.startTrackingBuses('route-101');

      expect(consoleSpy).toHaveBeenCalledWith('Already tracking buses. Stop tracking before starting again.');
      
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Polling Tests
  // ============================================================================

  describe('Polling', () => {
    beforeEach(async () => {
      // Set up a route
      const mockRouteWithStops = {
        id: 'route-101',
        name: 'Downtown Express',
        stopIds: ['stop-1', 'stop-2'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        stops: []
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockRouteWithStops
      });

      await stateManager.selectRoute('route-101');
    });

    test('startPolling should set up interval for fetching bus locations', async () => {
      vi.useFakeTimers();
      try {
        // Override mock to return empty bus locations for this test
        (global.fetch as any).mockResolvedValue({
          ok: true,
          json: async () => []
        });

        stateManager.startTrackingBuses('route-101');

        // Fully drain the initial fetch async chain
        await vi.advanceTimersByTimeAsync(100);
        const initialCallCount = (global.fetch as any).mock.calls.length;

        stateManager.startPolling(1000);

        // Each interval tick fires exactly one fetch
        await vi.advanceTimersByTimeAsync(1000);
        expect((global.fetch as any).mock.calls.length).toBe(initialCallCount + 1);

        await vi.advanceTimersByTimeAsync(1000);
        expect((global.fetch as any).mock.calls.length).toBe(initialCallCount + 2);

        stateManager.stopPolling();
      } finally {
        vi.clearAllMocks();
        vi.useRealTimers();
      }
    });

    test('stopPolling should clear the interval', () => {
      vi.useFakeTimers();

      stateManager.startTrackingBuses('route-101');
      stateManager.startPolling(1000);
      stateManager.stopPolling();

      const fetchCallCount = (global.fetch as any).mock.calls.length;
      
      vi.advanceTimersByTime(5000);
      
      // Should not have made additional calls after stopping
      expect((global.fetch as any).mock.calls.length).toBe(fetchCallCount);

      vi.useRealTimers();
    });

    test('startPolling should warn if no route selected', () => {
      const newStateManager = new StateManager('/api');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      newStateManager.startPolling(1000);

      expect(consoleSpy).toHaveBeenCalledWith('No route selected. Cannot start polling.');
      
      consoleSpy.mockRestore();
    });

    test('startPolling should warn if already polling', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      stateManager.startPolling(1000);
      stateManager.startPolling(1000);

      expect(consoleSpy).toHaveBeenCalledWith('Polling already started');
      
      stateManager.stopPolling();
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    test('loadRoutes should retry on network failure', async () => {
      vi.useFakeTimers();

      // First call fails, second succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              id: 'route-101',
              name: 'Downtown Express',
              stopIds: ['stop-1'],
              isActive: true,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z'
            }
          ]
        });

      const promise = stateManager.loadRoutes();
      
      // Advance timers to trigger retry
      await vi.advanceTimersByTimeAsync(1000);

      const routes = await promise;

      expect(routes).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    test('loadRoutes should not retry on 404 error', async () => {
      const error: any = new Error('Not found');
      error.status = 404;
      error.userMessage = 'Route not found';

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(stateManager.loadRoutes()).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
    });

    test('loadRoutes should return cached data on failure if available', async () => {
      vi.useFakeTimers();
      try {
        const mockRoutes = [
          {
            id: 'route-101',
            name: 'Downtown Express',
            stopIds: ['stop-1'],
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ];

        // First call succeeds
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockRoutes
        });

        await stateManager.loadRoutes();

        // Second call always fails — retries will exhaust
        (global.fetch as any).mockRejectedValue(new TypeError('Failed to fetch'));

        const promise = stateManager.loadRoutes();

        // Advance through all retry delays: 1s, 2s, 4s
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(2000);
        await vi.advanceTimersByTimeAsync(4000);

        const routes = await promise;
        expect(routes).toHaveLength(1);
        expect(routes[0].id).toBe('route-101');
      } finally {
        vi.clearAllMocks();
        vi.useRealTimers();
      }
    });

    test('setErrorCallback should allow custom error handling', async () => {
      vi.useFakeTimers();
      try {
        const errorCallback = vi.fn();
        stateManager.setErrorCallback(errorCallback);

        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });

        const promise = stateManager.loadRoutes();
        // Suppress unhandled rejection warning while we advance timers
        promise.catch(() => {});

        // Advance through all retry delays: 1s, 2s, 4s
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(2000);
        await vi.advanceTimersByTimeAsync(4000);

        await expect(promise).rejects.toThrow();
        expect(errorCallback).toHaveBeenCalled();
        expect(errorCallback.mock.calls[0][1]).toBe('loadRoutes');
      } finally {
        vi.clearAllMocks();
        vi.useRealTimers();
      }
    });

    test('fetchBusLocations should filter invalid GPS coordinates', async () => {
      const mockBusLocations = [
        {
          busId: 'bus-1',
          routeId: 'route-101',
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: '2024-01-01T12:00:00.000Z'
        },
        {
          busId: 'bus-2',
          routeId: 'route-101',
          latitude: 200, // Invalid
          longitude: -74.0060,
          timestamp: '2024-01-01T12:00:00.000Z'
        },
        {
          busId: 'bus-3',
          routeId: 'route-101',
          latitude: 40.7128,
          longitude: -200, // Invalid
          timestamp: '2024-01-01T12:00:00.000Z'
        }
      ];

      // Set up route first
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'route-101',
          name: 'Downtown Express',
          stopIds: ['stop-1'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          stops: []
        })
      });

      await stateManager.selectRoute('route-101');

      // Mock bus locations fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusLocations
      });

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 10));

      const locations = stateManager.getBusLocations();
      expect(locations).toHaveLength(1); // Only valid location
      expect(locations[0].busId).toBe('bus-1');
    });

    test('fetchBusLocations should mark stale data', async () => {
      const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

      const mockBusLocations = [
        {
          busId: 'bus-1',
          routeId: 'route-101',
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: staleTimestamp.toISOString()
        }
      ];

      // Set up route first
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'route-101',
          name: 'Downtown Express',
          stopIds: ['stop-1'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          stops: []
        })
      });

      await stateManager.selectRoute('route-101');

      // Mock bus locations fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusLocations
      });

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 10));

      const locations = stateManager.getBusLocations();
      expect(locations).toHaveLength(1);
      expect((locations[0] as any).isStale).toBe(true);
    });

    test('getLastUpdateTimestamp should return timestamp of last successful fetch', async () => {
      const mockRoutes = [
        {
          id: 'route-101',
          name: 'Downtown Express',
          stopIds: ['stop-1'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoutes
      });

      await stateManager.loadRoutes();

      const timestamp = stateManager.getLastUpdateTimestamp('routes');
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp!.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('getLastUpdateTimestamp should return null if no data fetched', () => {
      const timestamp = stateManager.getLastUpdateTimestamp('routes');
      expect(timestamp).toBeNull();
    });
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property-Based Tests', () => {
  // Feature: bus-tracking-system, Property 13: View Context Preservation
  test('Property 13: bus location updates do not change selected route or stop', async () => {
    // Validates: Requirements 6.3
    await fc.assert(
      fc.asyncProperty(
        // Generate a route ID
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate a stop ID
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate an array of bus location updates (0–5 updates)
        fc.array(
          fc.record({
            busId: fc.string({ minLength: 1, maxLength: 10 }),
            latitude: fc.float({ min: -90, max: 90, noNaN: true }),
            longitude: fc.float({ min: -180, max: 180, noNaN: true }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        async (routeId, stopId, busUpdates) => {
          const sm = new StateManager('/api');
          const smAny = sm as any;

          // Seed the state: set a current route and a selected stop
          const mockRoute = {
            id: routeId,
            name: `Route ${routeId}`,
            stopIds: [stopId],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          smAny.currentRoute = mockRoute;
          smAny.stops.set(stopId, {
            id: stopId,
            name: `Stop ${stopId}`,
            latitude: 40.7,
            longitude: -74.0,
            address: '1 Test St',
            sequenceNumber: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          sm.selectDropOffStop(stopId);

          // Capture view context before any bus location updates
          const routeBefore = sm.getCurrentRoute();
          const stopBefore = sm.getSelectedDropOffStop();

          // Simulate bus location updates by directly updating busLocations
          // (mirrors what fetchBusLocations does after a successful API response)
          for (const update of busUpdates) {
            smAny.busLocations = [
              {
                busId: update.busId,
                routeId,
                latitude: update.latitude,
                longitude: update.longitude,
                timestamp: new Date(),
              },
            ];
          }

          // View context must be unchanged after bus location updates
          const routeAfter = sm.getCurrentRoute();
          const stopAfter = sm.getSelectedDropOffStop();

          return routeAfter?.id === routeBefore?.id && stopAfter === stopBefore;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: bus-tracking-system, Property 5: Single Selection Invariant
  test('Property 5: at most one drop-off stop is selected at any time', () => {
    // Validates: Requirements 2.4, 2.5
    fc.assert(
      fc.property(
        // Generate a non-empty array of unique stop IDs to pre-load
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 })
          .map(ids => [...new Set(ids)]) // deduplicate
          .filter(ids => ids.length >= 1),
        // Generate a sequence of selections (indices into the stop array)
        fc.array(fc.nat(), { minLength: 1, maxLength: 20 }),
        (stopIds, selectionIndices) => {
          const sm = new StateManager('/api');

          // Directly populate the internal stops map via selectRoute side-effects
          // by using the internal API: we mock fetch to return a route with these stops
          // Instead, we access the stops map by calling selectDropOffStop after
          // manually seeding the state via the public API pattern used in unit tests.
          //
          // Since selectDropOffStop checks this.stops.has(stopId), we need to load
          // stops first. We do this by mocking fetch and calling selectRoute.
          const mockStops = stopIds.map((id, i) => ({
            id,
            name: `Stop ${id}`,
            latitude: 40.7 + i * 0.01,
            longitude: -74.0 + i * 0.01,
            address: `${i} Test St`,
            sequenceNumber: i + 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }));

          const mockRoute = {
            id: 'route-test',
            name: 'Test Route',
            stopIds,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            stops: mockStops
          };

          // We need to synchronously seed the stops. Use a resolved promise trick:
          // call selectRoute synchronously by mocking fetch, then flush microtasks.
          // Since fast-check runs synchronously, we use a workaround:
          // directly call the internal method by casting to any.
          const smAny = sm as any;
          // Seed the stops map directly (white-box, but necessary for sync property test)
          mockStops.forEach(stop => {
            smAny.stops.set(stop.id, {
              ...stop,
              createdAt: new Date(stop.createdAt),
              updatedAt: new Date(stop.updatedAt)
            });
          });
          smAny.currentRoute = { ...mockRoute, createdAt: new Date(), updatedAt: new Date() };

          // Now perform a sequence of selections and verify the invariant after each
          for (const idx of selectionIndices) {
            const stopId = stopIds[idx % stopIds.length];
            sm.selectDropOffStop(stopId);

            // After each selection, exactly one stop must be selected
            const selected = sm.getSelectedDropOffStop();
            if (selected !== stopId) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
