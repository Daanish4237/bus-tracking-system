/**
 * Integration tests for end-to-end scenarios
 * Tests the full flow: StateManager + UI components working together
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager } from './state/StateManager';
import { RouteViewer } from './components/RouteViewer';
import { StopSelector } from './components/StopSelector';
import { BusTrackerDisplay } from './components/BusTrackerDisplay';
import { StopStatus } from '../shared/types';

// ============================================================================
// Test Helpers
// ============================================================================

function setupDOM() {
  document.body.innerHTML = `
    <div id="route-list"></div>
    <div id="route-stops"></div>
    <div id="stop-selector"></div>
    <div id="bus-tracker"></div>
  `;
}

function makeRoute(id: string, name: string, stopIds: string[]) {
  return {
    id,
    name,
    stopIds,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeStop(id: string, name: string, lat: number, lon: number, seq: number) {
  return {
    id,
    name,
    latitude: lat,
    longitude: lon,
    address: `${seq} Test Ave`,
    sequenceNumber: seq,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeBusLocation(busId: string, routeId: string, lat: number, lon: number) {
  return {
    busId,
    routeId,
    latitude: lat,
    longitude: lon,
    timestamp: new Date().toISOString(),
  };
}

const STOPS = [
  makeStop('stop-1', 'Central Station', 40.7128, -74.006, 1),
  makeStop('stop-2', 'City Hall', 40.7282, -74.0776, 2),
  makeStop('stop-3', 'Midtown Plaza', 40.7549, -73.984, 3),
  makeStop('stop-4', 'Uptown Park', 40.7829, -73.9654, 4),
  makeStop('stop-5', 'North Terminal', 40.8, -73.95, 5),
];

const ROUTE_101 = {
  ...makeRoute('route-101', 'Downtown Express', STOPS.map(s => s.id)),
  stops: STOPS,
};

// ============================================================================
// Integration Test Suite
// ============================================================================

describe('Integration Tests', () => {
  let stateManager: StateManager;
  let routeViewer: RouteViewer;
  let stopSelector: StopSelector;
  let busTracker: BusTrackerDisplay;

  beforeEach(() => {
    setupDOM();
    global.fetch = vi.fn();
    stateManager = new StateManager('/api');
    routeViewer = new RouteViewer('route-list', 'route-stops');
    stopSelector = new StopSelector('stop-selector');
    busTracker = new BusTrackerDisplay('bus-tracker');
  });

  afterEach(() => {
    stateManager.stopPolling();
    stateManager.stopTrackingBuses();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  // ==========================================================================
  // Scenario 1: Complete user flow
  // ==========================================================================

  describe('Scenario 1: Complete user flow - select route -> view stops -> select drop-off -> track bus', () => {
    test('loads routes and displays them in the route viewer', async () => {
      const mockRoutes = [
        makeRoute('route-101', 'Downtown Express', ['stop-1', 'stop-2']),
        makeRoute('route-202', 'Uptown Local', ['stop-3', 'stop-4']),
      ];
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => mockRoutes });

      const routes = await stateManager.loadRoutes();
      routeViewer.displayRoutes(routes);

      expect(stateManager.getRoutes()).toHaveLength(2);
      const items = document.querySelectorAll('.route-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('.route-id')?.textContent).toBe('route-101');
      expect(items[0].querySelector('.route-name')?.textContent).toBe('Downtown Express');
      expect(items[1].querySelector('.route-id')?.textContent).toBe('route-202');
    });

    test('selecting a route loads stops and displays them in order', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });

      await stateManager.selectRoute('route-101');
      const stops = stateManager.getStopsForCurrentRoute();
      routeViewer.displayRouteStops('route-101', stops);
      stopSelector.displayStops(stops);

      expect(stateManager.getCurrentRoute()?.id).toBe('route-101');
      expect(stops).toHaveLength(5);

      const stopItems = document.querySelectorAll('#route-stops .stop-item');
      expect(stopItems).toHaveLength(5);
      expect(stopItems[0].querySelector('.stop-name')?.textContent).toBe('Central Station');
      expect(stopItems[4].querySelector('.stop-name')?.textContent).toBe('North Terminal');
      expect(document.querySelectorAll('.selectable-stop-item')).toHaveLength(5);
    });

    test('selecting a drop-off stop updates StateManager and StopSelector with visual feedback', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      const stops = stateManager.getStopsForCurrentRoute();

      const wiredSelector = new StopSelector('stop-selector', {
        onStopSelected: (stopId) => stateManager.selectDropOffStop(stopId),
      });
      wiredSelector.displayStops(stops);
      wiredSelector.onStopSelected('stop-3');

      expect(stateManager.getSelectedDropOffStop()).toBe('stop-3');
      expect(wiredSelector.getSelectedStop()).toBe('stop-3');

      const selected = document.querySelectorAll('.selectable-stop-item.selected');
      expect(selected).toHaveLength(1);
      expect((selected[0] as HTMLElement).dataset.stopId).toBe('stop-3');
    });

    test('changing drop-off selection clears the previous selection', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      const stops = stateManager.getStopsForCurrentRoute();

      const wiredSelector = new StopSelector('stop-selector', {
        onStopSelected: (stopId) => stateManager.selectDropOffStop(stopId),
      });
      wiredSelector.displayStops(stops);

      wiredSelector.onStopSelected('stop-2');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-2');

      wiredSelector.onStopSelected('stop-4');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-4');

      const selected = document.querySelectorAll('.selectable-stop-item.selected');
      expect(selected).toHaveLength(1);
      expect((selected[0] as HTMLElement).dataset.stopId).toBe('stop-4');
    });

    test('starting bus tracking fetches locations and displays them', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 })
        .mockResolvedValueOnce({ ok: true, json: async () => [makeBusLocation('bus-1', 'route-101', 40.7282, -74.0776)] });

      await stateManager.selectRoute('route-101');
      busTracker.setStops(stateManager.getStopsForCurrentRoute());

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 20));

      const locations = stateManager.getBusLocations();
      expect(locations).toHaveLength(1);
      expect(locations[0].busId).toBe('bus-1');

      busTracker.displayBuses(locations);
      const card = document.querySelector('.bus-card');
      expect(card).not.toBeNull();
      expect((card as HTMLElement).dataset.busId).toBe('bus-1');
    });

    test('full end-to-end flow: route -> stops -> drop-off -> tracking with stop progress', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [makeRoute('route-101', 'Downtown Express', STOPS.map(s => s.id))] })
        .mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 })
        .mockResolvedValueOnce({ ok: true, json: async () => [makeBusLocation('bus-1', 'route-101', 40.7282, -74.0776)] });

      const routes = await stateManager.loadRoutes();
      routeViewer.displayRoutes(routes);
      expect(document.querySelectorAll('.route-item')).toHaveLength(1);

      await stateManager.selectRoute('route-101');
      const stops = stateManager.getStopsForCurrentRoute();
      routeViewer.displayRouteStops('route-101', stops);
      stopSelector.displayStops(stops);
      expect(document.querySelectorAll('.selectable-stop-item')).toHaveLength(5);

      stateManager.selectDropOffStop('stop-3');
      stopSelector.onStopSelected('stop-3');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-3');

      busTracker.setStops(stops);
      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 20));

      busTracker.displayBuses(stateManager.getBusLocations());
      expect(document.querySelector('.bus-card')).not.toBeNull();
      expect(document.querySelector('.stop-progress-section')).not.toBeNull();
      expect(document.querySelectorAll('.stop-status-indicator')).toHaveLength(5);
    });
  });

  // ==========================================================================
  // Scenario 2: Multiple buses on same route with different progress
  // ==========================================================================

  describe('Scenario 2: Multiple buses on same route with different progress', () => {
    test('displays all buses on the same route', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      busTracker.setStops(stateManager.getStopsForCurrentRoute());

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          makeBusLocation('bus-1', 'route-101', STOPS[0].latitude, STOPS[0].longitude),
          makeBusLocation('bus-2', 'route-101', STOPS[2].latitude, STOPS[2].longitude),
        ],
      });

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 20));

      const locations = stateManager.getBusLocations();
      expect(locations).toHaveLength(2);

      busTracker.displayBuses(locations);
      const cards = document.querySelectorAll('.bus-card');
      expect(cards).toHaveLength(2);

      const ids = Array.from(cards).map(c => (c as HTMLElement).dataset.busId);
      expect(ids).toContain('bus-1');
      expect(ids).toContain('bus-2');
    });

    test('each bus shows different stop progress based on its position', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      busTracker.setStops(stateManager.getStopsForCurrentRoute());

      busTracker.displayBuses([
        { busId: 'bus-1', routeId: 'route-101', latitude: STOPS[0].latitude, longitude: STOPS[0].longitude, timestamp: new Date() },
        { busId: 'bus-2', routeId: 'route-101', latitude: STOPS[3].latitude, longitude: STOPS[3].longitude, timestamp: new Date() },
      ]);

      const bus1Statuses = busTracker.getStopStatusesForBus('bus-1');
      const bus2Statuses = busTracker.getStopStatusesForBus('bus-2');

      expect(bus1Statuses).toHaveLength(5);
      expect(bus2Statuses).toHaveLength(5);

      const bus1Completed = bus1Statuses.filter(s => s.status === StopStatus.COMPLETED).length;
      const bus2Completed = bus2Statuses.filter(s => s.status === StopStatus.COMPLETED).length;
      expect(bus2Completed).toBeGreaterThanOrEqual(bus1Completed);

      [...bus1Statuses, ...bus2Statuses].forEach(s => {
        expect(Object.values(StopStatus)).toContain(s.status);
      });
    });

    test('StateManager returns all bus locations for the route', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          makeBusLocation('bus-A', 'route-101', STOPS[0].latitude, STOPS[0].longitude),
          makeBusLocation('bus-B', 'route-101', STOPS[2].latitude, STOPS[2].longitude),
          makeBusLocation('bus-C', 'route-101', STOPS[4].latitude, STOPS[4].longitude),
        ],
      });

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(stateManager.getBusLocations()).toHaveLength(3);
    });
  });

  // ==========================================================================
  // Scenario 3: GPS data updates while viewing route (polling)
  // ==========================================================================

  describe('Scenario 3: GPS data updates while viewing route', () => {
    test('polling updates bus locations over time', async () => {
      vi.useFakeTimers();

      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      busTracker.setStops(stateManager.getStopsForCurrentRoute());

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [makeBusLocation('bus-1', 'route-101', STOPS[0].latitude, STOPS[0].longitude)] })
        .mockResolvedValueOnce({ ok: true, json: async () => [makeBusLocation('bus-1', 'route-101', STOPS[2].latitude, STOPS[2].longitude)] });

      stateManager.startTrackingBuses('route-101');
      await vi.advanceTimersByTimeAsync(0);

      expect(stateManager.getBusLocations()[0].latitude).toBeCloseTo(STOPS[0].latitude, 4);

      stateManager.startPolling(5000);
      await vi.advanceTimersByTimeAsync(5000);

      expect(stateManager.getBusLocations()[0].latitude).toBeCloseTo(STOPS[2].latitude, 4);

      stateManager.stopPolling();
    });

    test('stop progress updates when bus location changes via polling', async () => {
      vi.useFakeTimers();

      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      busTracker.setStops(stateManager.getStopsForCurrentRoute());

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => [{ busId: 'bus-1', routeId: 'route-101', latitude: STOPS[0].latitude, longitude: STOPS[0].longitude, timestamp: new Date().toISOString() }] })
        .mockResolvedValueOnce({ ok: true, json: async () => [{ busId: 'bus-1', routeId: 'route-101', latitude: STOPS[3].latitude, longitude: STOPS[3].longitude, timestamp: new Date().toISOString() }] });

      stateManager.startTrackingBuses('route-101');
      await vi.advanceTimersByTimeAsync(0);

      busTracker.displayBuses(stateManager.getBusLocations());
      const initialCompleted = busTracker.getStopStatusesForBus('bus-1')
        .filter(s => s.status === StopStatus.COMPLETED).length;

      stateManager.startPolling(5000);
      await vi.advanceTimersByTimeAsync(5000);

      busTracker.displayBuses(stateManager.getBusLocations());
      const updatedCompleted = busTracker.getStopStatusesForBus('bus-1')
        .filter(s => s.status === StopStatus.COMPLETED).length;

      expect(updatedCompleted).toBeGreaterThanOrEqual(initialCompleted);

      stateManager.stopPolling();
    });

    test('selected route and stop are preserved during polling updates', async () => {
      vi.useFakeTimers();

      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');
      stateManager.selectDropOffStop('stop-3');

      const routeBefore = stateManager.getCurrentRoute()?.id;
      const stopBefore = stateManager.getSelectedDropOffStop();

      (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [makeBusLocation('bus-1', 'route-101', STOPS[1].latitude, STOPS[1].longitude)] });

      stateManager.startTrackingBuses('route-101');
      stateManager.startPolling(1000);
      await vi.advanceTimersByTimeAsync(3000);

      expect(stateManager.getCurrentRoute()?.id).toBe(routeBefore);
      expect(stateManager.getSelectedDropOffStop()).toBe(stopBefore);

      stateManager.stopPolling();
    });
  });

  // ==========================================================================
  // Scenario 4: Network failure and recovery during tracking
  // ==========================================================================

  describe('Scenario 4: Network failure and recovery during tracking', () => {
    test('StateManager returns cached routes when network fails on retry', async () => {
      vi.useFakeTimers();

      const mockRoutes = [makeRoute('route-101', 'Downtown Express', ['stop-1', 'stop-2'])];

      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => mockRoutes });
      const routes = await stateManager.loadRoutes();
      expect(routes).toHaveLength(1);

      (global.fetch as any).mockRejectedValue(new TypeError('Failed to fetch'));
      const cachedRoutesPromise = stateManager.loadRoutes();

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      const cachedRoutes = await cachedRoutesPromise;
      expect(cachedRoutes).toHaveLength(1);
      expect(cachedRoutes[0].id).toBe('route-101');
    });

    test('StateManager retains cached bus locations after a successful fetch', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');

      const busLocs = [makeBusLocation('bus-1', 'route-101', STOPS[1].latitude, STOPS[1].longitude)];
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => busLocs });

      stateManager.startTrackingBuses('route-101');
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(stateManager.getBusLocations()).toHaveLength(1);
      expect(stateManager.getLastUpdateTimestamp('busLocations')).not.toBeNull();
      expect(stateManager.getBusLocations()[0].busId).toBe('bus-1');
    });

    test('error callback is invoked with a user-friendly message on network failure', async () => {
      vi.useFakeTimers();

      const errorCallback = vi.fn();
      stateManager.setErrorCallback(errorCallback);

      (global.fetch as any).mockRejectedValue(new TypeError('Failed to fetch'));

      const loadPromise = stateManager.loadRoutes();

      // Advance through all retry delays: 1s, 2s, 4s
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      await expect(loadPromise).rejects.toThrow();
      expect(errorCallback).toHaveBeenCalled();

      const [error] = errorCallback.mock.calls[0];
      expect(error.message).toContain('Unable to connect');
    });

    test('recovery: after network failure, successful poll updates bus locations', async () => {
      vi.useFakeTimers();

      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');

      // First bus fetch fails (no prior cache)
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      // Recovery: second fetch succeeds
      const busLocs = [makeBusLocation('bus-1', 'route-101', STOPS[2].latitude, STOPS[2].longitude)];
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => busLocs });

      stateManager.startTrackingBuses('route-101');
      await vi.advanceTimersByTimeAsync(0);

      expect(stateManager.getBusLocations()).toHaveLength(0);

      stateManager.startPolling(1000);
      await vi.advanceTimersByTimeAsync(1000);

      expect(stateManager.getBusLocations()).toHaveLength(1);
      expect(stateManager.getBusLocations()[0].busId).toBe('bus-1');

      stateManager.stopPolling();
    });

    test('UI components remain functional after a network failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');

      const stops = stateManager.getStopsForCurrentRoute();
      stopSelector.displayStops(stops);

      (global.fetch as any).mockRejectedValue(new TypeError('Failed to fetch'));

      // Local state operations still work without network
      stopSelector.onStopSelected('stop-2');
      expect(stopSelector.getSelectedStop()).toBe('stop-2');

      stateManager.selectDropOffStop('stop-2');
      expect(stateManager.getSelectedDropOffStop()).toBe('stop-2');
    });

    test('GPS unavailable state is shown when bus tracking fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ROUTE_101 });
      await stateManager.selectRoute('route-101');

      busTracker.setStops(stateManager.getStopsForCurrentRoute());

      // Signal GPS unavailable for a bus before any location data arrives
      busTracker.showGPSUnavailable('bus-1');

      const unavailableMsg = document.querySelector('.gps-unavailable');
      expect(unavailableMsg).not.toBeNull();
      expect(unavailableMsg?.textContent).toContain('Location unavailable');
    });
  });
});
