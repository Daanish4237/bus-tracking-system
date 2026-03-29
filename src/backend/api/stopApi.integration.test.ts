/**
 * Integration tests for Stop API endpoints
 * Tests the actual HTTP endpoints with a running server
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import { getStop, getStops } from './stopApi';

describe('Stop API Integration Tests', () => {
  let app: Express;
  let server: any;
  const PORT = 3002; // Use different port for testing

  beforeAll(() => {
    // Set up Express app for testing
    app = express();
    app.use(express.json());
    app.get('/api/stops/:stopId', getStop);
    app.get('/api/stops', getStops);
    
    // Start server
    server = app.listen(PORT);
  });

  afterAll(() => {
    // Close server after tests
    if (server) {
      server.close();
    }
  });

  describe('GET /api/stops/:stopId', () => {
    test('should return stop details for valid stop ID', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops/stop-101-1`);
      expect(response.status).toBe(200);

      const stop = await response.json();
      expect(stop).toHaveProperty('id', 'stop-101-1');
      expect(stop).toHaveProperty('name', 'Central Station');
      expect(stop).toHaveProperty('latitude');
      expect(stop).toHaveProperty('longitude');
      expect(stop).toHaveProperty('address');
      expect(stop).toHaveProperty('createdAt');
      expect(stop).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent stop ID', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops/stop-999`);
      expect(response.status).toBe(404);

      const error = await response.json();
      expect(error).toHaveProperty('error', 'Not found');
      expect(error.message).toContain('stop-999');
    });
  });

  describe('GET /api/stops', () => {
    test('should return multiple stops for valid IDs', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=stop-101-1,stop-101-2,stop-101-3`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(3);
      expect(stops[0].id).toBe('stop-101-1');
      expect(stops[1].id).toBe('stop-101-2');
      expect(stops[2].id).toBe('stop-101-3');
    });

    test('should return single stop when only one ID provided', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=stop-202-1`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(1);
      expect(stops[0].id).toBe('stop-202-1');
      expect(stops[0].name).toBe('Grand Central');
    });

    test('should maintain order of requested stops', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=stop-101-3,stop-101-1,stop-101-2`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(stops.length).toBe(3);
      expect(stops[0].id).toBe('stop-101-3');
      expect(stops[1].id).toBe('stop-101-1');
      expect(stops[2].id).toBe('stop-101-2');
    });

    test('should return partial results when some IDs are not found', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=stop-101-1,stop-999,stop-101-2`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(stops.length).toBe(2);
      expect(stops[0].id).toBe('stop-101-1');
      expect(stops[1].id).toBe('stop-101-2');
    });

    test('should return empty array when no IDs are found', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=stop-999,stop-888`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(Array.isArray(stops)).toBe(true);
      expect(stops.length).toBe(0);
    });

    test('should return 400 when ids parameter is missing', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops`);
      expect(response.status).toBe(400);

      const error = await response.json();
      expect(error).toHaveProperty('error', 'Bad request');
      expect(error.message).toContain('ids');
    });

    test('should return 400 when ids parameter is empty', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=`);
      expect(response.status).toBe(400);

      const error = await response.json();
      expect(error).toHaveProperty('error', 'Bad request');
    });

    test('should handle IDs with extra whitespace', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids= stop-101-1 , stop-101-2 `);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(stops.length).toBe(2);
      expect(stops[0].id).toBe('stop-101-1');
      expect(stops[1].id).toBe('stop-101-2');
    });

    test('should retrieve stops from different routes', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=stop-101-1,stop-202-1,stop-303-1`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(stops.length).toBe(3);
      expect(stops[0].name).toBe('Central Station');
      expect(stops[1].name).toBe('Grand Central');
      expect(stops[2].name).toBe('West Side Terminal');
    });
  });

  describe('Stop API validates Requirement 5.5', () => {
    test('should retrieve stop data with all necessary information for display and selection', async () => {
      const response = await fetch(`http://localhost:${PORT}/api/stops/stop-101-1`);
      expect(response.status).toBe(200);

      const stop = await response.json();

      // Verify all necessary information is present (Requirement 5.5)
      expect(stop).toHaveProperty('id');
      expect(stop).toHaveProperty('name');
      expect(stop).toHaveProperty('latitude');
      expect(stop).toHaveProperty('longitude');
      expect(stop).toHaveProperty('address');

      // Verify GPS coordinates are valid
      expect(typeof stop.latitude).toBe('number');
      expect(typeof stop.longitude).toBe('number');
      expect(stop.latitude).toBeGreaterThanOrEqual(-90);
      expect(stop.latitude).toBeLessThanOrEqual(90);
      expect(stop.longitude).toBeGreaterThanOrEqual(-180);
      expect(stop.longitude).toBeLessThanOrEqual(180);

      // Verify metadata is present
      expect(stop).toHaveProperty('createdAt');
      expect(stop).toHaveProperty('updatedAt');
    });

    test('should support batch retrieval of stops by IDs', async () => {
      const stopIds = ['stop-101-1', 'stop-101-2', 'stop-101-3', 'stop-101-4', 'stop-101-5'];
      const response = await fetch(`http://localhost:${PORT}/api/stops?ids=${stopIds.join(',')}`);
      expect(response.status).toBe(200);

      const stops = await response.json();
      expect(stops.length).toBe(5);
      
      // Verify each stop has all necessary information
      stops.forEach((stop: any, index: number) => {
        expect(stop.id).toBe(stopIds[index]);
        expect(stop).toHaveProperty('name');
        expect(stop).toHaveProperty('latitude');
        expect(stop).toHaveProperty('longitude');
        expect(stop).toHaveProperty('address');
      });
    });
  });
});
