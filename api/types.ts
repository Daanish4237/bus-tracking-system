/** Shared types for the API layer */

export interface Route {
  id: string; name: string; stopIds: string[];
  isActive: boolean; createdAt: Date; updatedAt: Date;
}

export interface Stop {
  id: string; name: string; latitude: number; longitude: number;
  address: string; createdAt: Date; updatedAt: Date;
}

export interface BusLocation {
  busId: string; routeId: string; latitude: number; longitude: number;
  timestamp: Date; speed?: number; heading?: number;
}

export interface StopRequest {
  stopId: string; timestamp: Date; count: number;
}

export function isValidGPS(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
