/**
 * Main Application Entry Point
 * Initializes and wires together all components of the Bus Tracking System
 */

import { StateManager } from './frontend/state/StateManager';
import { RouteViewer } from './frontend/components/RouteViewer';
import { StopSelector } from './frontend/components/StopSelector';
import { BusTrackerDisplay } from './frontend/components/BusTrackerDisplay';

/**
 * Main Application Class
 * Coordinates all components and manages the application lifecycle
 */
class BusTrackingApp {
  private stateManager: StateManager;
  private routeViewer: RouteViewer;
  private stopSelector: StopSelector;
  private busTrackerDisplay: BusTrackerDisplay;
  private pollingInterval: number = 10000; // 10 seconds (requirement: within 10 seconds)
  private errorDisplayElement: HTMLElement | null = null;

  constructor() {
    // Initialize State Manager with API base URL
    this.stateManager = new StateManager('/api');

    // Set up error handling callback
    this.stateManager.setErrorCallback((error, context) => {
      this.displayError(error.message, context);
    });

    // Initialize UI Components with callbacks
    this.routeViewer = new RouteViewer('route-list', 'route-stops', {
      onRouteSelected: (routeId) => this.handleRouteSelection(routeId)
    });

    this.stopSelector = new StopSelector('stop-selector', {
      onStopSelected: (stopId) => this.handleStopSelection(stopId)
    });

    this.busTrackerDisplay = new BusTrackerDisplay('bus-tracker', {
      onBusSelected: (busId) => this.handleBusSelection(busId)
    });

    // Create error display element
    this.createErrorDisplay();
  }

  /**
   * Initialize the application
   * Loads initial data and sets up the UI
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Bus Tracking System...');

      // Load all available routes
      const routes = await this.stateManager.loadRoutes();
      console.log(`Loaded ${routes.length} routes`);

      // Display routes in the UI
      this.routeViewer.displayRoutes(routes);

      // If there are routes, optionally auto-select the first one
      // (Commented out to let user select manually)
      // if (routes.length > 0) {
      //   await this.handleRouteSelection(routes[0].id);
      // }

      console.log('Bus Tracking System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.displayError('Failed to load routes. Please refresh the page.', 'initialization');
    }
  }

  /**
   * Handle route selection
   * Loads stops for the selected route and starts tracking buses
   */
  private async handleRouteSelection(routeId: string): Promise<void> {
    try {
      console.log(`Route selected: ${routeId}`);

      // Stop any existing tracking
      this.stateManager.stopTrackingBuses();
      this.stateManager.stopPolling();

      // Clear previous selections and displays
      this.stopSelector.clearSelection();
      this.busTrackerDisplay.clear();

      // Select the route in state manager (loads route details and stops)
      await this.stateManager.selectRoute(routeId);

      // Get the stops for the selected route
      const stops = this.stateManager.getStopsForCurrentRoute();
      console.log(`Loaded ${stops.length} stops for route ${routeId}`);

      // Display route stops in the route viewer
      this.routeViewer.displayRouteStops(routeId, stops);

      // Display stops in the stop selector
      this.stopSelector.displayStops(stops);

      // Set stops in bus tracker for status calculation
      this.busTrackerDisplay.setStops(stops);

      // Start tracking buses on this route
      this.stateManager.startTrackingBuses(routeId);

      // Start polling for real-time updates
      this.stateManager.startPolling(this.pollingInterval);

      // Initial bus location fetch and display
      await this.updateBusLocations();

      // Set up periodic updates
      this.startPeriodicUpdates();

      console.log(`Started tracking buses on route ${routeId}`);
    } catch (error) {
      console.error('Error handling route selection:', error);
      this.displayError('Failed to load route details. Please try again.', 'route selection');
    }
  }

  /**
   * Handle stop selection
   * Updates the state manager with the selected drop-off stop
   */
  private handleStopSelection(stopId: string): void {
    console.log(`Stop selected: ${stopId}`);

    // Update state manager with selected stop
    this.stateManager.selectDropOffStop(stopId);

    // Get the selected stop details
    const stop = this.stateManager.getStop(stopId);
    if (stop) {
      console.log(`Drop-off stop set to: ${stop.name} (${stop.address})`);
    }
  }

  /**
   * Handle bus selection (optional - for future enhancements)
   */
  private handleBusSelection(busId: string): void {
    console.log(`Bus selected: ${busId}`);
    // Future enhancement: could show detailed bus information
  }

  /**
   * Update bus locations from state manager and display them
   */
  private async updateBusLocations(): Promise<void> {
    try {
      // Get current bus locations from state manager
      const busLocations = this.stateManager.getBusLocations();

      if (busLocations.length === 0) {
        console.log('No active buses on this route');
        this.busTrackerDisplay.clear();
        return;
      }

      // Display buses in the tracker
      this.busTrackerDisplay.displayBuses(busLocations);

      console.log(`Updated ${busLocations.length} bus location(s)`);
    } catch (error) {
      console.error('Error updating bus locations:', error);
    }
  }

  /**
   * Start periodic updates for bus locations
   * Updates the UI every polling interval
   */
  private startPeriodicUpdates(): void {
    // Set up interval to update UI with latest bus locations
    setInterval(() => {
      if (this.stateManager.isTrackingBuses()) {
        this.updateBusLocations();
      }
    }, this.pollingInterval);
  }

  /**
   * Create error display element
   */
  private createErrorDisplay(): void {
    // Check if error display already exists
    let errorDisplay = document.getElementById('error-display');
    
    if (!errorDisplay) {
      // Create error display element
      errorDisplay = document.createElement('div');
      errorDisplay.id = 'error-display';
      errorDisplay.className = 'error-display hidden';
      
      // Insert at the top of the container
      const container = document.querySelector('.container');
      if (container) {
        container.insertBefore(errorDisplay, container.firstChild);
      }
    }

    this.errorDisplayElement = errorDisplay;
  }

  /**
   * Display an error message to the user
   */
  private displayError(message: string, context: string): void {
    console.error(`Error in ${context}: ${message}`);

    if (!this.errorDisplayElement) {
      return;
    }

    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
      <span class="error-icon">⚠️</span>
      <span class="error-text">${message}</span>
      <button class="error-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Clear previous errors and add new one
    this.errorDisplayElement.innerHTML = '';
    this.errorDisplayElement.appendChild(errorMessage);
    this.errorDisplayElement.classList.remove('hidden');

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (this.errorDisplayElement) {
        this.errorDisplayElement.classList.add('hidden');
      }
    }, 10000);
  }

  /**
   * Clean up resources when the application is closed
   */
  cleanup(): void {
    console.log('Cleaning up Bus Tracking System...');
    this.stateManager.stopTrackingBuses();
    this.stateManager.stopPolling();
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing application...');
  
  const app = new BusTrackingApp();
  app.initialize().catch(error => {
    console.error('Failed to initialize application:', error);
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    app.cleanup();
  });
});
