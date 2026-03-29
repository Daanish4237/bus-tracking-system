/**
 * Geographic utility functions for distance calculations and proximity detection
 */

import { GPSCoordinate, Stop } from './types';

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * 
 * @param lat1 - Latitude of first point in degrees
 * @param lon1 - Longitude of first point in degrees
 * @param lat2 - Latitude of second point in degrees
 * @param lon2 - Longitude of second point in degrees
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Proximity threshold for determining if a bus is at a stop (in meters)
 */
export const STOP_PROXIMITY_THRESHOLD = 100; // meters

/**
 * Determine if a bus is at a stop based on proximity threshold
 * 
 * @param busLocation - Current GPS coordinates of the bus
 * @param stop - Stop with GPS coordinates
 * @returns true if the bus is within the proximity threshold of the stop
 */
export function isAtStop(busLocation: GPSCoordinate, stop: Stop): boolean {
  const distance = calculateDistance(
    busLocation.latitude,
    busLocation.longitude,
    stop.latitude,
    stop.longitude
  );
  return distance <= STOP_PROXIMITY_THRESHOLD;
}
