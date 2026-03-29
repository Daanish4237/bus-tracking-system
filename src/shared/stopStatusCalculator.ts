/**
 * Stop status calculation logic for determining bus progress along a route
 * 
 * This module provides functions to calculate the status of stops (completed, current, upcoming)
 * based on a bus's current location and the route's stop sequence.
 * 
 * Requirements: 4.1, 4.2, 4.5
 */

import { BusLocation, Stop, StopStatus, StopProgress } from './types';
import { isAtStop } from './geoUtils';

/**
 * Calculate the status for all stops on a route based on the bus's current location
 * 
 * Logic:
 * - Stops are marked as COMPLETED if the bus has passed them (based on sequence and proximity)
 * - A stop is marked as CURRENT if the bus is within proximity threshold
 * - Stops are marked as UPCOMING if the bus hasn't reached them yet
 * 
 * Edge cases:
 * - If bus is at the first stop, all other stops are UPCOMING
 * - If bus is at the last stop, all previous stops are COMPLETED
 * - If bus is between stops, the closest passed stop is the last COMPLETED
 * 
 * @param busLocation - Current GPS location of the bus
 * @param stops - Array of stops in sequential order for the route
 * @returns Array of StopProgress objects with calculated status for each stop
 */
export function calculateStopStatuses(
  busLocation: BusLocation,
  stops: Stop[]
): StopProgress[] {
  if (stops.length === 0) {
    return [];
  }

  // Find if the bus is currently at any stop
  let currentStopIndex = -1;
  for (let i = 0; i < stops.length; i++) {
    if (isAtStop(busLocation, stops[i])) {
      currentStopIndex = i;
      break;
    }
  }

  // If bus is at a stop, mark that as current and determine completed/upcoming
  if (currentStopIndex !== -1) {
    return stops.map((stop, index) => ({
      busId: busLocation.busId,
      routeId: busLocation.routeId,
      stopId: stop.id,
      status: index < currentStopIndex 
        ? StopStatus.COMPLETED 
        : index === currentStopIndex 
          ? StopStatus.CURRENT 
          : StopStatus.UPCOMING,
      arrivalTime: null,
      departureTime: null
    }));
  }

  // Bus is not at any stop - need to determine which stops have been passed
  // Find the closest stop to determine position along route
  const closestStopIndex = findClosestStop(busLocation, stops);
  
  // Determine if bus is approaching or has passed the closest stop
  const distanceToClosest = calculateDistanceToStop(busLocation, stops[closestStopIndex]);
  const APPROACH_THRESHOLD = 200; // meters
  
  // If approaching the closest stop (within threshold), previous stops are completed
  if (distanceToClosest <= APPROACH_THRESHOLD && closestStopIndex > 0) {
    return stops.map((stop, index) => ({
      busId: busLocation.busId,
      routeId: busLocation.routeId,
      stopId: stop.id,
      status: index < closestStopIndex 
        ? StopStatus.COMPLETED 
        : StopStatus.UPCOMING,
      arrivalTime: null,
      departureTime: null
    }));
  }
  
  // If far from all stops, use closest stop as reference
  // If closest is first stop and we're far, all are upcoming
  if (closestStopIndex === 0 && distanceToClosest > APPROACH_THRESHOLD) {
    return stops.map((stop) => ({
      busId: busLocation.busId,
      routeId: busLocation.routeId,
      stopId: stop.id,
      status: StopStatus.UPCOMING,
      arrivalTime: null,
      departureTime: null
    }));
  }
  
  // If closest is last stop and we're far, all are completed
  if (closestStopIndex === stops.length - 1 && distanceToClosest > APPROACH_THRESHOLD) {
    return stops.map((stop) => ({
      busId: busLocation.busId,
      routeId: busLocation.routeId,
      stopId: stop.id,
      status: StopStatus.COMPLETED,
      arrivalTime: null,
      departureTime: null
    }));
  }
  
  // Default: mark stops up to and including closest as completed
  return stops.map((stop, index) => ({
    busId: busLocation.busId,
    routeId: busLocation.routeId,
    stopId: stop.id,
    status: index <= closestStopIndex 
      ? StopStatus.COMPLETED 
      : StopStatus.UPCOMING,
    arrivalTime: null,
    departureTime: null
  }));
}

/**
 * Find the index of the closest stop to the bus location
 * 
 * @param busLocation - Current GPS location of the bus
 * @param stops - Array of stops in sequential order
 * @returns Index of the closest stop
 */
function findClosestStop(busLocation: BusLocation, stops: Stop[]): number {
  if (stops.length === 0) {
    return -1;
  }

  let closestIndex = 0;
  let minDistance = calculateDistanceToStop(busLocation, stops[0]);
  
  for (let i = 1; i < stops.length; i++) {
    const distance = calculateDistanceToStop(busLocation, stops[i]);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Calculate distance from bus location to a stop
 * 
 * @param busLocation - Current GPS location of the bus
 * @param stop - The stop to calculate distance to
 * @returns Distance in meters
 */
function calculateDistanceToStop(busLocation: BusLocation, stop: Stop): number {
  const lat1 = busLocation.latitude;
  const lon1 = busLocation.longitude;
  const lat2 = stop.latitude;
  const lon2 = stop.longitude;
  
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate the status for a single stop based on bus location
 * 
 * This is a convenience function for calculating the status of one specific stop.
 * 
 * @param busLocation - Current GPS location of the bus
 * @param stop - The stop to calculate status for
 * @param allStops - All stops on the route in sequential order
 * @returns StopProgress object with calculated status
 */
export function calculateStopStatus(
  busLocation: BusLocation,
  stop: Stop,
  allStops: Stop[]
): StopProgress {
  const allStatuses = calculateStopStatuses(busLocation, allStops);
  const stopStatus = allStatuses.find(s => s.stopId === stop.id);
  
  if (!stopStatus) {
    // Stop not found in route - default to upcoming
    return {
      busId: busLocation.busId,
      routeId: busLocation.routeId,
      stopId: stop.id,
      status: StopStatus.UPCOMING,
      arrivalTime: null,
      departureTime: null
    };
  }
  
  return stopStatus;
}
