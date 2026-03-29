/**
 * Standalone Vercel Serverless Function
 * All backend logic is self-contained here to avoid module resolution issues
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

// ============================================================
// Types
// ============================================================

interface Route {
  id: string; name: string; stopIds: string[];
  isActive: boolean; createdAt: Date; updatedAt: Date;
}
interface Stop {
  id: string; name: string; latitude: number; longitude: number;
  address: string; createdAt: Date; updatedAt: Date;
}
interface BusLocation {
  busId: string; routeId: string; latitude: number; longitude: number;
  timestamp: Date; speed?: number; heading?: number;
}

function isValidGPS(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// ============================================================
// Data Store
// ============================================================

const routes = new Map<string, Route>();
const stops = new Map<string, Stop>();
const busLocations = new Map<string, BusLocation>();
const STALE_MS = 5 * 60 * 1000;

function seed() {
  const now = new Date('2024-01-01');
  const stopData: Stop[] = [
    { id: 'stop-101-1', name: 'Central Station',    latitude: 40.7589, longitude: -73.9851, address: '123 Main St',          createdAt: now, updatedAt: now },
    { id: 'stop-101-2', name: 'City Hall',           latitude: 40.7614, longitude: -73.9776, address: '456 Broadway',         createdAt: now, updatedAt: now },
    { id: 'stop-101-3', name: 'Union Square',        latitude: 40.7359, longitude: -73.9911, address: '789 Park Ave',         createdAt: now, updatedAt: now },
    { id: 'stop-101-4', name: 'Financial District',  latitude: 40.7074, longitude: -74.0113, address: '321 Wall St',          createdAt: now, updatedAt: now },
    { id: 'stop-101-5', name: 'Battery Park',        latitude: 40.7033, longitude: -74.0170, address: '555 Battery Pl',       createdAt: now, updatedAt: now },
    { id: 'stop-202-1', name: 'Grand Central',       latitude: 40.7527, longitude: -73.9772, address: '100 E 42nd St',        createdAt: now, updatedAt: now },
    { id: 'stop-202-2', name: 'Museum Mile',         latitude: 40.7794, longitude: -73.9632, address: '200 5th Ave',          createdAt: now, updatedAt: now },
    { id: 'stop-202-3', name: 'Central Park North',  latitude: 40.7979, longitude: -73.9520, address: '300 Central Park N',   createdAt: now, updatedAt: now },
    { id: 'stop-202-4', name: 'Columbia University', latitude: 40.8075, longitude: -73.9626, address: '400 W 116th St',       createdAt: now, updatedAt: now },
    { id: 'stop-202-5', name: 'Washington Heights',  latitude: 40.8448, longitude: -73.9388, address: '500 W 181st St',       createdAt: now, updatedAt: now },
    { id: 'stop-202-6', name: 'Fort Tryon Park',     latitude: 40.8648, longitude: -73.9318, address: '600 Margaret Corbin Dr', createdAt: now, updatedAt: now },
    { id: 'stop-303-1', name: 'West Side Terminal',  latitude: 40.7589, longitude: -74.0014, address: '700 West End Ave',     createdAt: now, updatedAt: now },
    { id: 'stop-303-2', name: 'Lincoln Center',      latitude: 40.7722, longitude: -73.9843, address: '800 Columbus Ave',     createdAt: now, updatedAt: now },
    { id: 'stop-303-3', name: 'Times Square',        latitude: 40.7580, longitude: -73.9855, address: '900 7th Ave',          createdAt: now, updatedAt: now },
    { id: 'stop-303-4', name: 'Bryant Park',         latitude: 40.7536, longitude: -73.9832, address: '1000 6th Ave',         createdAt: now, updatedAt: now },
    { id: 'stop-303-5', name: 'East Side Plaza',     latitude: 40.7489, longitude: -73.9680, address: '1100 Lexington Ave',   createdAt: now, updatedAt: now },
  ];
  stopData.forEach(s => stops.set(s.id, s));

  const routeData: Route[] = [
    { id: 'route-101', name: 'Downtown Express',   stopIds: ['stop-101-1','stop-101-2','stop-101-3','stop-101-4','stop-101-5'], isActive: true, createdAt: now, updatedAt: now },
    { id: 'route-202', name: 'Uptown Local',        stopIds: ['stop-202-1','stop-202-2','stop-202-3','stop-202-4','stop-202-5','stop-202-6'], isActive: true, createdAt: now, updatedAt: now },
    { id: 'route-303', name: 'Crosstown Shuttle',   stopIds: ['stop-303-1','stop-303-2','stop-303-3','stop-303-4','stop-303-5'], isActive: true, createdAt: now, updatedAt: now },
  ];
  routeData.forEach(r => routes.set(r.id, r));

  const busData: BusLocation[] = [
    { busId: 'bus-001', routeId: 'route-101', latitude: 40.7614, longitude: -73.9776, timestamp: new Date(), speed: 25, heading: 180 },
    { busId: 'bus-002', routeId: 'route-202', latitude: 40.8027, longitude: -73.9573, timestamp: new Date(), speed: 30, heading: 0 },
    { busId: 'bus-003', routeId: 'route-303', latitude: 40.7536, longitude: -73.9832, timestamp: new Date(), speed: 15, heading: 90 },
  ];
  busData.forEach(b => busLocations.set(b.busId, b));
}

seed();

// ============================================================
// Express App
// ============================================================

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/routes
app.get('/api/routes', (_req: Request, res: Response) => {
  res.json(Array.from(routes.values()));
});

// GET /api/routes/:routeId
app.get('/api/routes/:routeId', (req: Request, res: Response) => {
  const route = routes.get(req.params['routeId'] as string);
  if (!route) { res.status(404).json({ error: 'Route not found' }); return; }
  const routeStops = route.stopIds.map((id, i) => {
    const s = stops.get(id);
    return s ? { ...s, sequenceNumber: i + 1 } : null;
  }).filter(Boolean);
  res.json({ ...route, stops: routeStops });
});

// GET /api/stops
app.get('/api/stops', (req: Request, res: Response) => {
  const ids = req.query['ids'];
  const idsStr = Array.isArray(ids) ? ids[0] : ids;
  if (!idsStr || typeof idsStr !== 'string') { res.status(400).json({ error: 'ids query param required' }); return; }
  const result = idsStr.split(',').map(id => stops.get(id.trim())).filter(Boolean);
  res.json(result);
});

// GET /api/stops/:stopId
app.get('/api/stops/:stopId', (req: Request, res: Response) => {
  const stop = stops.get(req.params['stopId'] as string);
  if (!stop) { res.status(404).json({ error: 'Stop not found' }); return; }
  res.json(stop);
});

// GET /api/buses/locations
app.get('/api/buses/locations', (req: Request, res: Response) => {
  const routeIdParam = req.query['routeId'];
  const routeId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;
  if (!routeId || typeof routeId !== 'string') { res.status(400).json({ error: 'routeId required' }); return; }
  if (!routes.has(routeId)) { res.status(404).json({ error: 'Route not found' }); return; }
  const now = Date.now();
  const result = Array.from(busLocations.values()).filter(b =>
    b.routeId === routeId && (now - b.timestamp.getTime()) <= STALE_MS
  );
  res.json(result);
});

// GET /api/buses/:busId/location
app.get('/api/buses/:busId/location', (req: Request, res: Response) => {
  const loc = busLocations.get(req.params['busId'] as string);
  if (!loc) { res.status(404).json({ error: 'Bus not found' }); return; }
  res.json(loc);
});

// POST /api/buses/:busId/location
app.post('/api/buses/:busId/location', (req: Request, res: Response) => {
  const busId = req.params['busId'] as string;
  const { latitude, longitude, routeId, timestamp, speed, heading } = req.body;
  if (!isValidGPS(latitude, longitude)) { res.status(400).json({ error: 'Invalid GPS coordinates' }); return; }
  if (!routes.has(routeId)) { res.status(404).json({ error: 'Route not found' }); return; }
  const loc: BusLocation = { busId, routeId, latitude, longitude, timestamp: timestamp ? new Date(timestamp) : new Date(), speed, heading };
  busLocations.set(busId, loc);
  res.json({ success: true, location: loc });
});

// GET /health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default app;
