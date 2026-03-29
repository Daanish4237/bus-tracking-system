/**
 * Application State Manager
 * Manages application state and coordinates between components
 * Handles route management, stop selection, and bus tracking
 */

import { Route, Stop, BusLocation } from '../../shared/types';

export interface ErrorCallback {
  (error: Error, context: string): void;
}

export class StateManager {
  private currentRoute: Route | null = null;
  private routes: Route[] = [];
  private stops: Map<string, Stop> = new Map();
  private selectedDropOffStopId: string | null = null;
  private busLocations: BusLocation[] = [];
  private pollingIntervalId: number | null = null;
  private isTracking: boolean = false;
  private apiBaseUrl: string;
  private errorCallback: ErrorCallback | null = null;
  private lastSuccessfulData: {
    routes?: { data: Route[], timestamp: Date },
    busLocations?: { data: BusLocation[], timestamp: Date }
  } = {};

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Set error callback for handling errors
   * @param callback - Function to call when errors occur
   */
  setErrorCallback(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  /**
   * Handle errors with user-friendly messages and optional retry
   * @param error - The error that occurred
   * @param context - Context of where the error occurred
   */
  private handleError(error: any, context: string): void {
    let userMessage: string;

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network error
      userMessage = 'Unable to connect. Please check your internet connection.';
    } else if (error.status >= 500) {
      // Server error
      userMessage = 'Service temporarily unavailable. Please try again in a moment.';
    } else if (error.status === 404) {
      // Not found error
      userMessage = error.userMessage || 'The requested resource was not found.';
    } else if (error.status === 400) {
      // Validation error
      userMessage = error.userMessage || 'Invalid request. Please check your input.';
    } else {
      // Generic error
      userMessage = 'An error occurred. Please try again.';
    }

    const errorObj = new Error(userMessage);
    (errorObj as any).originalError = error;
    (errorObj as any).context = context;

    console.error(`Error in ${context}:`, error);

    if (this.errorCallback) {
      this.errorCallback(errorObj, context);
    }
  }

  /**
   * Retry a fetch operation with exponential backoff
   * @param fetchFn - Function that returns a Promise
   * @param maxRetries - Maximum number of retries (default: 3)
   * @param initialDelay - Initial delay in milliseconds (default: 1000)
   * @returns Promise resolving to the fetch result
   */
  private async retryWithBackoff<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on 404 or 400 errors (permanent errors)
        if (error.status === 404 || error.status === 400) {
          throw error;
        }

        // Don't retry if this was the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // ============================================================================
  // Route State Management
  // ============================================================================

  /**
   * Load all available routes from the API
   * @returns Promise resolving to array of routes
   */
  async loadRoutes(): Promise<Route[]> {
    try {
      const routes = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.apiBaseUrl}/routes`);
        
        if (!response.ok) {
          const error: any = new Error(`Failed to load routes: ${response.status} ${response.statusText}`);
          error.status = response.status;
          error.userMessage = 'Unable to load routes. Please try again.';
          throw error;
        }

        const data = await response.json();
        
        // Convert date strings to Date objects
        return data.map((route: any) => ({
          ...route,
          createdAt: new Date(route.createdAt),
          updatedAt: new Date(route.updatedAt)
        }));
      });

      // Cache successful data
      this.routes = routes;
      this.lastSuccessfulData.routes = {
        data: routes,
        timestamp: new Date()
      };

      return this.routes;
    } catch (error) {
      this.handleError(error, 'loadRoutes');
      
      // Return cached data if available
      if (this.lastSuccessfulData.routes) {
        console.log('Returning cached routes data');
        return this.lastSuccessfulData.routes.data;
      }
      
      throw error;
    }
  }

  /**
   * Select a route and load its stops
   * @param routeId - ID of the route to select
   */
  async selectRoute(routeId: string): Promise<void> {
    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.apiBaseUrl}/routes/${routeId}`);
        
        if (!response.ok) {
          const error: any = new Error(`Failed to load route: ${response.status} ${response.statusText}`);
          error.status = response.status;
          
          if (response.status === 404) {
            error.userMessage = 'Route not found. Please select a different route.';
          } else {
            error.userMessage = 'Unable to load route details. Please try again.';
          }
          
          throw error;
        }

