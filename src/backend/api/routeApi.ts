/**
 * Route API endpoints
 * Implements GET /api/routes and GET /api/routes/:routeId
 */

import { Request, Response } from 'express';
import { getAllRoutes, getRouteById, getStopsForRoute } from '../data/dataStore';
import { isValidRoute } from '../../shared/types';

/**
 * Response type for route with embedded stops
 */
export interface RouteWithStops {
  id: string;
  name: string;
  stopIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stops: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    sequenceNumber: number;
  }>;
}

/**
 * GET /api/routes
 * Retrieve all available routes
 */
export function getRoutes(req: Request, res: Response): void {
  try {
    const routes = getAllRoutes();
    
    // Return routes as JSON
    res.status(200).json(routes);
  } catch (error) {
    console.error('Error retrieving routes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve routes'
    });
  }
}

/**
 * GET /api/routes/:routeId
 * Retrieve a specific route with all stops in sequence
 */
export function getRouteWithStops(req: Request, res: Response): void {
  try {
    const { routeId } = req.params;

    // Validate routeId parameter
    if (!routeId || typeof routeId !== 'string' || routeId.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Route ID is required and must be a non-empty string'
      });
      return;
    }

    // Retrieve the route
    const route = getRouteById(routeId);

    // Handle route not found
    if (!route) {
      res.status(404).json({
        error: 'Not found',
        message: `Route with ID '${routeId}' not found`
      });
      return;
    }

    // Validate route data
    if (!isValidRoute(route)) {
      console.error('Invalid route data in store:', route);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Route data is invalid'
      });
      return;
    }

    // Retrieve all stops for the route in sequential order
    const stops = getStopsForRoute(routeId);

    // Check if all stops were found
    if (stops.length !== route.stopIds.length) {
      console.warn(
        `Route ${routeId} has ${route.stopIds.length} stop IDs but only ${stops.length} stops were found`
      );
    }

    // Build response with embedded stops including sequence numbers
    const routeWithStops: RouteWithStops = {
      ...route,
      stops: stops.map((stop, index) => ({
        id: stop.id,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        address: stop.address,
        sequenceNumber: index + 1
      }))
    };

    res.status(200).json(routeWithStops);
  } catch (error) {
    console.error('Error retrieving route:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve route'
    });
  }
}
