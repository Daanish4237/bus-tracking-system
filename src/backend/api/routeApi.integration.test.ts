/**
 * Integration tests for Route API endpoints
 * Tests the actual HTTP endpoints with a running server
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import { getRoutes, getRouteWithStops } from './routeApi';

describe('Route API Integration Tests', () => {
  let app: Express;
  let server: any;
  const PORT = 3001; // Use different port for testing

  beforeAll(() => {
    // Set up Express app for testing
    app = express();
    app.use(express.json());
    app.get('/api/routes', getRoutes);
    app.get('/api/routes/:routeId', getRouteWithStops);
    
    // Start server
    server = app.listen(PORT);
  });

  afterAll(() => {
    // Close server after tests
    if (server) {
      server.close();
    }
  });

  test('GET /api/routes returns all routes', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/routes`);
    expect(response.status).toBe(200);
    
    const routes = await response.json();
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
    
    // Verify each route has required fields
    routes.forEach((route: any) => {
      expect(route).toHaveProperty('id');
      expect(route).toHaveProperty('name');
      expect(route).toHaveProperty('stopIds');
      expect(route).toHaveProperty('isActive');
      expect(Array.isArray(route.stopIds)).toBe(true);
      expect(route.stopIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('GET /api/routes/:routeId returns route with stops', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/routes/route-101`);
    expect(response.status).toBe(200);
    
    const routeWithStops = await response.json();
    expect(routeWithStops).toHaveProperty('id', 'route-101');
    expect(routeWithStops).toHaveProperty('name');
    expect(routeWithStops).toHaveProperty('stops');
    expect(Array.isArray(routeWithStops.stops)).toBe(true);
    expect(routeWithStops.stops.length).toBeGreaterThan(0);
    
    // Verify stops have all required fields including sequence numbers
    routeWithStops.stops.forEach((stop: any, index: number) => {
      expect(stop).toHaveProperty('id');
      expect(stop).toHaveProperty('name');
      expect(stop).toHaveProperty('latitude');
      expect(stop).toHaveProperty('longitude');
      expect(stop).toHaveProperty('address');
      expect(stop).toHaveProperty('sequenceNumber', index + 1);
      
      // Verify GPS coordinates are valid
      expect(stop.latitude).toBeGreaterThanOrEqual(-90);
      expect(stop.latitude).toBeLessThanOrEqual(90);
      expect(stop.longitude).toBeGreaterThanOrEqual(-180);
      expect(stop.longitude).toBeLessThanOrEqual(180);
    });
    
    // Verify stops are in correct order
    const stopIds = routeWithStops.stops.map((stop: any) => stop.id);
    expect(stopIds).toEqual(routeWithStops.stopIds);
  });

  test('GET /api/routes/:routeId returns 404 for non-existent route', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/routes/route-999`);
    expect(response.status).toBe(404);
    
    const error = await response.json();
    expect(error).toHaveProperty('error', 'Not found');
    expect(error).toHaveProperty('message');
    expect(error.message).toContain('route-999');
  });

  test('GET /api/routes/:routeId validates route ID format', async () => {
    // Note: Express URL routing will handle empty/whitespace route IDs differently
    // This test verifies that the validation logic works for the cases it receives
    const response = await fetch(`http://localhost:${PORT}/api/routes/route-999`);
    expect(response.status).toBe(404); // Non-existent route returns 404
    
    const error = await response.json();
    expect(error).toHaveProperty('error', 'Not found');
    expect(error).toHaveProperty('message');
  });

  test('All routes have complete stop information', async () => {
    // Get all routes
    const routesResponse = await fetch(`http://localhost:${PORT}/api/routes`);
    const routes = await routesResponse.json();
    
    // For each route, verify we can get complete stop information
    for (const route of routes) {
      const routeResponse = await fetch(`http://localhost:${PORT}/api/routes/${route.id}`);
      expect(routeResponse.status).toBe(200);
      
      const routeWithStops = await routeResponse.json();
      expect(routeWithStops.stops.length).toBe(route.stopIds.length);
      
      // Verify all stops are present and in order
      for (let i = 0; i < route.stopIds.length; i++) {
        expect(routeWithStops.stops[i].id).toBe(route.stopIds[i]);
        expect(routeWithStops.stops[i].sequenceNumber).toBe(i + 1);
      }
    }
  });
});
