# Implementation Plan: Bus Tracking System

## Overview

This implementation plan breaks down the Bus Tracking System into incremental coding tasks. The system will be built using TypeScript for type safety, with a focus on creating a functional passenger-facing interface that displays routes, allows stop selection, and shows real-time bus tracking.

The implementation follows a bottom-up approach: data models → API layer → frontend components → integration → testing.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create directory structure for frontend and backend
  - Initialize TypeScript configuration
  - Install dependencies: fast-check for property testing, testing framework (Jest or Vitest)
  - Set up build and development scripts
  - _Requirements: All (foundation)_

- [x] 2. Implement core data models and validation
  - [x] 2.1 Create Route, Stop, BusLocation, and GPSCoordinate TypeScript interfaces
    - Define all data model interfaces as specified in design
    - Include validation type guards for runtime checking
    - _Requirements: 5.1, 5.2, 7.1_
  
  - [x] 2.2 Write property test for GPS coordinate validation
    - **Property 14: GPS Coordinate Validation**
    - **Validates: Requirements 7.1**
  
  - [x] 2.3 Write property test for route data model
    - **Property 11: Route Data Persistence Round-Trip**
    - **Validates: Requirements 5.1, 5.3**
  
  - [x] 2.4 Write property test for stop data model
    - **Property 12: Stop Data Persistence Round-Trip**
    - **Validates: Requirements 5.2, 5.5**

- [x] 3. Implement backend API endpoints
  - [x] 3.1 Create Route API endpoints (GET /api/routes, GET /api/routes/:routeId)
    - Implement route retrieval logic
    - Add request validation and error handling
    - Return routes with complete stop information
    - _Requirements: 1.1, 1.3, 5.3_
  
  - [x] 3.2 Create Stop API endpoints (GET /api/stops/:stopId, GET /api/stops)
    - Implement stop retrieval logic
    - Support batch retrieval by IDs
    - _Requirements: 5.5_
  
  - [x] 3.3 Create GPS Tracking API endpoints (GET /api/buses/locations, POST /api/buses/:busId/location)
    - Implement GPS location retrieval for buses on a route
    - Implement GPS location update endpoint
    - Add coordinate validation
    - Add timestamp recording
    - _Requirements: 3.1, 7.1, 7.5_
  
  - [x] 3.4 Write unit tests for API error handling
    - Test invalid route IDs (404 errors)
    - Test invalid GPS coordinates (400 errors)
    - Test missing required fields
    - _Requirements: 7.1_

- [x] 4. Implement data storage layer
  - [x] 4.1 Create in-memory data store for routes and stops
    - Implement storage and retrieval functions
    - Maintain stop order for each route
    - Seed with sample route and stop data
    - _Requirements: 5.1, 5.2, 5.4_
  
  - [x] 4.2 Create in-memory cache for bus locations
    - Implement location storage with timestamp
    - Implement location retrieval by route
    - Add automatic expiration for stale data (>5 minutes)
    - _Requirements: 3.1, 7.5_
  
  - [x] 4.3 Write property test for stop sequence preservation
    - **Property 2: Stop Sequence Completeness and Order**
    - **Validates: Requirements 1.3, 1.4, 4.4, 5.4**

- [x] 5. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement proximity calculation and stop progress logic
  - [x] 6.1 Implement Haversine distance calculation function
    - Write calculateDistance function as specified in design
    - Write isAtStop function using proximity threshold (100m)
    - _Requirements: 7.3_
  
  - [x] 6.2 Implement stop status calculation logic
    - Create function to determine stop status (completed/current/upcoming)
    - Use bus location and stop sequence to calculate status
    - Handle edge cases (bus at first stop, bus at last stop)
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [x] 6.3 Write property test for proximity-based stop detection
    - **Property 15: Proximity-Based Stop Detection**
    - **Validates: Requirements 7.3**
  
  - [x] 6.4 Write property test for stop status assignment
    - **Property 8: Stop Status Assignment**
    - **Validates: Requirements 4.1**
  
  - [x] 6.5 Write property test for stop completion on passage
    - **Property 9: Stop Completion on Passage**
    - **Validates: Requirements 4.2**
  
  - [x] 6.6 Write unit tests for edge cases
    - Test bus exactly at threshold boundary
    - Test bus at first stop
    - Test bus at last stop
    - Test bus between stops
    - _Requirements: 4.2, 7.3_

- [x] 7. Implement frontend State Manager
  - [x] 7.1 Create StateManager class with route management
    - Implement loadRoutes, selectRoute, getCurrentRoute methods
    - Add API integration for route loading
    - _Requirements: 1.1, 1.3_
  
  - [x] 7.2 Add stop management to StateManager
    - Implement loadStopsForRoute, selectDropOffStop, getSelectedDropOffStop methods
    - Maintain single selection invariant
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [x] 7.3 Add bus tracking to StateManager
    - Implement startTrackingBuses, stopTrackingBuses, getBusLocations methods
    - Add polling mechanism with configurable interval
    - Integrate with GPS API
    - _Requirements: 3.1, 3.3, 3.5_
  
  - [x] 7.4 Write property test for single selection invariant
    - **Property 5: Single Selection Invariant**
    - **Validates: Requirements 2.4, 2.5**
  
  - [x] 7.5 Write property test for view context preservation
    - **Property 13: View Context Preservation**
    - **Validates: Requirements 6.3**

