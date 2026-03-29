# Frontend Components

This directory contains the frontend UI components for the Bus Tracking System.

## Components Overview

- **RouteViewer**: Displays available bus routes and their stop sequences
- **StopSelector**: Allows passengers to select their desired drop-off stop
- **BusTrackerDisplay**: Shows real-time bus locations and stop-by-stop progress

## RouteViewer Component

The `RouteViewer` component is responsible for displaying available bus routes and their stop sequences.

### Features

- **Display Route List**: Shows all available routes with their ID and name
- **Route Selection**: Allows users to select a route by clicking on it
- **Visual Feedback**: Highlights the selected route
- **Display Route Stops**: Shows all stops for a selected route in sequential order
- **Stop Details**: Displays stop number, name, and address for each stop

### Usage

```typescript
import { RouteViewer } from './components/RouteViewer';

// Create a RouteViewer instance
const routeViewer = new RouteViewer(
  'route-list',      // ID of element to display route list
  'route-stops',     // ID of element to display route stops
  {
    onRouteSelected: (routeId) => {
      console.log('Route selected:', routeId);
      // Handle route selection
    }
  }
);

// Display routes
const routes = await stateManager.loadRoutes();
routeViewer.displayRoutes(routes);

// Display stops for a selected route
const stops = await stateManager.loadStopsForRoute(routeId);
routeViewer.displayRouteStops(routeId, stops);
```

### HTML Structure Required

The RouteViewer component requires two HTML elements:

```html
<!-- Route list container -->
<div id="route-list"></div>

<!-- Route stops container -->
<div id="route-stops"></div>
```

### CSS Classes

The component generates the following CSS classes:

- `.route-list` - Container for route items
- `.route-item` - Individual route item
- `.route-item.selected` - Selected route item
- `.route-content` - Route content wrapper
- `.route-id` - Route ID display
- `.route-name` - Route name display
- `.stops-list` - Container for stop items (ordered list)
- `.stop-item` - Individual stop item
- `.stop-content` - Stop content wrapper
- `.stop-number` - Stop sequence number
- `.stop-name` - Stop name display
- `.stop-address` - Stop address display

### Methods

#### `displayRoutes(routes: Route[]): void`
Displays all available routes in the route list container.

#### `displayRouteStops(routeId: string, stops: Stop[]): void`
Displays stops for a selected route in sequential order.

#### `onRouteSelected(routeId: string): void`
Handles route selection and updates the UI.

#### `getSelectedRouteId(): string | null`
Returns the currently selected route ID.

#### `clearRouteStops(): void`
Clears the route stops display.

#### `clearRouteList(): void`
Clears the route list display and resets selection.

### Requirements Satisfied

- **Requirement 1.1**: Display list of all available routes
- **Requirement 1.2**: Show route identifier and name
- **Requirement 1.3**: Display all stops on selected route in sequential order
- **Requirement 1.4**: Show complete sequence of stops from start to end

### Testing

The component includes comprehensive unit tests covering:
- Constructor validation
- Empty state handling
- Single and multiple route display
- Route selection and visual feedback
- Stop display in sequential order
- Clear operations

Run tests with:
```bash
npm test -- src/frontend/components/RouteViewer.test.ts
```


## StopSelector Component

The `StopSelector` component is responsible for allowing passengers to select their desired drop-off stop from a route.

### Features

- **Display Selectable Stops**: Shows all stops on a route as clickable options
- **Stop Selection**: Allows users to select a stop by clicking on it
- **Visual Feedback**: Highlights the selected stop with a distinct color (green)
- **Single Selection Invariant**: Ensures only one stop can be selected at a time
- **Selected Stop Info**: Displays detailed information about the currently selected stop
- **Clear Selection**: Provides method to clear the current selection

### Usage

```typescript
import { StopSelector } from './components/StopSelector';

// Create a StopSelector instance
const stopSelector = new StopSelector(
  'stop-selector',  // ID of element to display selectable stops
  {
    onStopSelected: (stopId) => {
      console.log('Stop selected:', stopId);
      // Handle stop selection
    }
  }
);

// Display stops for selection
const stops = await stateManager.loadStopsForRoute(routeId);
stopSelector.displayStops(stops);

// Get currently selected stop
const selectedStopId = stopSelector.getSelectedStop();

// Clear selection
stopSelector.clearSelection();
```

