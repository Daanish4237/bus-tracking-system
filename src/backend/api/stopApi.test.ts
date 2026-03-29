/**
 * Unit tests for Stop API endpoints
 */

import { describe, test, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { getStop, getStops } from './stopApi';
import * as dataStore from '../data/dataStore';

// Mock response object
function createMockResponse(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('Stop API', () => {
  describe('GET /api/stops/:stopId', () => {
    test('should return stop details for valid stop ID', () => {
      const req = {
        params: { stopId: 'stop-101-1' }
      } as unknown as Request;
      const res = createMockResponse();

      getStop(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stop = (res.json as any).mock.calls[0][0];
      expect(stop).toHaveProperty('id', 'stop-101-1');
      expect(stop).toHaveProperty('name');
      expect(stop).toHaveProperty('latitude');
      expect(stop).toHaveProperty('longitude');
      expect(stop).toHaveProperty('address');
      expect(stop).toHaveProperty('createdAt');
      expect(stop).toHaveProperty('updatedAt');
      
      // Verify GPS coordinates are valid
      expect(stop.latitude).toBeGreaterThanOrEqual(-90);
      expect(stop.latitude).toBeLessThanOrEqual(90);
      expect(stop.longitude).toBeGreaterThanOrEqual(-180);
      expect(stop.longitude).toBeLessThanOrEqual(180);
    });

    test('should return 404 for non-existent stop ID', () => {
      const req = {
        params: { stopId: 'stop-999' }
      } as unknown as Request;
      const res = createMockResponse();

      getStop(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: "Stop with ID 'stop-999' not found"
      });
    });

    test('should return 400 for empty stop ID', () => {
      const req = {
        params: { stopId: '' }
      } as unknown as Request;
      const res = createMockResponse();

      getStop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Stop ID is required and must be a non-empty string'
      });
    });

    test('should return 400 for whitespace-only stop ID', () => {
      const req = {
        params: { stopId: '   ' }
      } as unknown as Request;
      const res = createMockResponse();

      getStop(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Stop ID is required and must be a non-empty string'
      });
    });

    test('should handle errors gracefully', () => {
      const req = {
        params: { stopId: 'stop-101-1' }
      } as unknown as Request;
      const res = createMockResponse();

      // Mock getStopById to throw an error
      vi.spyOn(dataStore, 'getStopById').mockImplementation(() => {
        throw new Error('Database error');
      });

      getStop(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to retrieve stop'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });

  describe('GET /api/stops', () => {
    test('should return multiple stops for valid IDs', () => {
      const req = {
        query: { ids: 'stop-101-1,stop-101-2,stop-101-3' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stops = (res.json as any).mock.calls[0][0];
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(3);
      
      // Verify each stop has required properties
      stops.forEach((stop: any) => {
        expect(stop).toHaveProperty('id');
        expect(stop).toHaveProperty('name');
        expect(stop).toHaveProperty('latitude');
        expect(stop).toHaveProperty('longitude');
        expect(stop).toHaveProperty('address');
        expect(stop).toHaveProperty('createdAt');
        expect(stop).toHaveProperty('updatedAt');
      });
      
      // Verify stops are returned in the requested order
      expect(stops[0].id).toBe('stop-101-1');
      expect(stops[1].id).toBe('stop-101-2');
      expect(stops[2].id).toBe('stop-101-3');
    });

    test('should return single stop when only one ID provided', () => {
      const req = {
        query: { ids: 'stop-101-1' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stops = (res.json as any).mock.calls[0][0];
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(1);
      expect(stops[0].id).toBe('stop-101-1');
    });

    test('should handle IDs with extra whitespace', () => {
      const req = {
        query: { ids: ' stop-101-1 , stop-101-2 , stop-101-3 ' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stops = (res.json as any).mock.calls[0][0];
      expect(stops.length).toBe(3);
      expect(stops[0].id).toBe('stop-101-1');
      expect(stops[1].id).toBe('stop-101-2');
      expect(stops[2].id).toBe('stop-101-3');
    });

    test('should return partial results when some IDs are not found', () => {
      const req = {
        query: { ids: 'stop-101-1,stop-999,stop-101-2' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stops = (res.json as any).mock.calls[0][0];
      expect(stops.length).toBe(2);
      expect(stops[0].id).toBe('stop-101-1');
      expect(stops[1].id).toBe('stop-101-2');
    });

    test('should return empty array when no IDs are found', () => {
      const req = {
        query: { ids: 'stop-999,stop-888' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stops = (res.json as any).mock.calls[0][0];
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(0);
    });

    test('should return 400 when ids parameter is missing', () => {
      const req = {
        query: {}
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Query parameter "ids" is required and must be a comma-separated list of stop IDs'
      });
    });

    test('should return 400 when ids parameter is empty string', () => {
      const req = {
        query: { ids: '' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Query parameter "ids" is required and must be a comma-separated list of stop IDs'
      });
    });

    test('should return 400 when ids parameter is whitespace only', () => {
      const req = {
        query: { ids: '   ' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'Query parameter "ids" is required and must be a comma-separated list of stop IDs'
      });
    });

    test('should return 400 when ids contains only commas', () => {
      const req = {
        query: { ids: ',,,,' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad request',
        message: 'At least one stop ID must be provided'
      });
    });

    test('should maintain order of requested stops', () => {
      const req = {
        query: { ids: 'stop-101-3,stop-101-1,stop-101-2' }
      } as unknown as Request;
      const res = createMockResponse();

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const stops = (res.json as any).mock.calls[0][0];
      expect(stops.length).toBe(3);
      expect(stops[0].id).toBe('stop-101-3');
      expect(stops[1].id).toBe('stop-101-1');
      expect(stops[2].id).toBe('stop-101-2');
    });

    test('should handle errors gracefully', () => {
      const req = {
        query: { ids: 'stop-101-1,stop-101-2' }
      } as unknown as Request;
      const res = createMockResponse();

      // Mock getStopsByIds to throw an error
      vi.spyOn(dataStore, 'getStopsByIds').mockImplementation(() => {
        throw new Error('Database error');
      });

      getStops(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to retrieve stops'
      });

      // Restore original implementation
      vi.restoreAllMocks();
    });
  });
});
