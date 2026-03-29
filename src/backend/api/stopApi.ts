/**
 * Stop API endpoints
 * Implements GET /api/stops/:stopId and GET /api/stops
 */

import { Request, Response } from 'express';
import { getStopById, getStopsByIds } from '../data/dataStore';
import { isValidStop } from '../../shared/types';

/**
 * GET /api/stops/:stopId
 * Retrieve details for a specific stop
 */
export function getStop(req: Request, res: Response): void {
  try {
    const { stopId } = req.params;

    // Validate stopId parameter
    if (!stopId || typeof stopId !== 'string' || stopId.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Stop ID is required and must be a non-empty string'
      });
      return;
    }

    // Retrieve the stop
    const stop = getStopById(stopId);

    // Handle stop not found
    if (!stop) {
      res.status(404).json({
        error: 'Not found',
        message: `Stop with ID '${stopId}' not found`
      });
      return;
    }

    // Validate stop data
    if (!isValidStop(stop)) {
      console.error('Invalid stop data in store:', stop);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Stop data is invalid'
      });
      return;
    }

    res.status(200).json(stop);
  } catch (error) {
    console.error('Error retrieving stop:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve stop'
    });
  }
}

/**
 * GET /api/stops
 * Retrieve multiple stops by IDs
 * Query params: ?ids=stop1,stop2,stop3
 */
export function getStops(req: Request, res: Response): void {
  try {
    const { ids } = req.query;

    // Validate ids parameter
    if (!ids || typeof ids !== 'string' || ids.trim().length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Query parameter "ids" is required and must be a comma-separated list of stop IDs'
      });
      return;
    }

    // Parse comma-separated IDs
    const stopIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);

    // Validate that we have at least one ID
    if (stopIds.length === 0) {
      res.status(400).json({
        error: 'Bad request',
        message: 'At least one stop ID must be provided'
      });
      return;
    }

    // Retrieve stops by IDs (maintains order)
    const stops = getStopsByIds(stopIds);

    // Validate all retrieved stops
    const invalidStops = stops.filter(stop => !isValidStop(stop));
    if (invalidStops.length > 0) {
      console.error('Invalid stop data in store:', invalidStops);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Some stop data is invalid'
      });
      return;
    }

    // Check if some stops were not found
    if (stops.length < stopIds.length) {
      const foundIds = stops.map(stop => stop.id);
      const missingIds = stopIds.filter(id => !foundIds.includes(id));
      console.warn(`Some stops not found: ${missingIds.join(', ')}`);
    }

    res.status(200).json(stops);
  } catch (error) {
    console.error('Error retrieving stops:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve stops'
    });
  }
}