### HTML Structure Required

The StopSelector component requires one HTML element:

```html
<!-- Stop selector container -->
<div id="stop-selector"></div>
```

### CSS Classes

The component generates the following CSS classes:

- `.stop-selector-instruction` - Instruction text for users
- `.selectable-stops-list` - Container for selectable stop items
- `.selectable-stop-item` - Individual selectable stop item
- `.selectable-stop-item.selected` - Selected stop item (green highlight)
- `.selectable-stop-content` - Stop content wrapper
- `.selectable-stop-number` - Stop sequence number
- `.selectable-stop-name` - Stop name display
- `.selectable-stop-address` - Stop address display
- `.selected-stop-info` - Container for selected stop information
- `.selected-stop-header` - Header for selected stop info
- `.selected-stop-details` - Details of selected stop
- `.selected-stop-name-display` - Selected stop name display
- `.selected-stop-address-display` - Selected stop address display

### Methods

#### `displayStops(stops: Stop[]): void`
Displays all stops as selectable options. Maintains the current selection if re-displayed.

#### `onStopSelected(stopId: string): void`
Handles stop selection, updates visual feedback, and triggers callback.

#### `getSelectedStop(): string | null`
Returns the currently selected stop ID, or null if no stop is selected.

#### `clearSelection(): void`
Clears the current selection and removes visual feedback.

#### `clearStops(): void`
Clears the entire stops display and resets selection state.

### Requirements Satisfied

- **Requirement 2.1**: Display all available stops as selectable options
- **Requirement 2.2**: Mark selected stop as drop-off location when clicked
- **Requirement 2.3**: Provide visual feedback indicating the selection
- **Requirement 2.4**: Allow only one stop to be selected at a time
- **Requirement 2.5**: Update selection and clear previous selection when different stop is selected

### Testing

The component includes comprehensive unit tests covering:
- Constructor validation
- Empty state handling
- Single and multiple stop display
- Stop selection and visual feedback
- Single selection invariant
- Clear operations
- Edge cases (first stop, last stop, rapid selections)

Run tests with:
```bash
npm test -- src/frontend/components/StopSelector.test.ts
```

### Visual Design

- **Unselected stops**: Light gray background with blue border on hover
- **Selected stop**: Green background with white text
- **Selected stop info**: Green-tinted info box below the stop list
- **Hover effect**: Slight translation and border color change
- **Responsive**: Scrollable container for long stop lists


## BusTrackerDisplay Component

The `BusTrackerDisplay` component is responsible for showing real-time bus locations and stop-by-stop progress along routes.

### Features

- **Display Bus Locations**: Shows current GPS coordinates and timestamps for buses
- **Multiple Bus Support**: Displays multiple buses on the same route simultaneously
- **Stop Progress Tracking**: Shows which stops are completed, current, or upcoming for each bus
- **GPS Unavailable Handling**: Displays appropriate messages when GPS data is unavailable
- **Real-time Updates**: Updates bus locations and stop statuses as new data arrives
- **Visual Status Indicators**: Uses colors and icons to indicate stop completion status

### Usage

```typescript
import { BusTrackerDisplay } from './components/BusTrackerDisplay';

// Create a BusTrackerDisplay instance
const busTracker = new BusTrackerDisplay(
  'bus-tracker',  // ID of element to display bus tracking
  {
    onBusSelected: (busId) => {
      console.log('Bus selected:', busId);
      // Handle bus selection (optional)
    }
  }
);

// Set the stops for the route
const stops = await stateManager.loadStopsForRoute(routeId);
busTracker.setStops(stops);

// Display buses on the route
const buses = await stateManager.getBusLocations();
busTracker.displayBuses(buses);

// Update a single bus location
busTracker.updateBusLocation(busId, newLocation);

// Handle GPS unavailable
busTracker.showGPSUnavailable(busId);

// Clear all tracking data
busTracker.clear();
```

### HTML Structure Required

The BusTrackerDisplay component requires one HTML element:

```html
<!-- Bus tracker container -->
<div id="bus-tracker"></div>
```

### CSS Classes

The component generates the following CSS classes:

