/**
 * GPS Tracking API endpoints
 * Implements GET /api/buses/locations and POST /api/buses/:busId/location
 */

import { Request, Response } from 'express';
import {
  getBusLocation,
  getBusLocationsByRoute,
  setBusLocation,
  getRouteById
} from '../data/dataStore';
import { isValidGPSCoordinate, BusLocation } from '../../shared/types';

/**
 * GET /api/buses/locations
 * Retrieve current GPS locations for all buses on a route
 * Query params: ?routeId=route1
 */
export function getBusLocations(req: Request, res: Response): void {
  try {
    const { routeId } = req.query;

    // Validate routeId parameter
    if (!routeId || typeof routeId !== 'string' || routeId.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'routeId query parameter is required and must be a non-empty string'
      });
      return;
    }

    // Verify route exists
    const route = getRouteById(routeId);
    if (!route) {
      res.status(404).json({
        error: 'Not found',
        message: `Route with ID '${routeId}' not found`
      });
      return;
    }

    // Retrieve bus locations for the route (exclude stale data by default)
    const locations = getBusLocationsByRoute(routeId, false);

    // Return locations as JSON
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error retrieving bus locations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve bus locations'
    });
  }
}

/**
 * GET /api/buses/:busId/location
 * Retrieve current GPS location for a specific bus
 */
export function getBusLocationById(req: Request, res: Response): void {
  try {
    const { busId } = req.params;

    // Validate busId parameter
    if (!busId || typeof busId !== 'string' || busId.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Bus ID is required and must be a non-empty string'
      });
      return;
    }

    // Retrieve the bus location
    const location = getBusLocation(busId);

    // Handle bus location not found
    if (!location) {
      res.status(404).json({
        error: 'Not found',
        message: `Location for bus with ID '${busId}' not found`
      });
      return;
    }

    res.status(200).json(location);
  } catch (error) {
    console.error('Error retrieving bus location:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve bus location'
    });
  }
}

/**
 * POST /api/buses/:busId/location
 * Update GPS location for a bus (called by GPS devices)
 * Body: { latitude: number, longitude: number, timestamp: string, routeId: string, speed?: number, heading?: number }
 */
export function updateBusLocation(req: Request, res: Response): void {
  try {
    const { busId } = req.params;
    const { latitude, longitude, timestamp, routeId, speed, heading } = req.body;

    // Validate busId parameter
    if (!busId || typeof busId !== 'string' || busId.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Bus ID is required and must be a non-empty string'
      });
      return;
    }

    // Validate required fields
    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({
        error: 'Bad request',
        message: 'latitude and longitude are required fields'
      });
      return;
    }

    if (!routeId || typeof routeId !== 'string' || routeId.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'routeId is required and must be a non-empty string'
      });
      return;
    }

    // Validate GPS coordinates
    if (!isValidGPSCoordinate({ latitude, longitude })) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Invalid GPS coordinates. Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
      return;
    }

    // Verify route exists
    const route = getRouteById(routeId);
    if (!route) {
      res.status(404).json({
        error: 'Not found',
        message: `Route with ID '${routeId}' not found`
      });
      return;
    }

    // Parse and validate timestamp
    let parsedTimestamp: Date;
    if (timestamp) {
      parsedTimestamp = new Date(timestamp);
      if (isNaN(parsedTimestamp.getTime())) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Invalid timestamp format'
        });
        return;
      }
      // Check if timestamp is in the future
      if (parsedTimestamp > new Date()) {
        res.status(400).json({
          error: 'Bad request',
          message: 'Timestamp cannot be in the future'
        });
        return;
      }
    } else {
      // Use current time if timestamp not provided
      parsedTimestamp = new Date();
    }

    // Validate optional fields
    if (speed !== undefined && (typeof speed !== 'number' || speed < 0)) {
      res.status(400).json({
        error: 'Bad request',
        message: 'speed must be a non-negative number'
      });
      return;
    }

    if (heading !== undefined && (typeof heading !== 'number' || heading < 0 || heading >= 360)) {
      res.status(400).json({
        error: 'Bad request',
        message: 'heading must be a number between 0 and 359'
      });
      return;
    }

    // Create bus location object
    const busLocation: BusLocation = {
      busId,
      routeId,
      latitude,
      longitude,
      timestamp: parsedTimestamp,
      speed,
      heading
    };

    // Store the location
    setBusLocation(busLocation);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Bus location updated successfully',
      location: busLocation
    });
  } catch (error) {
    console.error('Error updating bus location:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update bus location'
    });
  }
}
