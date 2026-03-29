/**
 * Vercel Serverless Function entry point
 * Registers all routes and starts the Express app
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { seed } from './store';
import {
  getRoutes, getRouteById,
  getStopsByIds, getStopById, requestStop,
  getBusLocationsByRoute, getBusLocationById, updateBusLocation
} from './handlers';

// Seed data on cold start
seed();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/routes',          getRoutes);
app.get('/api/routes/:routeId', getRouteById);

// Stops
app.get('/api/stops',           getStopsByIds);
app.get('/api/stops/:stopId',   getStopById);
app.post('/api/stops/:stopId/request', requestStop);

// Bus locations
app.get('/api/buses/locations',          getBusLocationsByRoute);
app.get('/api/buses/:busId/location',    getBusLocationById);
app.post('/api/buses/:busId/location',   updateBusLocation);

// Health check
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

export default app;
