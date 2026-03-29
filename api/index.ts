import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { getRoutes, getRouteWithStops } from '../src/backend/api/routeApi';
import { getStop, getStops } from '../src/backend/api/stopApi';
import { getBusLocations, getBusLocationById, updateBusLocation } from '../src/backend/api/gpsApi';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/routes', getRoutes);
app.get('/api/routes/:routeId', getRouteWithStops);
app.get('/api/stops/:stopId', getStop);
app.get('/api/stops', getStops);
app.get('/api/buses/locations', getBusLocations);
app.get('/api/buses/:busId/location', getBusLocationById);
app.post('/api/buses/:busId/location', updateBusLocation);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
