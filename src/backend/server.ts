/**
 * Express server for Bus Tracking System API
 */

import express from 'express';
import cors from 'cors';
import { getRoutes, getRouteWithStops } from './api/routeApi';
import { getStop, getStops } from './api/stopApi';
import { getBusLocations, getBusLocationById, updateBusLocation } from './api/gpsApi';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Bus Tracking System API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Routes API: http://localhost:${PORT}/api/routes`);
  console.log(`Stops API: http://localhost:${PORT}/api/stops`);
});

export default app;
