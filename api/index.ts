/**
 * Vercel Serverless Function entry point
 * Wraps the Express app for deployment on Vercel
 */

import express from 'express';
import cors from 'cors';
import { getRoutes, getRouteWithStops } from '../src/backend/api/routeApi';
import { getStop, getStops } from '../src/backend/api/stopApi';
import { getBusLocations, getBusLocationById, updateBusLocation } from '../src/backend/api/gpsApi';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route API endpoints
app.get('/api/routes', getRoutes);
app.get('/api/routes/:routeId', getRouteWithStops);

// Stop API endpoints
app.get('/api/stops/:stopId', getStop);
app.get('/api/stops', getStops);

// GPS Tracking API endpoints
app.get('/api/buses/locations', getBusLocations);
app.get('/api/buses/:busId/location', getBusLocationById);
app.post('/api/buses/:busId/location', updateBusLocation);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
