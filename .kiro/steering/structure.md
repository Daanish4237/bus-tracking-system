# Project Structure

```
src/
├── main.ts                        # Frontend entry point
├── frontend/
│   ├── components/                # UI components (RouteViewer, StopSelector, BusTrackerDisplay)
│   └── state/                     # StateManager - coordinates app state
├── backend/
│   ├── server.ts                  # Express app setup and route registration
│   ├── api/                       # Route handlers (routeApi, stopApi, gpsApi)
│   └── data/                      # dataStore.ts - in-memory data storage
└── shared/
    ├── types.ts                   # Shared interfaces, enums, and type guards
    ├── geoUtils.ts                # GPS/distance calculation utilities
    └── stopStatusCalculator.ts    # Stop progress logic (completed/current/upcoming)

system.html                        # Main HTML shell
styles.css                         # Global styles
```

## Key Conventions

- Shared types live in `src/shared/types.ts` — use these across frontend and backend
- Runtime validation uses type guard functions (`isValidRoute`, `isValidStop`, etc.) defined in `types.ts`
- Backend uses two tsconfigs: `tsconfig.json` (frontend, noEmit) and `tsconfig.backend.json` (NodeNext modules, emits to `dist/backend/`)
- Tests are co-located next to source files as `*.test.ts`
- Integration tests are named `*.integration.test.ts`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/routes` | List all routes |
| GET | `/api/routes/:routeId` | Route with stops |
| GET | `/api/stops` | List all stops |
| GET | `/api/stops/:stopId` | Single stop |
| GET | `/api/buses/locations` | All bus locations |
| GET | `/api/buses/:busId/location` | Single bus location |
| POST | `/api/buses/:busId/location` | Update bus location |
| GET | `/health` | Health check |
