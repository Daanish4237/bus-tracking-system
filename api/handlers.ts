/** Route handlers for all API endpoints */

import { Request, Response } from 'express';
import { routes, stops, busLocations, stopRequests, STALE_MS } from './store';
import { isValidGPS, BusLocation } from './types';

// ── Routes ────────────────────────────────────────────────────────────────

export function getRoutes(_req: Request, res: Response): void {
  res.json(Array.from(routes.values()));
}

export function getRouteById(req: Request, res: Response): void {
  const route = routes.get(req.params['routeId'] as string);
  if (!route) { res.status(404).json({ error: 'Route not found' }); return; }
  const routeStops = route.stopIds
    .map((id, i) => { const s = stops.get(id); return s ? { ...s, sequenceNumber: i + 1 } : null; })
    .filter(Boolean);
  res.json({ ...route, stops: routeStops });
}

// ── Stops ─────────────────────────────────────────────────────────────────

export function getStopsByIds(req: Request, res: Response): void {
  const ids = req.query['ids'];
  const idsStr = Array.isArray(ids) ? ids[0] : ids;
  if (!idsStr || typeof idsStr !== 'string') { res.status(400).json({ error: 'ids query param required' }); return; }
  res.json(idsStr.split(',').map(id => stops.get(id.trim())).filter(Boolean));
}

export function getStopById(req: Request, res: Response): void {
  const stop = stops.get(req.params['stopId'] as string);
  if (!stop) { res.status(404).json({ error: 'Stop not found' }); return; }
  res.json(stop);
}

export function requestStop(req: Request, res: Response): void {
  const stopId = req.params['stopId'] as string;
  if (!stops.has(stopId)) { res.status(404).json({ error: 'Stop not found' }); return; }
  const existing = stopRequests.get(stopId);
  if (existing) { existing.count++; existing.timestamp = new Date(); }
  else stopRequests.set(stopId, { stopId, timestamp: new Date(), count: 1 });
  const stop = stops.get(stopId)!;
  res.json({ success: true, message: `Stop request sent for ${stop.name}`, requests: stopRequests.get(stopId)!.count });
}

// ── Bus Locations ─────────────────────────────────────────────────────────

export function getBusLocationsByRoute(req: Request, res: Response): void {
  const routeIdParam = req.query['routeId'];
  const routeId = Array.isArray(routeIdParam) ? routeIdParam[0] : routeIdParam;
  if (!routeId || typeof routeId !== 'string') { res.status(400).json({ error: 'routeId required' }); return; }
  if (!routes.has(routeId)) { res.status(404).json({ error: 'Route not found' }); return; }
  const now = Date.now();
  res.json(Array.from(busLocations.values()).filter(b => b.routeId === routeId && (now - b.timestamp.getTime()) <= STALE_MS));
}

export function getBusLocationById(req: Request, res: Response): void {
  const loc = busLocations.get(req.params['busId'] as string);
  if (!loc) { res.status(404).json({ error: 'Bus not found' }); return; }
  res.json(loc);
}

export function updateBusLocation(req: Request, res: Response): void {
  const busId = req.params['busId'] as string;
  const { latitude, longitude, routeId, timestamp, speed, heading } = req.body;
  if (!isValidGPS(latitude, longitude)) { res.status(400).json({ error: 'Invalid GPS coordinates' }); return; }
  if (!routes.has(routeId)) { res.status(404).json({ error: 'Route not found' }); return; }
  const loc: BusLocation = { busId, routeId, latitude, longitude, timestamp: timestamp ? new Date(timestamp) : new Date(), speed, heading };
  busLocations.set(busId, loc);
  res.json({ success: true, location: loc });
}
