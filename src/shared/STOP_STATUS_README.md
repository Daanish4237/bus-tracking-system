# Stop Status Calculator

This module provides functions to calculate the status of stops (completed, current, upcoming) based on a bus's current location and the route's stop sequence.

## Requirements

Implements requirements:
- **4.1**: Display all stops with their completion status
- **4.2**: Mark stops as completed when bus passes them
- **4.5**: Automatically update stop completion status based on bus position

## Functions

### `calculateStopStatuses(busLocation, stops)`

Calculate the status for all stops on a route based on the bus's current location.

**Parameters:**
- `busLocation: BusLocation` - Current GPS location of the bus
- `stops: Stop[]` - Array of stops in sequential order for the route

**Returns:**
- `StopProgress[]` - Array of stop progress objects with calculated status for each stop

**Logic:**
- Stops are marked as `COMPLETED` if the bus has passed them (based on sequence and proximity)
- A stop is marked as `CURRENT` if the bus is within proximity threshold (100 meters)
- Stops are marked as `UPCOMING` if the bus hasn't reached them yet

**Edge Cases:**
- If bus is at the first stop, all other stops are `UPCOMING`
- If bus is at the last stop, all previous stops are `COMPLETED`
- If bus is between stops, the closest passed stop is the last `COMPLETED`

**Example:**

```typescript
import { calculateStopStatuses } from './stopStatusCalculator';
import { BusLocation, Stop } from './types';

const busLocation: BusLocation = {
  busId: 'bus-101',
  routeId: 'route-1',
  latitude: 40.7138,
  longitude: -74.0070,
  timestamp: new Date()
};

const stops: Stop[] = [
  {
    id: 'stop-1',
    name: 'Main St & 1st Ave',
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'stop-2',
    name: 'Main St & 5th Ave',
    latitude: 40.7138,
    longitude: -74.0070,
    address: '456 Main St',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'stop-3',
    name: 'Main St & 10th Ave',
    latitude: 40.7148,
    longitude: -74.0080,
    address: '789 Main St',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const stopStatuses = calculateStopStatuses(busLocation, stops);

// Result:
// [
//   { stopId: 'stop-1', status: 'completed', ... },
//   { stopId: 'stop-2', status: 'current', ... },
//   { stopId: 'stop-3', status: 'upcoming', ... }
// ]
```

### `calculateStopStatus(busLocation, stop, allStops)`

Calculate the status for a single stop based on bus location.

**Parameters:**
- `busLocation: BusLocation` - Current GPS location of the bus
- `stop: Stop` - The stop to calculate status for
- `allStops: Stop[]` - All stops on the route in sequential order

**Returns:**
- `StopProgress` - Stop progress object with calculated status

**Example:**

```typescript
import { calculateStopStatus } from './stopStatusCalculator';

const stopStatus = calculateStopStatus(busLocation, stops[1], stops);

// Result:
// { stopId: 'stop-2', status: 'current', busId: 'bus-101', routeId: 'route-1', ... }
```

## Constants

- **Proximity Threshold**: 100 meters (defined in `geoUtils.ts`)
  - A bus is considered "at" a stop if within 100 meters
- **Approach Threshold**: 200 meters (internal to module)
  - Used to determine if bus is approaching vs has passed a stop

## Dependencies

- `types.ts` - Type definitions for BusLocation, Stop, StopStatus, StopProgress
- `geoUtils.ts` - Geographic utility functions (isAtStop, calculateDistance)

## Testing

Comprehensive unit tests are available in `stopStatusCalculator.test.ts` covering:
- Basic status calculation (completed, current, upcoming)
- Edge cases: bus at first stop, bus at last stop, bus between stops
- Empty route handling
- Single stop routes
- Routes with many stops
- Stops very close together
