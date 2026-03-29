/**
 * Integration tests for GPS Tracking API endpoints
 * Tests the complete flow with actual data store
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getBusLocations, getBusLocationById, updateBusLocation } from './gpsApi';
import { initializeDataStore, initializeSampleBusLocations } from '../data/dataStore';

// Mock response object
function createMockResponse(): Response {
  const res = {} as Response;
  const jsonData: any[] = [];
  
  res.status = function(code: number) {
    (this as any).statusCode = code;
    return this;
  };
  
  res.json = function(data: any) {
    jsonData.push(data);
    return this;
  };
  
  (res as any).getJsonData = () => jsonData[0];
  (res as any).getStatusCode = () => (res as any).statusCode;
  
  return res;
}

describe('GPS Tracking API Integration Tests', () => {
  beforeEach(() => {
    // Reinitialize data store before each test
    initializeDataStore();
    initializeSampleBusLocations();
  });

  describe('Complete GPS tracking workflow', () => {
    test('should update and retrieve bus location', () => {
      // Step 1: Update bus location
      const updateReq = {
        params: { busId: 'bus-test-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          timestamp: new Date().toISOString(),
          speed: 30,
          heading: 90
        }
      } as unknown as Request;
      const updateRes = createMockResponse();

      updateBusLocation(updateReq, updateRes);

      expect((updateRes as any).getStatusCode()).toBe(200);
      const updateResponse = (updateRes as any).getJsonData();
      expect(updateResponse.success).toBe(true);

      // Step 2: Retrieve the bus location by ID
      const getReq = {
        params: { busId: 'bus-test-001' }
      } as unknown as Request;
      const getRes = createMockResponse();

      getBusLocationById(getReq, getRes);

      expect((getRes as any).getStatusCode()).toBe(200);
      const location = (getRes as any).getJsonData();
      expect(location.busId).toBe('bus-test-001');
      expect(location.latitude).toBe(40.7589);
      expect(location.longitude).toBe(-73.9851);
      expect(location.routeId).toBe('route-101');
      expect(location.speed).toBe(30);
      expect(location.heading).toBe(90);
    });

    test('should retrieve multiple buses on same route', () => {
      // Add multiple buses to route-101
      const bus1Req = {
        params: { busId: 'bus-multi-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      updateBusLocation(bus1Req, createMockResponse());

      const bus2Req = {
        params: { busId: 'bus-multi-002' },
        body: {
          latitude: 40.7614,
          longitude: -73.9776,
          routeId: 'route-101'
        }
      } as unknown as Request;
      updateBusLocation(bus2Req, createMockResponse());

      // Retrieve all buses on route-101
      const getReq = {
        query: { routeId: 'route-101' }
      } as unknown as Request;
      const getRes = createMockResponse();

      getBusLocations(getReq, getRes);

      expect((getRes as any).getStatusCode()).toBe(200);
      const locations = (getRes as any).getJsonData();
      expect(Array.isArray(locations)).toBe(true);
      
      // Should include the sample bus-001 plus our two new buses
      const busIds = locations.map((loc: any) => loc.busId);
      expect(busIds).toContain('bus-001'); // Sample data
      expect(busIds).toContain('bus-multi-001');
      expect(busIds).toContain('bus-multi-002');
    });

    test('should update existing bus location', () => {
      // Initial location
      const initialReq = {
        params: { busId: 'bus-update-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          speed: 20
        }
      } as unknown as Request;
      updateBusLocation(initialReq, createMockResponse());

      // Updated location
      const updateReq = {
        params: { busId: 'bus-update-001' },
        body: {
          latitude: 40.7614,
          longitude: -73.9776,
          routeId: 'route-101',
          speed: 35
        }
      } as unknown as Request;
      updateBusLocation(updateReq, createMockResponse());

      // Retrieve and verify updated location
      const getReq = {
        params: { busId: 'bus-update-001' }
      } as unknown as Request;
      const getRes = createMockResponse();

      getBusLocationById(getReq, getRes);

      const location = (getRes as any).getJsonData();
      expect(location.latitude).toBe(40.7614);
      expect(location.longitude).toBe(-73.9776);
      expect(location.speed).toBe(35);
    });

    test('should validate coordinates on update', () => {
      const req = {
        params: { busId: 'bus-invalid-001' },
        body: {
          latitude: 100, // Invalid
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect((res as any).getStatusCode()).toBe(400);
      const response = (res as any).getJsonData();
      expect(response.error).toBe('Bad request');
      expect(response.message).toContain('Invalid GPS coordinates');
    });

    test('should record timestamp for location updates', () => {
      const beforeUpdate = new Date();
      
      const req = {
        params: { busId: 'bus-timestamp-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101'
        }
      } as unknown as Request;
      const updateRes = createMockResponse();

      updateBusLocation(req, updateRes);

      const afterUpdate = new Date();

      // Retrieve and check timestamp
      const getReq = {
        params: { busId: 'bus-timestamp-001' }
      } as unknown as Request;
      const getRes = createMockResponse();

      getBusLocationById(getReq, getRes);

      const location = (getRes as any).getJsonData();
      const timestamp = new Date(location.timestamp);
      
      // Timestamp should be between before and after update
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    test('should accept custom timestamp within valid range', () => {
      const customTimestamp = new Date();
      customTimestamp.setMinutes(customTimestamp.getMinutes() - 2); // 2 minutes ago

      const req = {
        params: { busId: 'bus-custom-time-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-101',
          timestamp: customTimestamp.toISOString()
        }
      } as unknown as Request;
      const updateRes = createMockResponse();

      updateBusLocation(req, updateRes);

      expect((updateRes as any).getStatusCode()).toBe(200);

      // Verify timestamp was stored correctly
      const getReq = {
        params: { busId: 'bus-custom-time-001' }
      } as unknown as Request;
      const getRes = createMockResponse();

      getBusLocationById(getReq, getRes);

      const location = (getRes as any).getJsonData();
      const storedTimestamp = new Date(location.timestamp);
      
      // Should match custom timestamp (within 1 second tolerance for serialization)
      expect(Math.abs(storedTimestamp.getTime() - customTimestamp.getTime())).toBeLessThan(1000);
    });

    test('should handle buses on different routes separately', () => {
      // Add buses to different routes
      updateBusLocation({
        params: { busId: 'bus-route1-001' },
        body: { latitude: 40.7589, longitude: -73.9851, routeId: 'route-101' }
      } as unknown as Request, createMockResponse());

      updateBusLocation({
        params: { busId: 'bus-route2-001' },
        body: { latitude: 40.7527, longitude: -73.9772, routeId: 'route-202' }
      } as unknown as Request, createMockResponse());

      // Get buses for route-101
      const route101Req = {
        query: { routeId: 'route-101' }
      } as unknown as Request;
      const route101Res = createMockResponse();

      getBusLocations(route101Req, route101Res);

      const route101Locations = (route101Res as any).getJsonData();
      const route101BusIds = route101Locations.map((loc: any) => loc.busId);
      
      expect(route101BusIds).toContain('bus-route1-001');
      expect(route101BusIds).not.toContain('bus-route2-001');

      // Get buses for route-202
      const route202Req = {
        query: { routeId: 'route-202' }
      } as unknown as Request;
      const route202Res = createMockResponse();

      getBusLocations(route202Req, route202Res);

      const route202Locations = (route202Res as any).getJsonData();
      const route202BusIds = route202Locations.map((loc: any) => loc.busId);
      
      expect(route202BusIds).toContain('bus-route2-001');
      expect(route202BusIds).not.toContain('bus-route1-001');
    });

    test('should validate route exists before updating location', () => {
      const req = {
        params: { busId: 'bus-invalid-route-001' },
        body: {
          latitude: 40.7589,
          longitude: -73.9851,
          routeId: 'route-nonexistent'
        }
      } as unknown as Request;
      const res = createMockResponse();

      updateBusLocation(req, res);

      expect((res as any).getStatusCode()).toBe(404);
      const response = (res as any).getJsonData();
      expect(response.error).toBe('Not found');
      expect(response.message).toContain('route-nonexistent');
    });

    test('should handle boundary GPS coordinates correctly', () => {
      // Test all boundary values
      const boundaries = [
        { lat: 90, lon: 0, desc: 'North Pole' },
        { lat: -90, lon: 0, desc: 'South Pole' },
        { lat: 0, lon: 180, desc: 'International Date Line East' },
        { lat: 0, lon: -180, desc: 'International Date Line West' },
        { lat: 0, lon: 0, desc: 'Equator/Prime Meridian' }
      ];

      boundaries.forEach(({ lat, lon, desc }) => {
        const req = {
          params: { busId: `bus-boundary-${desc.replace(/\s+/g, '-')}` },
          body: {
            latitude: lat,
            longitude: lon,
            routeId: 'route-101'
          }
        } as unknown as Request;
        const res = createMockResponse();

        updateBusLocation(req, res);

        expect((res as any).getStatusCode()).toBe(200);
        
        const response = (res as any).getJsonData();
        expect(response.location.latitude).toBe(lat);
        expect(response.location.longitude).toBe(lon);
      });
    });
  });
});