- `.buses-container` - Container for all bus cards
- `.bus-card` - Individual bus card
- `.bus-card-header` - Header section of bus card
- `.bus-title` - Bus ID title
- `.gps-unavailable` - GPS unavailable warning message
- `.bus-location-info` - Container for location information
- `.bus-coordinates` - GPS coordinates display
- `.bus-timestamp` - Last updated timestamp
- `.stop-progress-section` - Container for stop progress
- `.stop-progress-header` - Header for stop progress section
- `.stop-progress-list` - List of stops with progress
- `.stop-progress-item` - Individual stop item
- `.stop-progress-item.status-completed` - Completed stop (green)
- `.stop-progress-item.status-current` - Current stop (blue)
- `.stop-progress-item.status-upcoming` - Upcoming stop (gray)
- `.stop-progress-content` - Stop content wrapper
- `.stop-progress-number` - Stop sequence number
- `.stop-progress-name` - Stop name
- `.stop-status-indicator` - Status icon (✓, ●, ○)

### Methods

#### `displayBuses(buses: BusLocation[]): void`
Displays multiple buses on the route. Calculates stop statuses for each bus.

#### `updateBusLocation(busId: string, location: BusLocation): void`
Updates the location for a specific bus and recalculates stop statuses.

#### `setStops(stops: Stop[]): void`
Sets the stops for the route being tracked. Required for stop progress calculation.

#### `showGPSUnavailable(busId: string): void`
Marks a bus as having unavailable GPS and displays appropriate message.

#### `updateStopStatus(stopId: string, status: StopStatus): void`
Manually updates the status for a specific stop (for all buses).

#### `clear(): void`
Clears all bus tracking data and resets the display.

#### `getBusLocations(): BusLocation[]`
Returns array of all current bus locations.

#### `getStopStatusesForBus(busId: string): StopProgress[]`
Returns stop progress information for a specific bus.

### Stop Status Calculation

The component automatically calculates stop statuses based on bus GPS locations:

- **COMPLETED** (✓): Bus has passed this stop (green background)
- **CURRENT** (●): Bus is currently at this stop (blue background)
- **UPCOMING** (○): Bus has not reached this stop yet (gray background)

Status calculation uses the `calculateStopStatuses` function from `stopStatusCalculator.ts`, which:
- Uses the Haversine formula to calculate distances
- Applies a 100-meter proximity threshold to determine if bus is at a stop
- Considers stop sequence order to determine completed vs upcoming stops

### Requirements Satisfied

- **Requirement 3.2**: Display bus location on visual representation of route
- **Requirement 3.4**: Indicate when location tracking is unavailable
- **Requirement 3.5**: Display multiple buses on same route
- **Requirement 4.1**: Display all stops with completion status
- **Requirement 4.3**: Visually distinguish between completed, current, and upcoming stops

### Testing

The component includes comprehensive unit tests covering:
- Constructor validation
- Empty state handling
- Single and multiple bus display
- GPS coordinates and timestamp display
- GPS unavailable state handling
- Stop progress calculation and display
- Stop status updates on location changes
- Multiple buses with independent progress
- Clear functionality
- Edge cases (exact coordinates, stale timestamps, empty stops)
- Getter methods

Run tests with:
```bash
npm test -- src/frontend/components/BusTrackerDisplay.test.ts
```

### Visual Design

- **Bus Cards**: Light gray background with blue border on hover
- **GPS Unavailable**: Yellow warning box with alert icon
- **Completed Stops**: Green left border and light green background
- **Current Stop**: Blue left border and light blue background
- **Upcoming Stops**: Gray left border and white background
- **Status Icons**: 
  - ✓ (green) for completed
  - ● (blue) for current
  - ○ (gray) for upcoming
- **Responsive**: Scrollable container for multiple buses
- **Timestamps**: Human-readable "time ago" format (e.g., "2 minutes ago")

### Integration with State Manager

The BusTrackerDisplay component integrates with the StateManager for real-time updates:

```typescript
// Start tracking buses on a route
stateManager.startTrackingBuses(routeId);

// Update display when new bus locations arrive
stateManager.on('busLocationsUpdated', (buses) => {
  busTracker.displayBuses(buses);
});

// Stop tracking when user navigates away
stateManager.stopTrackingBuses();
```

### Performance Considerations

- Efficient DOM updates: Only re-renders when data changes
- Optimized stop status calculation: Caches results per bus
- Scrollable container: Handles large numbers of buses without layout issues
- Minimal re-calculations: Only recalculates statuses when locations change
