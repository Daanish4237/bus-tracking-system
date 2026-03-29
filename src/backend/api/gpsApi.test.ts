/**
 * Unit tests for GPS Tracking API endpoints
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { getBusLocations, getBusLocationById, updateBusLocation } from './gpsApi';
import * as dataStore from '../data/dataStore';
import { BusLocation } from '../../shared/types';

// Mock response object
function createMockResponse(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('GPS Tracking API', () => {
  describe('GET /api/buses/locations', () => {
    test('should return bus locations for valid route ID', () => {
      const req = {
        query: { routeId: 'route-101' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const locations = (res.json as any).mock.calls[0][0];
      expect(Array.isArray(locations)).toBe(true);
      
      // Verify location structure
      locations.forEach((location: any) => {
        expect(location).toHaveProperty('busId');
        expect(location).toHaveProperty('routeId', 'route-101');
        expect(location).toHaveProperty('latitude');
        expect(location).toHaveProperty('longitude');
        expect(location).toHaveProperty('timestamp');
        expect(typeof location.latitude).toBe('number');
        expect(typeof location.longitude).toBe('number');
      });
    });

    test('should return empty array for route with no buses', () => {
      const req = {
        query: { routeId: 'route-202' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const locations = (res.json as any).mock.calls[0][0];
      expect(Array.isArray(locations)).toBe(true);
    });

    test('should return 400 for missing routeId parameter', () => {
      const req = {
        query: {}
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'routeId query parameter is required and must be a non-empty string'
      });
    });

    test('should return 400 for empty routeId parameter', () => {
      const req = {
        query: { routeId: '' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'routeId query parameter is required and must be a non-empty string'
      });
    });

    test('should return 404 for non-existent route ID', () => {
      const req = {
        query: { routeId: 'route-999' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: "Route with ID 'route-999' not found"
      });
    });

    test('should handle errors gracefully', () => {
      const req = {
        query: { routeId: 'route-101' }
      } as unknown as Request;
      const res = createMockResponse();

      // Mock getRouteById to throw an error
      vi.spyOn(dataStore, 'getRouteById').mockImplementation(() => {
        throw new Error('Database error');
      });

      getBusLocations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to retrieve bus locations'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });

  describe('GET /api/buses/:busId/location', () => {
    test('should return bus location for valid bus ID', () => {
      const req = {
        params: { busId: 'bus-001' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocationById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const location = (res.json as any).mock.calls[0][0];
      expect(location).toHaveProperty('busId', 'bus-001');
      expect(location).toHaveProperty('routeId');
      expect(location).toHaveProperty('latitude');
      expect(location).toHaveProperty('longitude');
      expect(location).toHaveProperty('timestamp');
    });

    test('should return 404 for non-existent bus ID', () => {
      const req = {
        params: { busId: 'bus-999' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: "Location for bus with ID 'bus-999' not found"
      });
    });

    test('should return 400 for empty bus ID', () => {
      const req = {
        params: { busId: '' }
      } as unknown as Request;
      const res = createMockResponse();

      getBusLocationById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Bus ID is required and must be a non-empty string'
      });
    });

    test('should handle errors gracefully', () => {
      const req = {
        params: { busId: 'bus-001' }
      } as unknown as Request;
      const res = createMockResponse();

      // Mock getBusLocation to throw an error
      vi.spyOn(dataStore, 'getBusLocation').mockImplementation(() => {
        throw new Error('Database error');
      });

      getBusLocationById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to retrieve bus location'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });

  describe('POST /api/buses/:busId/location', () => {
    test('should update bus location with valid data', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          timestamp: new Date().toISOString()
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as any).mock.calls[0][0];
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message', 'Bus location updated successfully');
      expect(response).toHaveProperty('location');
      expect(response.location.busId).toBe('bus-001');
      expect(response.location.latitude).toBe(40.7589);
      expect(response.location.longitude).toBe(-73.9851);
    });

    test('should update bus location with optional speed and heading', () => {
      const req = {
        params: { busId: 'bus-002' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          timestamp: new Date().toISOString(),
          speed: 25,
          heading: 180
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = (res.json as any).mock.calls[0][0];
      expect(response.location.speed).toBe(25);
      expect(response.location.heading).toBe(180);
    });

    test('should use current timestamp if not provided', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = (res.json as any).mock.calls[0][0];
      expect(response.location.timestamp).toBeDefined();
    });

    test('should return 400 for missing latitude', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'latitude and longitude are required fields'
      });
    });

    test('should return 400 for missing longitude', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'latitude and longitude are required fields'
      });
    });

    test('should return 400 for missing routeId', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'routeId is required and must be a non-empty string'
      });
    });

    test('should return 400 for invalid GPS coordinates - latitude too high', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 91,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Invalid GPS coordinates. Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    });

    test('should return 400 for invalid GPS coordinates - latitude too low', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: -91,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Invalid GPS coordinates. Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    });

    test('should return 400 for invalid GPS coordinates - longitude too high', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: 181,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Invalid GPS coordinates. Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    });

    test('should return 400 for invalid GPS coordinates - longitude too low', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -181,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Invalid GPS coordinates. Latitude must be between -90 and 90, longitude must be between -180 and 180'
      });
    });

    test('should accept valid boundary GPS coordinates - max latitude', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 90,
          longitude: 0,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should accept valid boundary GPS coordinates - min latitude', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: -90,
          longitude: 0,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should accept valid boundary GPS coordinates - max longitude', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 0,
          longitude: 180,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should accept valid boundary GPS coordinates - min longitude', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 0,
          longitude: -180,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 for non-existent route ID', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-999'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: "Route with ID 'route-999' not found"
      });
    });

    test('should return 400 for timestamp in the future', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          timestamp: futureDate.toISOString()
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Timestamp cannot be in the future'
      });
    });

    test('should return 400 for invalid timestamp format', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          timestamp: 'invalid-date'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Invalid timestamp format'
      });
    });

    test('should return 400 for negative speed', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          speed: -10
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'speed must be a non-negative number'
      });
    });

    test('should return 400 for invalid heading - too high', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          heading: 360
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'heading must be a number between 0 and 359'
      });
    });

    test('should return 400 for invalid heading - negative', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          heading: -1
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'heading must be a number between 0 and 359'
      });
    });

    test('should return 400 for empty bus ID', () => {
      const req = {
        params: { busId: '' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Bus ID is required and must be a non-empty string'
      });
    });

    test('should handle errors gracefully', () => {
      const req = {
        params: { busId: 'bus-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      // Mock setBusLocation to throw an error
      vi.spyOn(dataStore, 'setBusLocation').mockImplementation(() => {
        throw new Error('Database error');
      });

      updateBusLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to update bus location'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });
});
