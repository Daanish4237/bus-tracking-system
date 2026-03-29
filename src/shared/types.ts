/**
 * Shared type definitions for the Bus Tracking System
 */

export interface Route {
  id: string;
  name: string;
  stopIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
}

export interface BusLocation {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export enum StopStatus {
  COMPLETED = "completed",
  CURRENT = "current",
  UPCOMING = "upcoming"
}

export interface StopProgress {
  busId: string;
  routeId: string;
  stopId: string;
  status: StopStatus;
  arrivalTime: Date | null;
  departureTime: Date | null;
}

/**
 * Validation type guards for runtime checking
 */

/**
 * Validates GPS coordinates are within valid ranges
 * Latitude: -90 to 90, Longitude: -180 to 180
 */
export function isValidGPSCoordinate(coord: any): coord is GPSCoordinate {
  return (
    coord !== null &&
    typeof coord === 'object' &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
}

/**
 * Validates a Route object has all required fields and valid data
 */
export function isValidRoute(route: any): route is Route {
  return (
    route !== null &&
    typeof route === 'object' &&
    typeof route.id === 'string' &&
    route.id.length > 0 &&
    typeof route.name === 'string' &&
    route.name.length > 0 &&
    Array.isArray(route.stopIds) &&
    route.stopIds.length >= 2 &&
    route.stopIds.every((id: any) => typeof id === 'string' && id.length > 0) &&
    typeof route.isActive === 'boolean' &&
    route.createdAt instanceof Date &&
    route.updatedAt instanceof Date
  );
}

/**
 * Validates a Stop object has all required fields and valid GPS coordinates
 */
export function isValidStop(stop: any): stop is Stop {
  return (
    stop !== null &&
    typeof stop === 'object' &&
    typeof stop.id === 'string' &&
    stop.id.length > 0 &&
    typeof stop.name === 'string' &&
    stop.name.length > 0 &&
    typeof stop.latitude === 'number' &&
    typeof stop.longitude === 'number' &&
    stop.latitude >= -90 &&
    stop.latitude <= 90 &&
    stop.longitude >= -180 &&
    stop.longitude <= 180 &&
    typeof stop.address === 'string' &&
    stop.createdAt instanceof Date &&
    stop.updatedAt instanceof Date
  );
}

/**
 * Validates a BusLocation object has all required fields and valid GPS coordinates
 */
export function isValidBusLocation(location: any): location is BusLocation {
  return (
    location !== null &&
    typeof location === 'object' &&
    typeof location.busId === 'string' &&
    location.busId.length > 0 &&
    typeof location.routeId === 'string' &&
    location.routeId.length > 0 &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180 &&
    location.timestamp instanceof Date &&
    location.timestamp <= new Date() &&
    (location.speed === undefined || typeof location.speed === 'number') &&
    (location.heading === undefined || typeof location.heading === 'number')
  );
}

/**
 * Validates a StopStatus value is one of the valid enum values
 */
export function isValidStopStatus(status: any): status is StopStatus {
  return (
    status === StopStatus.COMPLETED ||
    status === StopStatus.CURRENT ||
    status === StopStatus.UPCOMING
  );
}

/**
 * Validates a StopProgress object has all required fields
 */
export function isValidStopProgress(progress: any): progress is StopProgress {
  return (
    progress !== null &&
    typeof progress === 'object' &&
    typeof progress.busId === 'string' &&
    progress.busId.length > 0 &&
    typeof progress.routeId === 'string' &&
    progress.routeId.length > 0 &&
    typeof progress.stopId === 'string' &&
    progress.stopId.length > 0 &&
    isValidStopStatus(progress.status) &&
    (progress.arrivalTime === null || progress.arrivalTime instanceof Date) &&
    (progress.departureTime === null || progress.departureTime instanceof Date)
  );
}
