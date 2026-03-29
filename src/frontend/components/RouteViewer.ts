/**
 * Route Viewer Component
 * Displays available routes and their stop sequences
 * Handles route selection and updates the UI accordingly
 */

import { Route, Stop } from '../../shared/types';

export interface RouteViewerCallbacks {
  onRouteSelected?: (routeId: string) => void;
}

export class RouteViewer {
  private routeListElement: HTMLElement;
  private routeStopsElement: HTMLElement;
  private callbacks: RouteViewerCallbacks;
  private selectedRouteId: string | null = null;

  /**
   * Create a new RouteViewer instance
   * @param routeListElementId - ID of the HTML element to display route list
   * @param routeStopsElementId - ID of the HTML element to display route stops
   * @param callbacks - Callback functions for route selection
   */
  constructor(
    routeListElementId: string,
    routeStopsElementId: string,
    callbacks: RouteViewerCallbacks = {}
  ) {
    const routeListEl = document.getElementById(routeListElementId);
    const routeStopsEl = document.getElementById(routeStopsElementId);

    if (!routeListEl) {
      throw new Error(`Element with id "${routeListElementId}" not found`);
    }
    if (!routeStopsEl) {
      throw new Error(`Element with id "${routeStopsElementId}" not found`);
    }

    this.routeListElement = routeListEl;
    this.routeStopsElement = routeStopsEl;
    this.callbacks = callbacks;
  }

  /**
   * Display all available routes
   * @param routes - Array of routes to display
   */
  displayRoutes(routes: Route[]): void {
    // Clear existing content
    this.routeListElement.innerHTML = '';

    if (routes.length === 0) {
      this.routeListElement.innerHTML = '<p class="no-routes">No routes available</p>';
      return;
    }

    // Create route list
    const routeList = document.createElement('ul');
    routeList.className = 'route-list';

    routes.forEach(route => {
      const routeItem = document.createElement('li');
      routeItem.className = 'route-item';
      routeItem.dataset.routeId = route.id;

      // Add selected class if this is the selected route
      if (this.selectedRouteId === route.id) {
        routeItem.classList.add('selected');
      }

      // Create route content with ID and name
      const routeContent = document.createElement('div');
      routeContent.className = 'route-content';

      const routeId = document.createElement('span');
      routeId.className = 'route-id';
      routeId.textContent = route.id;

      const routeName = document.createElement('span');
      routeName.className = 'route-name';
      routeName.textContent = route.name;

      routeContent.appendChild(routeId);
      routeContent.appendChild(routeName);
      routeItem.appendChild(routeContent);

      // Add click handler
      routeItem.addEventListener('click', () => {
        this.onRouteSelected(route.id);
      });

      routeList.appendChild(routeItem);
    });

    this.routeListElement.appendChild(routeList);
  }

  /**
   * Display stops for a selected route in sequential order
   * @param routeId - ID of the route
   * @param stops - Array of stops in sequential order
   */
  displayRouteStops(routeId: string, stops: Stop[]): void {
    // Clear existing content
    this.routeStopsElement.innerHTML = '';

    if (stops.length === 0) {
      this.routeStopsElement.innerHTML = '<p class="no-stops">No stops available for this route</p>';
      return;
    }

    // Create header
    const header = document.createElement('h3');
    header.className = 'route-stops-header';
    header.textContent = `Stops for Route ${routeId}`;
    this.routeStopsElement.appendChild(header);

    // Create stops list
    const stopsList = document.createElement('ol');
    stopsList.className = 'stops-list';

    stops.forEach((stop, index) => {
      const stopItem = document.createElement('li');
      stopItem.className = 'stop-item';
      stopItem.dataset.stopId = stop.id;

      // Create stop content
      const stopContent = document.createElement('div');
      stopContent.className = 'stop-content';

      const stopNumber = document.createElement('span');
      stopNumber.className = 'stop-number';
      stopNumber.textContent = `${index + 1}.`;

      const stopName = document.createElement('span');
      stopName.className = 'stop-name';
      stopName.textContent = stop.name;

      const stopAddress = document.createElement('span');
      stopAddress.className = 'stop-address';
      stopAddress.textContent = stop.address;

      stopContent.appendChild(stopNumber);
      stopContent.appendChild(stopName);
      stopContent.appendChild(stopAddress);
      stopItem.appendChild(stopContent);

      stopsList.appendChild(stopItem);
    });

    this.routeStopsElement.appendChild(stopsList);
  }

  /**
   * Handle route selection
   * @param routeId - ID of the selected route
   */
  onRouteSelected(routeId: string): void {
    // Update selected route ID
    this.selectedRouteId = routeId;

    // Update visual selection in the route list
    const routeItems = this.routeListElement.querySelectorAll('.route-item');
    routeItems.forEach(item => {
      if (item instanceof HTMLElement && item.dataset.routeId === routeId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    // Call callback if provided
    if (this.callbacks.onRouteSelected) {
      this.callbacks.onRouteSelected(routeId);
    }
  }

  /**
   * Get the currently selected route ID
   * @returns Selected route ID or null if none selected
   */
  getSelectedRouteId(): string | null {
    return this.selectedRouteId;
  }

  /**
   * Clear the route stops display
   */
  clearRouteStops(): void {
    this.routeStopsElement.innerHTML = '';
  }

  /**
   * Clear the route list display
   */
  clearRouteList(): void {
    this.routeListElement.innerHTML = '';
    this.selectedRouteId = null;
  }
}