- [x] 8. Implement Route Viewer component
  - [x] 8.1 Create RouteViewer class with route display functionality
    - Implement displayRoutes method to render route list
    - Implement displayRouteStops method to show stops for selected route
    - Add click handlers for route selection
    - Update system.html with route viewer UI structure
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 8.2 Write property test for route display completeness
    - **Property 1: Route Display Completeness**
    - **Validates: Requirements 1.2**
  
  - [x] 8.3 Write unit tests for route viewer
    - Test empty route list display
    - Test single route display
    - Test route selection interaction
    - _Requirements: 1.1, 1.3_

- [x] 9. Implement Stop Selector component
  - [x] 9.1 Create StopSelector class with stop selection functionality
    - Implement displayStops method to render selectable stops
    - Implement onStopSelected handler with visual feedback
    - Implement getSelectedStop and clearSelection methods
    - Add stop selection UI to system.html
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  
  - [x] 9.2 Write property test for all stops selectable
    - **Property 3: All Stops Selectable**
    - **Validates: Requirements 2.1**
  
  - [x] 9.3 Write property test for stop selection registration
    - **Property 4: Stop Selection Registration**
    - **Validates: Requirements 2.2**
  
  - [x] 9.4 Write unit tests for stop selector
    - Test selecting first stop
    - Test selecting last stop
    - Test changing selection
    - Test clearing selection
    - _Requirements: 2.2, 2.5_

- [x] 10. Implement Bus Tracker Display component
  - [x] 10.1 Create BusTrackerDisplay class with location display
    - Implement updateBusLocation method to show bus on route
    - Implement displayBuses method for multiple buses
    - Implement updateStopStatus method to show stop progress
    - Implement showGPSUnavailable for error states
    - Add bus tracking UI to system.html (visual route representation)
    - _Requirements: 3.2, 3.4, 3.5, 4.1, 4.3_
  
  - [x] 10.2 Write property test for GPS retrieval
    - **Property 6: GPS Retrieval for Active Buses**
    - **Validates: Requirements 3.1**
  
  - [x] 10.3 Write property test for multiple bus display
    - **Property 7: Multiple Bus Display**
    - **Validates: Requirements 3.5**
  
  - [x] 10.4 Write property test for status update on location change
    - **Property 10: Status Update on Location Change**
    - **Validates: Requirements 4.5**
  
  - [x] 10.5 Write unit tests for bus tracker edge cases
    - Test GPS unavailable state
    - Test stale GPS data display
    - Test single bus tracking
    - Test multiple buses at same location
    - _Requirements: 3.4, 3.5_

- [x] 11. Checkpoint - Ensure frontend component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement error handling and user feedback
  - [x] 12.1 Add error handling for API failures
    - Implement retry logic with exponential backoff
    - Display user-friendly error messages
    - Handle network failures, server errors, and not found errors
    - _Requirements: 6.5_
  
  - [x] 12.2 Add GPS data error handling
    - Handle missing GPS data (display "Location unavailable")
    - Handle invalid coordinates (reject and log)
    - Handle stale data (show warning indicator)
    - Handle off-route detection (flag and display warning)
    - _Requirements: 3.4, 7.1, 7.4_
  
  - [x] 12.3 Write unit tests for error scenarios
    - Test network timeout handling
    - Test invalid GPS coordinate rejection
    - Test missing GPS data display
    - Test stale data warning
    - _Requirements: 3.4, 7.1_

- [x] 13. Wire components together and implement main application
  - [x] 13.1 Create main application initialization
    - Initialize StateManager
    - Initialize all UI components (RouteViewer, StopSelector, BusTrackerDisplay)
    - Wire components to StateManager
    - Set up event handlers and data flow
    - _Requirements: All_
  
  - [x] 13.2 Implement polling mechanism for real-time updates
    - Start GPS location polling when tracking buses
    - Update UI components when new data arrives
    - Ensure updates happen within 10 seconds
    - Stop polling when not tracking
    - _Requirements: 3.3, 4.5_
  
  - [x] 13.3 Add CSS styling for visual feedback and responsiveness
    - Style route list and stop list
    - Add visual feedback for selections (highlight selected items)
    - Style bus location display and stop progress indicators
    - Ensure responsive layout for different screen sizes
    - _Requirements: 2.3, 4.3, 6.2_

- [x] 14. Write integration tests for end-to-end scenarios
  - Test complete user flow: select route → view stops → select drop-off → track bus
  - Test multiple buses on same route with different progress
  - Test GPS data updates while viewing route
  - Test network failure and recovery during tracking
  - _Requirements: All_

- [x] 15. Add sample data and test the complete system
  - [x] 15.1 Create sample routes and stops
    - Add at least 3 sample routes with 5-10 stops each
    - Use realistic GPS coordinates
    - Ensure stops are in logical sequence
    - _Requirements: 5.1, 5.2_
  
  - [x] 15.2 Create sample bus location data
    - Add sample buses on different routes
    - Simulate buses at different positions (start, middle, end)
    - Add timestamps to location data
    - _Requirements: 3.1, 7.5_
  
  - [x] 15.3 Test complete passenger workflow manually
    - Open application and verify route list displays
    - Select a route and verify stops display in order
    - Select a drop-off stop and verify visual feedback
    - Verify bus location displays on route
    - Verify stop progress updates as bus moves
    - _Requirements: All_

- [x] 16. Final checkpoint - Ensure all tests pass and system works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end workflows
- The implementation uses TypeScript for type safety throughout
- Fast-check library is used for property-based testing
- Real-time updates use polling mechanism (can be upgraded to WebSocket later)
