/**
 * Unit tests for RouteViewer component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { RouteViewer } from './RouteViewer';
import { Route, Stop } from '../../shared/types';

describe('RouteViewer', () => {
  let routeListContainer: HTMLElement;
  let routeStopsContainer: HTMLElement;
  let routeViewer: RouteViewer;

  beforeEach(() => {
    // Set up DOM elements
    document.body.innerHTML = `
      <div id="route-list"></div>
      <div id="route-stops"></div>
    `;

    routeListContainer = document.getElementById('route-list')!;
    routeStopsContainer = document.getElementById('route-stops')!;

    routeViewer = new RouteViewer('route-list', 'route-stops');
  });

  describe('constructor', () => {
    it('should throw error if route list element not found', () => {
      expect(() => {
        new RouteViewer('non-existent', 'route-stops');
      }).toThrow('Element with id "non-existent" not found');
    });

    it('should throw error if route stops element not found', () => {
      expect(() => {
        new RouteViewer('route-list', 'non-existent');
      }).toThrow('Element with id "non-existent" not found');
    });

    it('should create instance successfully with valid element IDs', () => {
      expect(routeViewer).toBeInstanceOf(RouteViewer);
    });
  });

  describe('displayRoutes', () => {
    it('should display empty state when no routes provided', () => {
      routeViewer.displayRoutes([]);

      expect(routeListContainer.innerHTML).toContain('No routes available');
    });

    it('should display single route with ID and name', () => {
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRoutes(routes);

      expect(routeListContainer.textContent).toContain('route-1');
      expect(routeListContainer.textContent).toContain('Downtown Express');
    });

    it('should display multiple routes', () => {
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'route-2',
          name: 'Uptown Local',
          stopIds: ['stop-3', 'stop-4'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRoutes(routes);

      expect(routeListContainer.textContent).toContain('route-1');
      expect(routeListContainer.textContent).toContain('Downtown Express');
      expect(routeListContainer.textContent).toContain('route-2');
      expect(routeListContainer.textContent).toContain('Uptown Local');

      const routeItems = routeListContainer.querySelectorAll('.route-item');
      expect(routeItems.length).toBe(2);
    });

    it('should add click handlers to route items', () => {
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const callback = vi.fn();
      routeViewer = new RouteViewer('route-list', 'route-stops', {
        onRouteSelected: callback
      });

      routeViewer.displayRoutes(routes);

      const routeItem = routeListContainer.querySelector('.route-item') as HTMLElement;
      routeItem.click();

      expect(callback).toHaveBeenCalledWith('route-1');
    });

    it('should mark selected route with selected class', () => {
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'route-2',
          name: 'Uptown Local',
          stopIds: ['stop-3', 'stop-4'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRoutes(routes);
      
      // Select first route
      const firstRouteItem = routeListContainer.querySelector('[data-route-id="route-1"]') as HTMLElement;
      firstRouteItem.click();

      expect(firstRouteItem.classList.contains('selected')).toBe(true);

      // Re-display routes and verify selection is maintained
      routeViewer.displayRoutes(routes);
      const updatedFirstRoute = routeListContainer.querySelector('[data-route-id="route-1"]') as HTMLElement;
      expect(updatedFirstRoute.classList.contains('selected')).toBe(true);
    });
  });

  describe('displayRouteStops', () => {
    it('should display empty state when no stops provided', () => {
      routeViewer.displayRouteStops('route-1', []);

      expect(routeStopsContainer.innerHTML).toContain('No stops available');
    });

    it('should display route ID in header', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRouteStops('route-1', stops);

      expect(routeStopsContainer.textContent).toContain('Stops for Route route-1');
    });

    it('should display stops in sequential order', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-2',
          name: 'Main St & 2nd Ave',
          latitude: 40.7138,
          longitude: -74.0050,
          address: '456 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stop-3',
          name: 'Main St & 3rd Ave',
          latitude: 40.7148,
          longitude: -74.0040,
          address: '789 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRouteStops('route-1', stops);

      const stopItems = routeStopsContainer.querySelectorAll('.stop-item');
      expect(stopItems.length).toBe(3);

      // Verify order
      expect(stopItems[0].textContent).toContain('Main St & 1st Ave');
      expect(stopItems[1].textContent).toContain('Main St & 2nd Ave');
      expect(stopItems[2].textContent).toContain('Main St & 3rd Ave');
    });

    it('should display stop number, name, and address', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRouteStops('route-1', stops);

      const stopItem = routeStopsContainer.querySelector('.stop-item');
      expect(stopItem?.textContent).toContain('1.');
      expect(stopItem?.textContent).toContain('Main St & 1st Ave');
      expect(stopItem?.textContent).toContain('123 Main St');
    });

    it('should use ordered list for stops', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRouteStops('route-1', stops);

      const stopsList = routeStopsContainer.querySelector('ol.stops-list');
      expect(stopsList).not.toBeNull();
    });
  });

  describe('onRouteSelected', () => {
    it('should update selected route ID', () => {
      routeViewer.onRouteSelected('route-1');

      expect(routeViewer.getSelectedRouteId()).toBe('route-1');
    });

    it('should call callback when route is selected', () => {
      const callback = vi.fn();
      routeViewer = new RouteViewer('route-list', 'route-stops', {
        onRouteSelected: callback
      });

      routeViewer.onRouteSelected('route-1');

      expect(callback).toHaveBeenCalledWith('route-1');
    });

    it('should update visual selection in route list', () => {
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'route-2',
          name: 'Uptown Local',
          stopIds: ['stop-3', 'stop-4'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRoutes(routes);

      // Select first route
      routeViewer.onRouteSelected('route-1');

      const route1 = routeListContainer.querySelector('[data-route-id="route-1"]');
      const route2 = routeListContainer.querySelector('[data-route-id="route-2"]');

      expect(route1?.classList.contains('selected')).toBe(true);
      expect(route2?.classList.contains('selected')).toBe(false);

      // Select second route
      routeViewer.onRouteSelected('route-2');

      expect(route1?.classList.contains('selected')).toBe(false);
      expect(route2?.classList.contains('selected')).toBe(true);
    });
  });

  describe('clearRouteStops', () => {
    it('should clear route stops display', () => {
      const stops: Stop[] = [
        {
          id: 'stop-1',
          name: 'Main St & 1st Ave',
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRouteStops('route-1', stops);
      expect(routeStopsContainer.innerHTML).not.toBe('');

      routeViewer.clearRouteStops();
      expect(routeStopsContainer.innerHTML).toBe('');
    });
  });

  describe('clearRouteList', () => {
    it('should clear route list display', () => {
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Downtown Express',
          stopIds: ['stop-1', 'stop-2'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      routeViewer.displayRoutes(routes);
      expect(routeListContainer.innerHTML).not.toBe('');

      routeViewer.clearRouteList();
      expect(routeListContainer.innerHTML).toBe('');
    });

    it('should clear selected route ID', () => {
      routeViewer.onRouteSelected('route-1');
      expect(routeViewer.getSelectedRouteId()).toBe('route-1');

      routeViewer.clearRouteList();
      expect(routeViewer.getSelectedRouteId()).toBeNull();
    });
  });
});

// Feature: bus-tracking-system, Property 1: Route Display Completeness
describe('Property 1: Route Display Completeness', () => {
  /**
   * Validates: Requirements 1.2
   * For any route, when displayed, the rendered output must contain
   * both the route identifier and the route name.
   */
  it('rendered output contains both route id and route name for any route', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            stopIds: fc.array(fc.string(), { minLength: 2 }),
            isActive: fc.boolean(),
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          { minLength: 1 }
        ),
        (routes) => {
          document.body.innerHTML = `
            <div id="pbt-route-list"></div>
            <div id="pbt-route-stops"></div>
          `;
          const viewer = new RouteViewer('pbt-route-list', 'pbt-route-stops');
          viewer.displayRoutes(routes);

          const container = document.getElementById('pbt-route-list')!;
          for (const route of routes) {
            expect(container.textContent).toContain(route.id);
            expect(container.textContent).toContain(route.name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
