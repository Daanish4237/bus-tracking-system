# Route API Documentation

## Overview

The Route API provides endpoints for retrieving bus route information and associated stops. All endpoints return JSON responses.

## Endpoints

### GET /api/routes

Retrieve all available bus routes.

**Response:** `200 OK`

```json
[
  {
    "id": "route-101",
    "name": "Downtown Express",
    "stopIds": ["stop-101-1", "stop-101-2", "stop-101-3", "stop-101-4", "stop-101-5"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  ...
]
```

**Error Responses:**

- `500 Internal Server Error` - Server error occurred while retrieving routes

---

### GET /api/routes/:routeId

Retrieve a specific route with all stops in sequential order.

**Parameters:**

- `routeId` (path parameter) - The unique identifier of the route

**Response:** `200 OK`

```json
{
  "id": "route-101",
  "name": "Downtown Express",
  "stopIds": ["stop-101-1", "stop-101-2", "stop-101-3", "stop-101-4", "stop-101-5"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "stops": [
    {
      "id": "stop-101-1",
      "name": "Central Station",
      "latitude": 40.7589,
      "longitude": -73.9851,
      "address": "123 Main St",
      "sequenceNumber": 1
    },
    {
      "id": "stop-101-2",
      "name": "City Hall",
      "latitude": 40.7614,
      "longitude": -73.9776,
      "address": "456 Broadway",
      "sequenceNumber": 2
    },
    ...
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Route ID is missing or invalid
  ```json
  {
    "error": "Bad request",
    "message": "Route ID is required and must be a non-empty string"
  }
  ```

- `404 Not Found` - Route with the specified ID does not exist
  ```json
  {
    "error": "Not found",
    "message": "Route with ID 'route-999' not found"
  }
  ```

- `500 Internal Server Error` - Server error occurred while retrieving route

## Data Models

### Route

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique route identifier |
| name | string | Display name of the route |
| stopIds | string[] | Ordered array of stop IDs |
| isActive | boolean | Whether the route is currently in service |
| createdAt | Date | Route creation timestamp |
| updatedAt | Date | Last update timestamp |

### Stop (in route response)

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique stop identifier |
| name | string | Display name of the stop |
| latitude | number | GPS latitude (-90 to 90) |
| longitude | number | GPS longitude (-180 to 180) |
| address | string | Human-readable address |
| sequenceNumber | number | Position in route sequence (1-indexed) |

## Validation Rules

### Route Validation

- `id` must be a non-empty string
- `name` must be a non-empty string
- `stopIds` must contain at least 2 stops
- All stop IDs must be non-empty strings

### GPS Coordinate Validation

- `latitude` must be between -90 and 90
- `longitude` must be between -180 and 180

## Requirements Satisfied

This API implementation satisfies the following requirements:

- **Requirement 1.1**: Display all available routes
- **Requirement 1.3**: Display all stops on a route in sequential order
- **Requirement 5.3**: Retrieve complete route definition with all associated stops

## Testing

The API includes comprehensive test coverage:

- **Unit tests** (`routeApi.test.ts`): Test individual endpoint handlers with mocked dependencies
- **Integration tests** (`routeApi.integration.test.ts`): Test actual HTTP endpoints with a running server

Run tests with:

```bash
npm test
```

## Starting the Server

To start the API server:

```bash
npm run backend:dev
```

The server will start on port 3000 (or the port specified in the `PORT` environment variable).

Health check endpoint: `http://localhost:3000/health`
