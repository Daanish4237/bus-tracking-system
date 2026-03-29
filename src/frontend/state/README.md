# Frontend State Manager

## Overview

The StateManager is the central state management component for the Bus Tracking System frontend. It coordinates between UI components and backend APIs, managing application state for routes, stops, and bus tracking.

## Features

### Route Management
- **Load Routes**: Fetch all available routes from the API
- **Select Route**: Select a specific route and load its stops
- **Get Current Route**: Access the currently selected route
- **Get All Routes**: Access all loaded routes

### Stop Management
- **Load Stops**: Fetch stops for a specific route
- **Select Drop-off Stop**: Select a passenger's drop-off location
- **Single Selection Invariant**: Ensures only one stop is selected at a time
- **Get Selected Stop**: Access the currently selected drop-off stop
- **Clear Selection**: Remove the current drop-off selection
- **Get Stops for Route**: Access all stops for the current route in sequential order

### Bus Tracking
- **Start Tracking**: Begin tracking buses on a route
- **Stop Tracking**: Stop tracking and clear bus locations
- **Get Bus Locations**: Access current bus location data
- **Polling**: Automatic periodic updates of bus locations

## Usage

```typescript
import { StateManager } from './state';

// Initialize the state manager
const stateManager = new StateManager('/api');

// Load and display routes
const routes = await stateManager.loadRoutes();

// Select a route
await stateManager.selectRoute('route-101');

// Get stops for the current route
const stops = stateManager.getStopsForCurrentRoute();

// Select a drop-off stop
stateManager.selectDropOffStop('stop-3');

// Start tracking buses
stateManager.startTrackingBuses('route-101');
stateManager.startPolling(5000); // Poll every 5 seconds

// Get bus locations
const busLocations = stateManager.getBusLocations();

// Stop tracking
stateManager.stopTrackingBuses();
stateManager.stopPolling();
```

## API Integration

The StateManager integrates with the following backend API endpoints:

- `GET /api/routes` - Fetch all routes
- `GET /api/routes/:routeId` - Fetch a specific route with stops
- `GET /api/buses/locations?routeId=:routeId` - Fetch bus locations for a route

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 1.1**: Load and display all available routes
- **Requirement 1.3**: Display all stops on a route in sequential order
- **Requirement 2.1**: Display all stops as selectable options
- **Requirement 2.2**: Mark selected stop as drop-off location
- **Requirement 2.4**: Allow only one stop to be selected at a time
- **Requirement 2.5**: Update selection and clear previous selection
- **Requirement 3.1**: Retrieve current GPS coordinates for buses
- **Requirement 3.3**: Refresh bus location display (via polling)
- **Requirement 3.5**: Display multiple buses on the same route

## Testing

The StateManager has comprehensive unit test coverage with 26 tests covering:

- Route management (6 tests)
- Stop management (10 tests)
- Bus tracking (6 tests)
- Polling mechanism (4 tests)

All tests pass successfully. Run tests with:

```bash
npm test -- StateManager.test.ts
```

## Architecture

The StateManager follows these design principles:

1. **Single Responsibility**: Manages application state and API communication
2. **Encapsulation**: Internal state is private, accessed via public methods
3. **Type Safety**: Full TypeScript typing for all data structures
4. **Error Handling**: Comprehensive error handling with logging
5. **Testability**: Designed for easy unit testing with mocked fetch

## Future Enhancements

Potential improvements for future iterations:

- WebSocket support for real-time updates (instead of polling)
- State persistence (localStorage/sessionStorage)
- Undo/redo functionality
- State change event listeners for reactive UI updates
- Caching strategies for API responses