        return await response.json();
      });
      
      // Convert date strings to Date objects
      this.currentRoute = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };

      // Load stops for this route
      if (data.stops && Array.isArray(data.stops)) {
        // Store stops in the map
        data.stops.forEach((stop: any) => {
          const stopWithDates = {
            ...stop,
            createdAt: new Date(stop.createdAt),
            updatedAt: new Date(stop.updatedAt)
          };
          this.stops.set(stop.id, stopWithDates);
        });
      }

      // Clear previous selection when switching routes
      this.selectedDropOffStopId = null;
    } catch (error) {
      this.handleError(error, 'selectRoute');
      throw error;
    }
  }

  /**
   * Get the currently selected route
   * @returns Current route or null if none selected
   */
  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  /**
   * Get all loaded routes
   * @returns Array of all routes
   */
  getRoutes(): Route[] {
    return this.routes;
  }

  // ============================================================================
  // Stop State Management
  // ============================================================================

  /**
   * Load stops for a specific route
   * @param routeId - ID of the route
   * @returns Promise resolving to array of stops in sequential order
   */
  async loadStopsForRoute(routeId: string): Promise<Stop[]> {
    try {
      const data = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.apiBaseUrl}/routes/${routeId}`);
        
        if (!response.ok) {
          const error: any = new Error(`Failed to load stops: ${response.status} ${response.statusText}`);
          error.status = response.status;
          
          if (response.status === 404) {
            error.userMessage = 'Route not found. Please select a different route.';
          } else {
            error.userMessage = 'Unable to load stop information. Please try again.';
          }
          
          throw error;
        }

        return await response.json();
      });
      
      if (!data.stops || !Array.isArray(data.stops)) {
        return [];
      }

      // Convert date strings to Date objects and store in map
      const stops = data.stops.map((stop: any) => {
        const stopWithDates = {
          ...stop,
          createdAt: new Date(stop.createdAt),
          updatedAt: new Date(stop.updatedAt)
        };
        this.stops.set(stop.id, stopWithDates);
        return stopWithDates;
      });

      return stops;
    } catch (error) {
      this.handleError(error, 'loadStopsForRoute');
      throw error;
    }
  }

  /**
   * Select a drop-off stop
   * Maintains single selection invariant - only one stop can be selected at a time
   * @param stopId - ID of the stop to select
   */
  selectDropOffStop(stopId: string): void {
    // Verify the stop exists in our loaded stops
    if (!this.stops.has(stopId)) {
      console.warn(`Stop ${stopId} not found in loaded stops`);
      return;
    }

    // Update selection (automatically clears previous selection)
    this.selectedDropOffStopId = stopId;
  }

  /**
   * Get the currently selected drop-off stop ID
   * @returns Selected stop ID or null if none selected
   */
  getSelectedDropOffStop(): string | null {
    return this.selectedDropOffStopId;
  }

  /**
   * Clear the drop-off stop selection
   */
  clearDropOffSelection(): void {
    this.selectedDropOffStopId = null;
  }

  /**
   * Get a stop by ID
   * @param stopId - ID of the stop
   * @returns Stop object or undefined if not found
   */
  getStop(stopId: string): Stop | undefined {
    return this.stops.get(stopId);
  }

  /**
   * Get all stops for the current route in sequential order
   * @returns Array of stops or empty array if no route selected
   */
  getStopsForCurrentRoute(): Stop[] {
    if (!this.currentRoute) {
      return [];
    }

    // Return stops in the order defined by the route's stopIds
    return this.currentRoute.stopIds
      .map(stopId => this.stops.get(stopId))
      .filter((stop): stop is Stop => stop !== undefined);
  }

  // ============================================================================
  // Bus Tracking State Management
  // ============================================================================

  /**
   * Start tracking buses on a route
   * Begins polling for GPS location updates
   * @param routeId - ID of the route to track
   */
  startTrackingBuses(routeId: string): void {
    if (this.isTracking) {
      console.warn('Already tracking buses. Stop tracking before starting again.');
      return;
    }

    this.isTracking = true;
    
    // Immediately fetch bus locations
    this.fetchBusLocations(routeId).catch(error => {
      console.error('Error fetching initial bus locations:', error);
    });
  }

  /**
   * Stop tracking buses
   * Stops polling for GPS location updates
   */
  stopTrackingBuses(): void {
    this.isTracking = false;
    
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    // Clear bus locations
    this.busLocations = [];
  }

  /**
   * Get current bus locations
   * @returns Array of bus locations
   */
  getBusLocations(): BusLocation[] {
    return this.busLocations;
  }

  /**
   * Fetch bus locations from the API
   * @param routeId - ID of the route
   */
  private async fetchBusLocations(routeId: string): Promise<void> {
    try {
      const locations = await this.retryWithBackoff(async () => {
        const response = await fetch(`${this.apiBaseUrl}/buses/locations?routeId=${routeId}`);
        
        if (!response.ok) {
          const error: any = new Error(`Failed to fetch bus locations: ${response.status} ${response.statusText}`);
          error.status = response.status;
          
          if (response.status === 404) {
            error.userMessage = 'Route not found.';
          } else {
            error.userMessage = 'Unable to fetch bus locations. Retrying...';
          }
          
          throw error;
        }

        const data = await response.json();
        
        // Convert timestamp strings to Date objects and validate GPS data
        return data.map((location: any) => ({
          ...location,
          timestamp: new Date(location.timestamp)
        })).filter((location: BusLocation) => {
          // Validate GPS coordinates
          if (!this.isValidGPSCoordinate(location.latitude, location.longitude)) {
            console.warn(`Invalid GPS coordinates for bus ${location.busId}: ${location.latitude}, ${location.longitude}`);
            return false;
          }
          
          // Check for stale data (older than 5 minutes)
          const age = Date.now() - location.timestamp.getTime();
          const fiveMinutes = 5 * 60 * 1000;
          if (age > fiveMinutes) {
            console.warn(`Stale GPS data for bus ${location.busId}: ${Math.floor(age / 1000)}s old`);
            // Still include stale data but mark it
            (location as any).isStale = true;
          }
          
          return true;
        });
      });

      // Cache successful data
      this.busLocations = locations;
      this.lastSuccessfulData.busLocations = {
        data: locations,
        timestamp: new Date()
      };
    } catch (error) {
      this.handleError(error, 'fetchBusLocations');
      
      // Use cached data if available
      if (this.lastSuccessfulData.busLocations) {
        console.log('Using cached bus location data');
        this.busLocations = this.lastSuccessfulData.busLocations.data;
      }
      
      // Don't throw - allow the app to continue with cached or empty data
    }
  }

  /**
   * Validate GPS coordinates
   * @param latitude - Latitude value
   * @param longitude - Longitude value
   * @returns True if coordinates are valid
   */
  private isValidGPSCoordinate(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  // ============================================================================
  // Polling Management
  // ============================================================================

  /**
   * Start polling for updates at a specified interval
   * @param intervalMs - Polling interval in milliseconds
   */
  startPolling(intervalMs: number): void {
    if (this.pollingIntervalId !== null) {
      console.warn('Polling already started');
      return;
    }

    if (!this.currentRoute) {
      console.warn('No route selected. Cannot start polling.');
      return;
    }

    const routeId = this.currentRoute.id;

    this.pollingIntervalId = window.setInterval(() => {
      if (this.isTracking) {
        this.fetchBusLocations(routeId).catch(error => {
          console.error('Error polling bus locations:', error);
        });
      }
    }, intervalMs);
  }

  /**
   * Stop polling for updates
   */
  stopPolling(): void {
    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  /**
   * Check if currently tracking buses
   * @returns True if tracking is active
   */
  isTrackingBuses(): boolean {
    return this.isTracking;
  }

  /**
   * Get the timestamp of the last successful data fetch
   * @param dataType - Type of data ('routes' or 'busLocations')
   * @returns Date of last successful fetch or null
   */
  getLastUpdateTimestamp(dataType: 'routes' | 'busLocations'): Date | null {
    return this.lastSuccessfulData[dataType]?.timestamp || null;
  }
}
