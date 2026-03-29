# GPS Tracking API

This document describes the GPS Tracking API endpoints for the Bus Tracking System.

## Endpoints

### GET /api/buses/locations

Retrieve current GPS locations for all buses on a specific route.

**Query Parameters:**
- `routeId` (required): The ID of the route to get bus locations for

**Response:** Array of BusLocation objects

**Example Request:**
```
GET /api/buses/locations?routeId=route-101
```

**Example Response:**
```json
[
  {
    "busId": "bus-001",
    "routeId": "route-101",
    "latitude": 40.7614,
    "longitude": -73.9776,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "speed": 25,
    "heading": 180
  }
]
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid routeId parameter
- `404 Not Found`: Route with specified ID not found
- `500 Internal Server Error`: Server error

---

### GET /api/buses/:busId/location

Retrieve current GPS location for a specific bus.

**Path Parameters:**
- `busId` (required): The ID of the bus

**Response:** BusLocation object

**Example Request:**
```
GET /api/buses/bus-001/location
```

**Example Response:**
```json
{
  "busId": "bus-001",
  "routeId": "route-101",
  "latitude": 40.7614,
  "longitude": -73.9776,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "speed": 25,
  "heading": 180
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid busId parameter
- `404 Not Found`: Bus location not found
- `500 Internal Server Error`: Server error

---

### POST /api/buses/:busId/location

Update GPS location for a bus (typically called by GPS devices on buses).

**Path Parameters:**
- `busId` (required): The ID of the bus

**Request Body:**
```json
{
  "latitude": 40.7614,
  "longitude": -73.9776,
  "routeId": "route-101",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "speed": 25,
  "heading": 180
}
```

**Required Fields:**
- `latitude` (number): GPS latitude (-90 to 90)
- `longitude` (number): GPS longitude (-180 to 180)
- `routeId` (string): The route the bus is currently serving

**Optional Fields:**
- `timestamp` (string, ISO 8601): When the location was recorded (defaults to current time)
- `speed` (number): Speed in km/h (must be non-negative)
- `heading` (number): Direction in degrees (0-359)

**Response:**
```json
{
  "success": true,
  "message": "Bus location updated successfully",
  "location": {
    "busId": "bus-001",
    "routeId": "route-101",
    "latitude": 40.7614,
    "longitude": -73.9776,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "speed": 25,
    "heading": 180
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields, invalid GPS coordinates, invalid timestamp, or invalid optional field values
- `404 Not Found`: Route with specified ID not found
- `500 Internal Server Error`: Server error

---

## Validation Rules

### GPS Coordinates
- **Latitude**: Must be between -90 and 90 (inclusive)
- **Longitude**: Must be between -180 and 180 (inclusive)

### Timestamp
- Must be a valid ISO 8601 date string
- Cannot be in the future
- If not provided, current server time is used

### Speed
- Must be a non-negative number (>= 0)
- Measured in km/h

### Heading
- Must be a number between 0 and 359 (inclusive)
- Measured in degrees (0 = North, 90 = East, 180 = South, 270 = West)

---

## Data Freshness

- Bus locations are cached in memory
- Locations older than 5 minutes are considered "stale"
- By default, GET endpoints exclude stale data
- The system automatically cleans up stale locations periodically

---

## Requirements Validated

This API implementation validates the following requirements:

- **Requirement 3.1**: GPS_Tracker retrieves current GPS coordinates of each bus on a route
- **Requirement 7.1**: GPS coordinates are validated to be within valid latitude and longitude ranges
- **Requirement 7.5**: All GPS location updates are timestamped

---

## Testing

The GPS API has comprehensive test coverage:

- **Unit Tests**: 32 tests covering all endpoints, validation, and error handling
- **Integration Tests**: 9 tests covering complete workflows and data persistence

Run tests with:
```bash
npm test -- src/backend/api/gpsApi.test.ts
npm test -- src/backend/api/gpsApi.integration.test.ts
```

---

## Sample Data

The system includes sample bus locations for testing:

- `bus-001`: On route-101 (Downtown Express)
- `bus-002`: On route-202 (Uptown Local)
- `bus-003`: On route-303 (Crosstown Shuttle)

Sample data is initialized automatically when the server starts.
