/**
 * Unit tests for Route API endpoints
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { getRoutes, getRouteWithStops } from './routeApi';
import * as dataStore from '../data/dataStore';

// Mock response object
function createMockResponse(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('Route API', () => {
  describe('GET /api/routes', () => {
    test('should return all routes with 200 status', () => {
      const req = {} as Request;
      const res = createMockResponse();

      getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const routes = (res.json as any).mock.calls[0][0];
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBeGreaterThan(0);
      
      // Verify route structure
      routes.forEach((route: any) => {
        expect(route).toHaveProperty('id');
        expect(route).toHaveProperty('name');
        expect(route).toHaveProperty('stopIds');
        expect(Array.isArray(route.stopIds)).toBe(true);
      });
    });

    test('should handle errors gracefully', () => {
      const req = {} as Request;
      const res = createMockResponse();

      // Mock getAllRoutes to throw an error
      vi.spyOn(dataStore, 'getAllRoutes').mockImplementation(() => {
        throw new Error('Database error');
      });

      getRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to retrieve routes'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });

  describe('GET /api/routes/:routeId', () => {
    test('should return route with stops for valid route ID', () => {
      const req = {
        params: { routeId: 'route-101' }
      } as unknown as Request;
      const res = createMockResponse();

      getRouteWithStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const routeWithStops = (res.json as any).mock.calls[0][0];
      expect(routeWithStops).toHaveProperty('id', 'route-101');
      expect(routeWithStops).toHaveProperty('name');
      expect(routeWithStops).toHaveProperty('stops');
      expect(Array.isArray(routeWithStops.stops)).toBe(true);
      expect(routeWithStops.stops.length).toBeGreaterThan(0);
      
      // Verify stops have sequence numbers
      routeWithStops.stops.forEach((stop: any, index: number) => {
        expect(stop).toHaveProperty('sequenceNumber', index + 1);
        expect(stop).toHaveProperty('id');
        expect(stop).toHaveProperty('name');
        expect(stop).toHaveProperty('latitude');
        expect(stop).toHaveProperty('longitude');
        expect(stop).toHaveProperty('address');
      });
    });

    test('should return 404 for non-existent route ID', () => {
      const req = {
        params: { routeId: 'route-999' }
      } as unknown as Request;
      const res = createMockResponse();

      getRouteWithStops(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: "Route with ID 'route-999' not found"
      });
    });

    test('should return 400 for empty route ID', () => {
      const req = {
        params: { routeId: '' }
      } as unknown as Request;
      const res = createMockResponse();

      getRouteWithStops(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Route ID is required and must be a non-empty string'
      });
    });

    test('should return 400 for whitespace-only route ID', () => {
      const req = {
        params: { routeId: '   ' }
      } as unknown as Request;
      const res = createMockResponse();

      getRouteWithStops(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Route ID is required and must be a non-empty string'
      });
    });

    test('should return all stops in correct sequential order', () => {
      const req = {
        params: { routeId: 'route-101' }
      } as unknown as Request;
      const res = createMockResponse();

      getRouteWithStops(req, res);

      const routeWithStops = (res.json as any).mock.calls[0][0];
      const stops = routeWithStops.stops;
      
      // Verify stops are in sequential order
      for (let i = 0; i < stops.length; i++) {
        expect(stops[i].sequenceNumber).toBe(i + 1);
      }
      
      // Verify stop IDs match the route's stopIds in order
      const stopIds = stops.map((stop: any) => stop.id);
      expect(stopIds).toEqual(routeWithStops.stopIds);
    });

    test('should handle errors gracefully', () => {
      const req = {
        params: { routeId: 'route-101' }
      } as unknown as Request;
      const res = createMockResponse();

      // Mock getRouteById to throw an error
      vi.spyOn(dataStore, 'getRouteById').mockImplementation(() => {
        throw new Error('Database error');
      });

      getRouteWithStops(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to retrieve route'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });
});
