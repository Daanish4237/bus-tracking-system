# Bus Tracking System

A real-time bus tracking system for passengers that displays bus routes, allows stop selection, and shows live GPS locations of buses.

## Features

- **View Bus Routes**: Display all available bus routes with complete stop sequences
- **Select Drop-off Stop**: Choose your desired drop-off location from the route
- **Real-time Bus Tracking**: See live GPS locations of buses on your selected route
- **Stop-by-Stop Progress**: Track which stops the bus has completed and which are upcoming
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error handling with user-friendly messages and automatic retry

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

The application consists of two parts: a backend API server and a frontend web interface.

#### Start the Backend Server

In one terminal, run:
```bash
npm run backend:dev
```

This starts the Express API server on `http://localhost:3000`.

#### Start the Frontend Development Server

In another terminal, run:
```bash
npm run dev
```

This starts the Vite development server. Open your browser to the URL shown (typically `http://localhost:5173`).

### Building for Production

Build both frontend and backend:
```bash
npm run build
```

This creates:
- `dist/frontend/` - Frontend static files
- `dist/backend/` - Compiled backend JavaScript

### Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with UI:
```bash
npm run test:ui
```

## Usage

1. **Select a Route**: Click on a route from the "Available Routes" list
2. **View Stops**: See all stops for the selected route in sequential order
3. **Select Drop-off Stop**: Click on your desired drop-off stop from the "Select Your Drop-off Stop" section
4. **Track Buses**: View real-time bus locations and progress in the "Live Bus Tracking" section

The system automatically updates bus locations every 10 seconds to provide real-time tracking.

## Architecture

### Frontend Components

- **RouteViewer**: Displays available routes and their stop sequences
- **StopSelector**: Allows passengers to select their drop-off stop
- **BusTrackerDisplay**: Shows real-time bus locations and stop progress
- **StateManager**: Manages application state and coordinates between components

### Backend API

- **Route API**: Endpoints for retrieving route information
- **Stop API**: Endpoints for retrieving stop information
- **GPS Tracking API**: Endpoints for bus location data

### Data Models

- **Route**: Bus route with ordered list of stops
- **Stop**: Bus stop with GPS coordinates
- **BusLocation**: Real-time GPS location of a bus

## Sample Data

The system comes pre-loaded with sample data:

- **Route 101 - Downtown Express**: 5 stops from Central Station to Battery Park
- **Route 202 - Uptown Local**: 6 stops from Grand Central to Fort Tryon Park
- **Route 303 - Crosstown Shuttle**: 5 stops from West Side Terminal to East Side Plaza

Sample buses are active on each route for testing.

## Technology Stack

- **Frontend**: TypeScript, Vite, Vanilla JavaScript
- **Backend**: Node.js, Express, TypeScript
- **Testing**: Vitest, fast-check (property-based testing)
- **Build Tools**: TypeScript Compiler, Vite

## Project Structure

```
bus-tracking-system/
├── src/
│   ├── frontend/
│   │   ├── components/     # UI components
│   │   └── state/          # State management
│   ├── backend/
│   │   ├── api/            # API endpoints
│   │   └── data/           # Data storage
│   └── shared/
│       ├── types.ts        # Shared TypeScript types
│       ├── geoUtils.ts     # GPS calculations
│       └── stopStatusCalculator.ts  # Stop progress logic
├── system.html             # Main HTML file
├── styles.css              # Application styles
└── README.md               # This file
```

## Requirements Validation

This system validates all requirements specified in the design document:

- ✅ Requirement 1: View Bus Routes
- ✅ Requirement 2: Select Drop-off Stop
- ✅ Requirement 3: Display Real-time Bus Location
- ✅ Requirement 4: Show Stop-by-Stop Progress
- ✅ Requirement 5: Route and Stop Data Management
- ✅ Requirement 6: User Interface Responsiveness
- ✅ Requirement 7: GPS Data Accuracy

## Author

Daanish
