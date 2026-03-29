/**
 * In-memory data store for routes and stops
 * Provides storage and retrieval functions with sample data
 */

import { Route, Stop, BusLocation } from '../../shared/types';

/**
 * In-memory storage for routes
 */
const routes: Map<string, Route> = new Map();

/**
 * In-memory storage for stops
 */
const stops: Map<string, Stop> = new Map();

/**
 * In-memory cache for bus locations
 * Key: busId, Value: BusLocation
 */
const busLocations: Map<string, BusLocation> = new Map();

/**
 * Stale data threshold in milliseconds (5 minutes)
 */
const STALE_DATA_THRESHOLD = 5 * 60 * 1000;

/**
 * Initialize the data store with sample data
 */
export function initializeDataStore(): void {
  // Sample stops for Route 101 - Downtown Express
  const stop101_1: Stop = {
    id: 'stop-101-1',
    name: 'Central Station',
    latitude: 40.7589,
    longitude: -73.9851,
    address: '123 Main St',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop101_2: Stop = {
    id: 'stop-101-2',
    name: 'City Hall',
    latitude: 40.7614,
    longitude: -73.9776,
    address: '456 Broadway',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop101_3: Stop = {
    id: 'stop-101-3',
    name: 'Union Square',
    latitude: 40.7359,
    longitude: -73.9911,
    address: '789 Park Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop101_4: Stop = {
    id: 'stop-101-4',
    name: 'Financial District',
    latitude: 40.7074,
    longitude: -74.0113,
    address: '321 Wall St',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop101_5: Stop = {
    id: 'stop-101-5',
    name: 'Battery Park',
    latitude: 40.7033,
    longitude: -74.0170,
    address: '555 Battery Pl',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  // Sample stops for Route 202 - Uptown Local
  const stop202_1: Stop = {
    id: 'stop-202-1',
    name: 'Grand Central',
    latitude: 40.7527,
    longitude: -73.9772,
    address: '100 E 42nd St',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop202_2: Stop = {
    id: 'stop-202-2',
    name: 'Museum Mile',
    latitude: 40.7794,
    longitude: -73.9632,
    address: '200 5th Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop202_3: Stop = {
    id: 'stop-202-3',
    name: 'Central Park North',
    latitude: 40.7979,
    longitude: -73.9520,
    address: '300 Central Park N',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop202_4: Stop = {
    id: 'stop-202-4',
    name: 'Columbia University',
    latitude: 40.8075,
    longitude: -73.9626,
    address: '400 W 116th St',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop202_5: Stop = {
    id: 'stop-202-5',
    name: 'Washington Heights',
    latitude: 40.8448,
    longitude: -73.9388,
    address: '500 W 181st St',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop202_6: Stop = {
    id: 'stop-202-6',
    name: 'Fort Tryon Park',
    latitude: 40.8648,
    longitude: -73.9318,
    address: '600 Margaret Corbin Dr',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  // Sample stops for Route 303 - Crosstown Shuttle
  const stop303_1: Stop = {
    id: 'stop-303-1',
    name: 'West Side Terminal',
    latitude: 40.7589,
    longitude: -74.0014,
    address: '700 West End Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop303_2: Stop = {
    id: 'stop-303-2',
    name: 'Lincoln Center',
    latitude: 40.7722,
    longitude: -73.9843,
    address: '800 Columbus Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop303_3: Stop = {
    id: 'stop-303-3',
    name: 'Times Square',
    latitude: 40.7580,
    longitude: -73.9855,
    address: '900 7th Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop303_4: Stop = {
    id: 'stop-303-4',
    name: 'Bryant Park',
    latitude: 40.7536,
    longitude: -73.9832,
    address: '1000 6th Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const stop303_5: Stop = {
    id: 'stop-303-5',
    name: 'East Side Plaza',
    latitude: 40.7489,
    longitude: -73.9680,
    address: '1100 Lexington Ave',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  // Add all stops to the store
  [
    stop101_1, stop101_2, stop101_3, stop101_4, stop101_5,
    stop202_1, stop202_2, stop202_3, stop202_4, stop202_5, stop202_6,
    stop303_1, stop303_2, stop303_3, stop303_4, stop303_5
  ].forEach(stop => stops.set(stop.id, stop));

  // Sample routes
  const route101: Route = {
    id: 'route-101',
    name: 'Downtown Express',
    stopIds: ['stop-101-1', 'stop-101-2', 'stop-101-3', 'stop-101-4', 'stop-101-5'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const route202: Route = {
    id: 'route-202',
    name: 'Uptown Local',
    stopIds: ['stop-202-1', 'stop-202-2', 'stop-202-3', 'stop-202-4', 'stop-202-5', 'stop-202-6'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const route303: Route = {
    id: 'route-303',
    name: 'Crosstown Shuttle',
    stopIds: ['stop-303-1', 'stop-303-2', 'stop-303-3', 'stop-303-4', 'stop-303-5'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  // Add routes to the store
  routes.set(route101.id, route101);
  routes.set(route202.id, route202);
  routes.set(route303.id, route303);
}

/**
 * Store or update a route
 */
export function setRoute(route: Route): void {
  routes.set(route.id, route);
}

/**
 * Get all routes
 */
export function getAllRoutes(): Route[] {
  return Array.from(routes.values());
}

/**
 * Get a route by ID
 */
export function getRouteById(routeId: string): Route | undefined {
  return routes.get(routeId);
}

/**
 * Store or update a stop
 */
export function setStop(stop: Stop): void {
  stops.set(stop.id, stop);
}

/**
 * Get a stop by ID
 */
export function getStopById(stopId: string): Stop | undefined {
  return stops.get(stopId);
}

/**
 * Get multiple stops by IDs, maintaining order
 */
export function getStopsByIds(stopIds: string[]): Stop[] {
  return stopIds
    .map(id => stops.get(id))
    .filter((stop): stop is Stop => stop !== undefined);
}

/**
 * Get all stops for a route in sequential order
 */
export function getStopsForRoute(routeId: string): Stop[] {
  const route = routes.get(routeId);
  if (!route) {
    return [];
  }
  return getStopsByIds(route.stopIds);
}

// Initialize the data store on module load
initializeDataStore();
initializeSampleBusLocations();

/**
 * Store or update a bus location
 */
export function setBusLocation(location: BusLocation): void {
  busLocations.set(location.busId, location);
}

/**
 * Get a bus location by bus ID
 */
export function getBusLocation(busId: string): BusLocation | undefined {
  return busLocations.get(busId);
}

/**
 * Get all bus locations for a specific route
 * Optionally filter out stale data (older than 5 minutes)
 */
export function getBusLocationsByRoute(routeId: string, includeStale: boolean = false): BusLocation[] {
  const now = new Date().getTime();
  const locations: BusLocation[] = [];

  for (const location of busLocations.values()) {
    if (location.routeId === routeId) {
      // Check if data is stale
      const age = now - location.timestamp.getTime();
      if (includeStale || age <= STALE_DATA_THRESHOLD) {
        locations.push(location);
      }
    }
  }

  return locations;
}

/**
 * Get all bus locations
 */
export function getAllBusLocations(): BusLocation[] {
  return Array.from(busLocations.values());
}

/**
 * Remove stale bus locations (older than 5 minutes)
 */
export function cleanupStaleBusLocations(): number {
  const now = new Date().getTime();
  let removedCount = 0;

  for (const [busId, location] of busLocations.entries()) {
    const age = now - location.timestamp.getTime();
    if (age > STALE_DATA_THRESHOLD) {
      busLocations.delete(busId);
      removedCount++;
    }
  }

  return removedCount;
}

/**
 * Initialize sample bus location data
 */
export function initializeSampleBusLocations(): void {
  // Bus on Route 101 - Downtown Express (at stop 2)
  const bus1: BusLocation = {
    busId: 'bus-001',
    routeId: 'route-101',
    latitude: 40.7614,
    longitude: -73.9776,
    timestamp: new Date(),
    speed: 25,
    heading: 180
  };

  // Bus on Route 202 - Uptown Local (between stops 3 and 4)
  const bus2: BusLocation = {
    busId: 'bus-002',
    routeId: 'route-202',
    latitude: 40.8027,
    longitude: -73.9573,
    timestamp: new Date(),
    speed: 30,
    heading: 0
  };

  // Bus on Route 303 - Crosstown Shuttle (at stop 4)
  const bus3: BusLocation = {
    busId: 'bus-003',
    routeId: 'route-303',
    latitude: 40.7536,
    longitude: -73.9832,
    timestamp: new Date(),
    speed: 15,
    heading: 90
  };

  busLocations.set(bus1.busId, bus1);
  busLocations.set(bus2.busId, bus2);
  busLocations.set(bus3.busId, bus3);
}
