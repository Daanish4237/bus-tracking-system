/**
 * Unit tests for BusTrackerDisplay component
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BusTrackerDisplay } from './BusTrackerDisplay';
import { BusLocation, Stop, StopStatus } from '../../shared/types';

describe('BusTrackerDisplay', () => {
  let container: HTMLElement;
  let busTracker: BusTrackerDisplay;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'test-bus-tracker';
    document.body.appendChild(container);

    // Create BusTrackerDisplay instance
    busTracker = new BusTrackerDisplay('test-bus-tracker');
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe('Constructor', () => {
    it('should throw error if container element not found', () => {
      expect(() => {
        new BusTrackerDisplay('non-existent-id');
      }).toThrow('Element with id "non-existent-id" not found');
    });

    it('should create instance with valid container', () => {
      expect(busTracker).toBeDefined();
      expect(busTracker).toBeInstanceOf(BusTrackerDisplay);
    });
  });

  describe('Empty State', () => {
    it('should display "no buses" message when no buses are tracked', () => {
      busTracker.displayBuses([]);
      
      const message = container.querySelector('.no-buses');
      expect(message).toBeTruthy();
      expect(message?.textContent).toBe('No active buses on this route');
    });

    it('should display "no buses" message initially', () => {
      // Trigger render by calling displayBuses with empty array
      busTracker.displayBuses([]);
      
      const message = container.querySelector('.no-buses');
      expect(message).toBeTruthy();
    });
  });

  describe('Single Bus Display', () => {
    const sampleBus: BusLocation = {
      busId: 'bus-001',
      routeId: 'route-101',
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: new Date(),
      speed: 30,
      heading: 90
    };

    it('should display single bus location', () => {
      busTracker.displayBuses([sampleBus]);

      const busCard = container.querySelector('.bus-card');
      expect(busCard).toBeTruthy();
      expect(busCard?.getAttribute('data-bus-id')).toBe('bus-001');
    });

    it('should display bus title', () => {
      busTracker.displayBuses([sampleBus]);

      const busTitle = container.querySelector('.bus-title');
      expect(busTitle?.textContent).toBe('Bus bus-001');
    });

    it('should display GPS coordinates', () => {
      busTracker.displayBuses([sampleBus]);

      const coordinates = container.querySelector('.bus-coordinates');
      expect(coordinates?.textContent).toContain('40.712800');
      expect(coordinates?.textContent).toContain('-74.006000');
    });

    it('should display timestamp', () => {
      busTracker.displayBuses([sampleBus]);

      const timestamp = container.querySelector('.bus-timestamp');
      expect(timestamp?.textContent).toContain('Last updated:');
      expect(timestamp?.textContent).toContain('just now');
    });

    it('should update bus location', () => {
      busTracker.displayBuses([sampleBus]);

      const updatedBus: BusLocation = {
        ...sampleBus,
        latitude: 40.7500,
        longitude: -73.9900
      };

      busTracker.updateBusLocation('bus-001', updatedBus);

      const coordinates = container.querySelector('.bus-coordinates');
      expect(coordinates?.textContent).toContain('40.750000');
      expect(coordinates?.textContent).toContain('-73.990000');
    });
  });

  describe('Multiple Bus Display', () => {
    const bus1: BusLocation = {
      busId: 'bus-001',
      routeId: 'route-101',
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: new Date(),
    };

    const bus2: BusLocation = {
      busId: 'bus-002',
      routeId: 'route-101',
      latitude: 40.7500,
      longitude: -73.9900,
      timestamp: new Date(),
    };

    const bus3: BusLocation = {
      busId: 'bus-003',
      routeId: 'route-101',
      latitude: 40.7300,
      longitude: -74.0000,
      timestamp: new Date(),
    };

    it('should display multiple buses', () => {
      busTracker.displayBuses([bus1, bus2, bus3]);

      const busCards = container.querySelectorAll('.bus-card');
      expect(busCards.length).toBe(3);
    });

    it('should display correct bus IDs for multiple buses', () => {
      busTracker.displayBuses([bus1, bus2, bus3]);

      const busCards = container.querySelectorAll('.bus-card');
      const busIds = Array.from(busCards).map(card => 
        (card as HTMLElement).dataset.busId
      );

      expect(busIds).toContain('bus-001');
      expect(busIds).toContain('bus-002');
      expect(busIds).toContain('bus-003');
    });

    it('should display different locations for each bus', () => {
      busTracker.displayBuses([bus1, bus2]);

      const coordinates = container.querySelectorAll('.bus-coordinates');
      expect(coordinates.length).toBe(2);
      
      const coord1 = coordinates[0].textContent;
      const coord2 = coordinates[1].textContent;
      
      expect(coord1).not.toBe(coord2);
    });

    it('should display all buses when multiple buses are at the same location', () => {
      // Validates: Requirements 3.5 - multiple buses at identical GPS coordinates
      const sameLatitude = 40.7128;
      const sameLongitude = -74.0060;

      const busA: BusLocation = {
        busId: 'bus-A',
        routeId: 'route-101',
        latitude: sameLatitude,
        longitude: sameLongitude,
        timestamp: new Date(),
      };

      const busB: BusLocation = {
        busId: 'bus-B',
        routeId: 'route-101',
        latitude: sameLatitude,
        longitude: sameLongitude,
        timestamp: new Date(),
      };

      busTracker.displayBuses([busA, busB]);

      // Both buses must be rendered even though they share coordinates
      const busCards = container.querySelectorAll('.bus-card');
      expect(busCards.length).toBe(2);

      const busIds = Array.from(busCards).map(c => (c as HTMLElement).dataset.busId);
      expect(busIds).toContain('bus-A');
      expect(busIds).toContain('bus-B');

      // Both cards should show the same coordinates
      const coordinates = container.querySelectorAll('.bus-coordinates');
      expect(coordinates.length).toBe(2);
      expect(coordinates[0].textContent).toContain('40.712800');
      expect(coordinates[1].textContent).toContain('40.712800');
    });
  });

  describe('GPS Unavailable State', () => {
    const sampleBus: BusLocation = {
      busId: 'bus-001',
      routeId: 'route-101',
      latitude: 40.7128,
      longitude: -74.0060,
      timestamp: new Date(),
    };

    it('should display GPS unavailable message', () => {
      busTracker.displayBuses([sampleBus]);
      busTracker.showGPSUnavailable('bus-001');

      const unavailableMsg = container.querySelector('.gps-unavailable');
      expect(unavailableMsg).toBeTruthy();
      expect(unavailableMsg?.textContent).toContain('Location unavailable');
    });

    it('should not display coordinates when GPS unavailable', () => {
      busTracker.displayBuses([sampleBus]);
      busTracker.showGPSUnavailable('bus-001');

      const coordinates = container.querySelector('.bus-coordinates');
      expect(coordinates).toBeFalsy();
    });

    it('should not display stop progress when GPS unavailable', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      busTracker.setStops(stops);
      busTracker.displayBuses([sampleBus]);
      busTracker.showGPSUnavailable('bus-001');

      const stopProgress = container.querySelector('.stop-progress-section');
      expect(stopProgress).toBeFalsy();
    });

    it('should restore location display when GPS becomes available', () => {
      busTracker.displayBuses([sampleBus]);
      busTracker.showGPSUnavailable('bus-001');

      // Update location - should remove unavailable state
      busTracker.updateBusLocation('bus-001', sampleBus);

      const unavailableMsg = container.querySelector('.gps-unavailable');
      expect(unavailableMsg).toBeFalsy();

      const coordinates = container.querySelector('.bus-coordinates');
      expect(coordinates).toBeTruthy();
    });
  });

  describe('Stop Progress Display', () => {
    const stops: Stop[] = [
      {
        id: 'stop-1',
        name: 'First Stop',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'stop-2',
        name: 'Second Stop',
        latitude: 40.7200,
        longitude: -74.0000,
        address: '456 Oak Ave',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'stop-3',
        name: 'Third Stop',
        latitude: 40.7300,
        longitude: -73.9900,
        address: '789 Elm St',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should display stop progress section when stops are set', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const progressSection = container.querySelector('.stop-progress-section');
      expect(progressSection).toBeTruthy();
    });

    it('should display all stops in progress list', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const stopItems = container.querySelectorAll('.stop-progress-item');
      expect(stopItems.length).toBe(3);
    });

    it('should display stop names in progress list', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const stopNames = container.querySelectorAll('.stop-progress-name');
      const names = Array.from(stopNames).map(el => el.textContent);

      expect(names).toContain('First Stop');
      expect(names).toContain('Second Stop');
      expect(names).toContain('Third Stop');
    });

    it('should mark stop as current when bus is at stop', () => {
      // Bus at first stop
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const stopItems = container.querySelectorAll('.stop-progress-item');
      const firstStop = stopItems[0] as HTMLElement;
      
      expect(firstStop.dataset.status).toBe(StopStatus.CURRENT);
      expect(firstStop.classList.contains('status-current')).toBe(true);
    });

    it('should mark stops as upcoming when bus has not reached them', () => {
      // Bus at first stop
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const stopItems = container.querySelectorAll('.stop-progress-item');
      const secondStop = stopItems[1] as HTMLElement;
      const thirdStop = stopItems[2] as HTMLElement;
      
      expect(secondStop.dataset.status).toBe(StopStatus.UPCOMING);
      expect(thirdStop.dataset.status).toBe(StopStatus.UPCOMING);
    });

    it('should mark stops as completed when bus has passed them', () => {
      // Bus at third stop
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7300,
        longitude: -73.9900,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const stopItems = container.querySelectorAll('.stop-progress-item');
      const firstStop = stopItems[0] as HTMLElement;
      const secondStop = stopItems[1] as HTMLElement;
      
      expect(firstStop.dataset.status).toBe(StopStatus.COMPLETED);
      expect(secondStop.dataset.status).toBe(StopStatus.COMPLETED);
    });

    it('should display status icons for stops', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7200,
        longitude: -74.0000,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const statusIndicators = container.querySelectorAll('.stop-status-indicator');
      expect(statusIndicators.length).toBe(3);
      
      // Check that icons are present
      statusIndicators.forEach(indicator => {
        expect(indicator.textContent).toMatch(/[✓●○]/);
      });
    });

    it('should update stop statuses when bus location changes', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      // Initially at first stop
      let stopItems = container.querySelectorAll('.stop-progress-item');
      let firstStop = stopItems[0] as HTMLElement;
      expect(firstStop.dataset.status).toBe(StopStatus.CURRENT);

      // Move to second stop
      const updatedBus: BusLocation = {
        ...bus,
        latitude: 40.7200,
        longitude: -74.0000,
      };
      busTracker.updateBusLocation('bus-001', updatedBus);

      // First stop should now be completed
      stopItems = container.querySelectorAll('.stop-progress-item');
      firstStop = stopItems[0] as HTMLElement;
      const secondStop = stopItems[1] as HTMLElement;
      
      expect(firstStop.dataset.status).toBe(StopStatus.COMPLETED);
      expect(secondStop.dataset.status).toBe(StopStatus.CURRENT);
    });
  });

  describe('Multiple Buses with Stop Progress', () => {
    const stops: Stop[] = [
      {
        id: 'stop-1',
        name: 'First Stop',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'stop-2',
        name: 'Second Stop',
        latitude: 40.7200,
        longitude: -74.0000,
        address: '456 Oak Ave',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should display stop progress for each bus independently', () => {
      const bus1: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      const bus2: BusLocation = {
        busId: 'bus-002',
        routeId: 'route-101',
        latitude: 40.7200,
        longitude: -74.0000,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus1, bus2]);

      const progressSections = container.querySelectorAll('.stop-progress-section');
      expect(progressSections.length).toBe(2);
    });

    it('should show different progress for buses at different locations', () => {
      const bus1: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      const bus2: BusLocation = {
        busId: 'bus-002',
        routeId: 'route-101',
        latitude: 40.7200,
        longitude: -74.0000,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus1, bus2]);

      const busCards = container.querySelectorAll('.bus-card');
      
      // Bus 1 at first stop
      const bus1Card = busCards[0];
      const bus1Stops = bus1Card.querySelectorAll('.stop-progress-item');
      const bus1FirstStop = bus1Stops[0] as HTMLElement;
      expect(bus1FirstStop.dataset.status).toBe(StopStatus.CURRENT);

      // Bus 2 at second stop
      const bus2Card = busCards[1];
      const bus2Stops = bus2Card.querySelectorAll('.stop-progress-item');
      const bus2FirstStop = bus2Stops[0] as HTMLElement;
      const bus2SecondStop = bus2Stops[1] as HTMLElement;
      expect(bus2FirstStop.dataset.status).toBe(StopStatus.COMPLETED);
      expect(bus2SecondStop.dataset.status).toBe(StopStatus.CURRENT);
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all bus tracking data', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.displayBuses([bus]);
      expect(container.querySelector('.bus-card')).toBeTruthy();

      busTracker.clear();
      expect(container.innerHTML).toBe('');
    });

    it('should clear stops data', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      busTracker.setStops(stops);
      busTracker.clear();

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.displayBuses([bus]);
      
      // Should not show stop progress after clear
      const progressSection = container.querySelector('.stop-progress-section');
      expect(progressSection).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle bus at exact stop coordinates', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const stopItems = container.querySelectorAll('.stop-progress-item');
      const firstStop = stopItems[0] as HTMLElement;
      expect(firstStop.dataset.status).toBe(StopStatus.CURRENT);
    });

    it('should handle stale timestamp', () => {
      const oldTimestamp = new Date();
      oldTimestamp.setMinutes(oldTimestamp.getMinutes() - 10);

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: oldTimestamp,
      };

      busTracker.displayBuses([bus]);

      const timestamp = container.querySelector('.bus-timestamp');
      expect(timestamp?.textContent).toContain('10 minutes ago');
    });

    it('should handle empty stops array', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops([]);
      busTracker.displayBuses([bus]);

      const progressSection = container.querySelector('.stop-progress-section');
      expect(progressSection).toBeFalsy();
    });

    it('should handle updating non-existent bus', () => {
      const bus: BusLocation = {
        busId: 'bus-999',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      // Should not throw error
      expect(() => {
        busTracker.updateBusLocation('bus-999', bus);
      }).not.toThrow();

      // Should add the bus
      const busCard = container.querySelector('.bus-card');
      expect(busCard).toBeTruthy();
    });
  });

  describe('Getter Methods', () => {
    it('should return all bus locations', () => {
      const bus1: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      const bus2: BusLocation = {
        busId: 'bus-002',
        routeId: 'route-101',
        latitude: 40.7200,
        longitude: -74.0000,
        timestamp: new Date(),
      };

      busTracker.displayBuses([bus1, bus2]);

      const locations = busTracker.getBusLocations();
      expect(locations.length).toBe(2);
      expect(locations.map(l => l.busId)).toContain('bus-001');
      expect(locations.map(l => l.busId)).toContain('bus-002');
    });

    it('should return stop statuses for specific bus', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Stop 1',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Stop 2',
          latitude: 40.7200,
          longitude: -74.0000,
          address: '456 Oak Ave',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const statuses = busTracker.getStopStatusesForBus('bus-001');
      expect(statuses.length).toBe(2);
      expect(statuses[0].status).toBe(StopStatus.CURRENT);
      expect(statuses[1].status).toBe(StopStatus.UPCOMING);
    });

    it('should return empty array for non-existent bus', () => {
      const statuses = busTracker.getStopStatusesForBus('non-existent');
      expect(statuses).toEqual([]);
    });
  });

  describe('Error Handling and Warnings', () => {
    const stops: Stop[] = [
      {
        id: 'stop-1',
        name: 'First Stop',
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'stop-2',
        name: 'Second Stop',
        latitude: 40.7200,
        longitude: -74.0000,
        address: '456 Oak Ave',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should display stale data warning for old GPS data', () => {
      const staleTimestamp = new Date();
      staleTimestamp.setMinutes(staleTimestamp.getMinutes() - 10); // 10 minutes ago

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: staleTimestamp,
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const staleWarning = container.querySelector('.stale-data-warning');
      expect(staleWarning).toBeTruthy();
      expect(staleWarning?.textContent).toContain('GPS data may be outdated');
    });

    it('should not display stale warning for recent GPS data', () => {
      const recentTimestamp = new Date();
      recentTimestamp.setMinutes(recentTimestamp.getMinutes() - 2); // 2 minutes ago

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: recentTimestamp,
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const staleWarning = container.querySelector('.stale-data-warning');
      expect(staleWarning).toBeFalsy();
    });

    it('should display off-route warning when bus is far from all stops', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 41.0000, // Far from any stop
        longitude: -75.0000,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const offRouteWarning = container.querySelector('.off-route-warning');
      expect(offRouteWarning).toBeTruthy();
      expect(offRouteWarning?.textContent).toContain('appears off-route');
    });

    it('should not display off-route warning when bus is near a stop', () => {
      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const offRouteWarning = container.querySelector('.off-route-warning');
      expect(offRouteWarning).toBeFalsy();
    });

    it('should display both warnings when applicable', () => {
      const staleTimestamp = new Date();
      staleTimestamp.setMinutes(staleTimestamp.getMinutes() - 10);

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 41.0000, // Far from any stop
        longitude: -75.0000,
        timestamp: staleTimestamp,
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      const staleWarning = container.querySelector('.stale-data-warning');
      const offRouteWarning = container.querySelector('.off-route-warning');
      
      expect(staleWarning).toBeTruthy();
      expect(offRouteWarning).toBeTruthy();
    });

    it('should clear warnings when bus location is updated with valid data', () => {
      const staleTimestamp = new Date();
      staleTimestamp.setMinutes(staleTimestamp.getMinutes() - 10);

      const staleBus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 41.0000,
        longitude: -75.0000,
        timestamp: staleTimestamp,
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([staleBus]);

      // Verify warnings are present
      expect(container.querySelector('.stale-data-warning')).toBeTruthy();
      expect(container.querySelector('.off-route-warning')).toBeTruthy();

      // Update with fresh, on-route data
      const freshBus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
      };

      busTracker.updateBusLocation('bus-001', freshBus);

      // Warnings should be cleared
      expect(container.querySelector('.stale-data-warning')).toBeFalsy();
      expect(container.querySelector('.off-route-warning')).toBeFalsy();
    });

    it('should handle multiple buses with different warning states', () => {
      const staleTimestamp = new Date();
      staleTimestamp.setMinutes(staleTimestamp.getMinutes() - 10);

      const bus1: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(), // Fresh data
      };

      const bus2: BusLocation = {
        busId: 'bus-002',
        routeId: 'route-101',
        latitude: 41.0000,
        longitude: -75.0000,
        timestamp: staleTimestamp, // Stale and off-route
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus1, bus2]);

      const busCards = container.querySelectorAll('.bus-card');
      
      // Bus 1 should have no warnings
      const bus1Card = busCards[0];
      expect(bus1Card.querySelector('.stale-data-warning')).toBeFalsy();
      expect(bus1Card.querySelector('.off-route-warning')).toBeFalsy();

      // Bus 2 should have both warnings
      const bus2Card = busCards[1];
      expect(bus2Card.querySelector('.stale-data-warning')).toBeTruthy();
      expect(bus2Card.querySelector('.off-route-warning')).toBeTruthy();
    });

    it('should clear all warning states when clear() is called', () => {
      const staleTimestamp = new Date();
      staleTimestamp.setMinutes(staleTimestamp.getMinutes() - 10);

      const bus: BusLocation = {
        busId: 'bus-001',
        routeId: 'route-101',
        latitude: 41.0000,
        longitude: -75.0000,
        timestamp: staleTimestamp,
      };

      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      // Verify warnings are present
      expect(container.querySelector('.stale-data-warning')).toBeTruthy();

      busTracker.clear();

      // Display same bus again - should recalculate warnings
      busTracker.setStops(stops);
      busTracker.displayBuses([bus]);

      // Warnings should still be present (recalculated)
      expect(container.querySelector('.stale-data-warning')).toBeTruthy();
    });
  });
});

// Feature: bus-tracking-system, Property 6: GPS Retrieval for Active Buses
import fc from 'fast-check';

describe('Property 6: GPS Retrieval for Active Buses', () => {
  let container: HTMLElement;
  let busTracker: BusTrackerDisplay;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-bus-tracker-pbt';
    document.body.appendChild(container);
    busTracker = new BusTrackerDisplay('test-bus-tracker-pbt');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  /**
   * Validates: Requirements 3.1
   *
   * For any route with active buses, when a passenger views that route,
   * the system must retrieve current GPS coordinates for each bus on that route.
   *
   * We verify this by generating N random BusLocation objects, calling displayBuses,
   * and asserting that every busId appears in the rendered DOM.
   */
  it('renders GPS location info for every active bus on the route', () => {
    const busLocationArb = fc.record({
      busId: fc.uuid(),
      routeId: fc.constant('route-101'),
      latitude: fc.float({ min: -90, max: 90, noNaN: true }),
      longitude: fc.float({ min: -180, max: 180, noNaN: true }),
      timestamp: fc.date({ min: new Date(Date.now() - 60_000), max: new Date() }),
    });

    fc.assert(
      fc.property(
        fc.array(busLocationArb, { minLength: 1, maxLength: 10 }),
        (buses) => {
          // Deduplicate by busId so the DOM has one card per unique bus
          const uniqueBuses = Array.from(
            new Map(buses.map(b => [b.busId, b])).values()
          );

          busTracker.displayBuses(uniqueBuses);

          const busCards = container.querySelectorAll('.bus-card');
          // Every unique bus must have a card rendered
          if (busCards.length !== uniqueBuses.length) return false;

          // Every busId must appear in the DOM
          return uniqueBuses.every(bus => {
            const card = container.querySelector(`[data-bus-id="${bus.busId}"]`);
            if (!card) return false;
            // GPS coordinates must be visible in the card
            const coords = card.querySelector('.bus-coordinates');
            return coords !== null;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: bus-tracking-system, Property 7: Multiple Bus Display
describe('Property 7: Multiple Bus Display', () => {
  let container: HTMLElement;
  let busTracker: BusTrackerDisplay;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-bus-tracker-pbt7';
    document.body.appendChild(container);
    busTracker = new BusTrackerDisplay('test-bus-tracker-pbt7');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  /**
   * Validates: Requirements 3.5
   *
   * For any route with N active buses, the system must display location
   * information for all N buses.
   *
   * We generate N BusLocation objects with unique busIds, call displayBuses,
   * and verify exactly N .bus-card elements are rendered.
   */
  it('displays exactly N bus cards for N active buses on a route', () => {
    const busLocationArb = fc.record({
      busId: fc.uuid(),
      routeId: fc.constant('route-101'),
      latitude: fc.float({ min: -90, max: 90, noNaN: true }),
      longitude: fc.float({ min: -180, max: 180, noNaN: true }),
      timestamp: fc.date({ min: new Date(Date.now() - 60_000), max: new Date() }),
    });

    fc.assert(
      fc.property(
        fc.array(busLocationArb, { minLength: 1, maxLength: 10 }),
        (buses) => {
          // Ensure unique busIds so N is well-defined
          const uniqueBuses = Array.from(
            new Map(buses.map(b => [b.busId, b])).values()
          );
          const N = uniqueBuses.length;

          busTracker.displayBuses(uniqueBuses);

          const busCards = container.querySelectorAll('.bus-card');
          // Exactly N cards must be rendered
          return busCards.length === N;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: bus-tracking-system, Property 10: Status Update on Location Change
describe('Property 10: Status Update on Location Change', () => {
  let container: HTMLElement;
  let busTracker: BusTrackerDisplay;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-bus-tracker-pbt10';
    document.body.appendChild(container);
    busTracker = new BusTrackerDisplay('test-bus-tracker-pbt10');
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  /**
   * Validates: Requirements 4.5
   *
   * For any bus location update, the system must recalculate and update the
   * completion status for all stops on that bus's route.
   *
   * Strategy:
   * - Generate N stops laid out at increasing latitudes (0.01° apart ≈ 1.1 km,
   *   well beyond the 100 m proximity threshold so stops are unambiguous).
   * - Pick a random index k (0 ≤ k < N-1) as the initial stop.
   * - Call displayBuses with the bus placed exactly at stop k.
   * - Call updateBusLocation to move the bus to stop k+1.
   * - Assert that stop k is now COMPLETED and stop k+1 is CURRENT.
   */
  it('recalculates stop statuses for all stops after a bus location update', () => {
    // Arbitrary for number of stops (at least 2 so there is always a k and k+1)
    const numStopsArb = fc.integer({ min: 2, max: 8 });

    fc.assert(
      fc.property(
        numStopsArb,
        fc.float({ min: 10, max: 50, noNaN: true }),   // base latitude
        fc.float({ min: -170, max: 170, noNaN: true }), // base longitude
        (numStops, baseLat, baseLon) => {
          // Build N stops spaced 0.01° apart in latitude (~1.1 km each)
          const SPACING = 0.01; // degrees
          const stops: Stop[] = Array.from({ length: numStops }, (_, i) => ({
            id: `stop-${i}`,
            name: `Stop ${i}`,
            latitude: baseLat + i * SPACING,
            longitude: baseLon,
            address: `Address ${i}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          // Pick initial stop index k (must have a k+1)
          const k = Math.floor(Math.random() * (numStops - 1));

          const busId = 'bus-prop10';
          const routeId = 'route-prop10';
          const now = new Date();

          // Place bus at stop k
          const initialBus: BusLocation = {
            busId,
            routeId,
            latitude: stops[k].latitude,
            longitude: stops[k].longitude,
            timestamp: now,
          };

          busTracker.setStops(stops);
          busTracker.displayBuses([initialBus]);

          // Move bus to stop k+1
          const updatedBus: BusLocation = {
            busId,
            routeId,
            latitude: stops[k + 1].latitude,
            longitude: stops[k + 1].longitude,
            timestamp: now,
          };

          busTracker.updateBusLocation(busId, updatedBus);

          // Inspect the DOM stop-progress-items
          const stopItems = container.querySelectorAll('.stop-progress-item');

          // There must be exactly numStops items rendered
          if (stopItems.length !== numStops) return false;

          const kItem = stopItems[k] as HTMLElement;
          const kPlusOneItem = stopItems[k + 1] as HTMLElement;

          // Stop k must now be COMPLETED
          if (kItem.dataset.status !== StopStatus.COMPLETED) return false;

          // Stop k+1 must now be CURRENT
          if (kPlusOneItem.dataset.status !== StopStatus.CURRENT) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
