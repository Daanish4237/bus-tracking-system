/**
 * Bus Tracker Display Component
 * Shows real-time bus locations and stop-by-stop progress
 * Handles multiple buses on the same route and GPS unavailable states
 */

import { BusLocation, Stop, StopStatus, StopProgress } from '../../shared/types';
import { calculateStopStatuses } from '../../shared/stopStatusCalculator';

export interface BusTrackerDisplayCallbacks {
  onBusSelected?: (busId: string) => void;
}

export class BusTrackerDisplay {
  private containerElement: HTMLElement;
  private currentBuses: Map<string, BusLocation> = new Map();
  private currentStops: Stop[] = [];
  private stopStatuses: Map<string, Map<string, StopStatus>> = new Map(); // busId -> stopId -> status
  private gpsUnavailableBuses: Set<string> = new Set();
  private staleBuses: Set<string> = new Set(); // Buses with stale GPS data
  private offRouteBuses: Set<string> = new Set(); // Buses that appear off-route

  /**
   * Create a new BusTrackerDisplay instance
   * @param containerElementId - ID of the HTML element to display bus tracking
   * @param callbacks - Callback functions for bus interactions
   */
  constructor(
    containerElementId: string,
    _callbacks: BusTrackerDisplayCallbacks = {}
  ) {
    const containerEl = document.getElementById(containerElementId);

    if (!containerEl) {
      throw new Error(`Element with id "${containerElementId}" not found`);
    }

    this.containerElement = containerEl;
  }

  /**
   * Update bus location on route
   * @param busId - ID of the bus
   * @param location - GPS coordinates of the bus
   */
  updateBusLocation(busId: string, location: BusLocation): void {
    // Store the bus location
    this.currentBuses.set(busId, location);

    // Remove from GPS unavailable set if it was there
    this.gpsUnavailableBuses.delete(busId);

    // Check for stale data (older than 5 minutes)
    const age = Date.now() - location.timestamp.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    if (age > fiveMinutes) {
      this.staleBuses.add(busId);
    } else {
      this.staleBuses.delete(busId);
    }

    // Check if bus appears off-route (more than 500m from any stop)
    if (this.currentStops.length > 0) {
      const isNearAnyStop = this.currentStops.some(stop => {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          stop.latitude,
          stop.longitude
        );
        return distance <= 500; // 500 meters threshold
      });

      if (!isNearAnyStop) {
        this.offRouteBuses.add(busId);
      } else {
        this.offRouteBuses.delete(busId);
      }
    }

    // Calculate stop statuses for this bus if we have stops
    if (this.currentStops.length > 0) {
      const statuses = calculateStopStatuses(location, this.currentStops);
      const statusMap = new Map<string, StopStatus>();
      statuses.forEach(progress => {
        statusMap.set(progress.stopId, progress.status);
      });
      this.stopStatuses.set(busId, statusMap);
    }

    // Re-render the display
    this.render();
  }

  /**
   * Display multiple buses on same route
   * @param buses - Array of bus locations
   */
  displayBuses(buses: BusLocation[]): void {
    // Clear current buses
    this.currentBuses.clear();
    this.stopStatuses.clear();

    // Store all bus locations
    buses.forEach(bus => {
      this.currentBuses.set(bus.busId, bus);

      // Check for stale data
      const age = Date.now() - bus.timestamp.getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (age > fiveMinutes) {
        this.staleBuses.add(bus.busId);
      } else {
        this.staleBuses.delete(bus.busId);
      }

      // Check if bus appears off-route
      if (this.currentStops.length > 0) {
        const isNearAnyStop = this.currentStops.some(stop => {
          const distance = this.calculateDistance(
            bus.latitude,
            bus.longitude,
            stop.latitude,
            stop.longitude
          );
          return distance <= 500;
        });

        if (!isNearAnyStop) {
          this.offRouteBuses.add(bus.busId);
        } else {
          this.offRouteBuses.delete(bus.busId);
        }
      }

      // Calculate stop statuses for each bus if we have stops
      if (this.currentStops.length > 0) {
        const statuses = calculateStopStatuses(bus, this.currentStops);
        const statusMap = new Map<string, StopStatus>();
        statuses.forEach(progress => {
          statusMap.set(progress.stopId, progress.status);
        });
        this.stopStatuses.set(bus.busId, statusMap);
      }
    });

    // Render the display
    this.render();
  }

  /**
   * Update stop status for a specific stop
   * @param stopId - ID of the stop
   * @param status - New status for the stop
   */
  updateStopStatus(stopId: string, status: StopStatus): void {
    // This method is for manual status updates
    // In practice, statuses are calculated automatically from bus locations
    // But we provide this for flexibility

    // Update status for all buses
    this.currentBuses.forEach((_, busId) => {
      if (!this.stopStatuses.has(busId)) {
        this.stopStatuses.set(busId, new Map());
      }
      this.stopStatuses.get(busId)!.set(stopId, status);
    });

    // Re-render
    this.render();
  }

  /**
   * Handle GPS unavailable state for a bus
   * @param busId - ID of the bus with unavailable GPS
   */
  showGPSUnavailable(busId: string): void {
    // Mark bus as having unavailable GPS
    this.gpsUnavailableBuses.add(busId);

    // Ensure the bus appears in currentBuses so the card is rendered
    if (!this.currentBuses.has(busId)) {
      // Create a placeholder entry so the unavailable card is shown
      this.currentBuses.set(busId, {
        busId,
        routeId: '',
        latitude: 0,
        longitude: 0,
        timestamp: new Date(),
      });
    }

    // Re-render to show the unavailable state
    this.render();
  }

  /**
   * Set the stops for the route being tracked
   * This is needed to calculate stop statuses
   * @param stops - Array of stops in sequential order
   */
  setStops(stops: Stop[]): void {
    this.currentStops = stops;

    // Recalculate stop statuses for all buses
    this.currentBuses.forEach((location, busId) => {
      const statuses = calculateStopStatuses(location, this.currentStops);
      const statusMap = new Map<string, StopStatus>();
      statuses.forEach(progress => {
        statusMap.set(progress.stopId, progress.status);
      });
      this.stopStatuses.set(busId, statusMap);
    });

    // Re-render
    this.render();
  }

  /**
   * Clear all bus tracking data
   */
  clear(): void {
    this.currentBuses.clear();
    this.currentStops = [];
    this.stopStatuses.clear();
    this.gpsUnavailableBuses.clear();
    this.staleBuses.clear();
    this.offRouteBuses.clear();
    this.containerElement.innerHTML = '';
  }

  /**
   * Render the bus tracking display
   */
  private render(): void {
    // Clear existing content
    this.containerElement.innerHTML = '';

    // If no buses, show message
    if (this.currentBuses.size === 0) {
      this.containerElement.innerHTML = '<p class="no-buses">No active buses on this route</p>';
      return;
    }

    // Create container for all buses
    const busesContainer = document.createElement('div');
    busesContainer.className = 'buses-container';

    // Render each bus
    this.currentBuses.forEach((location, busId) => {
      const busCard = this.createBusCard(busId, location);
      busesContainer.appendChild(busCard);
    });

    this.containerElement.appendChild(busesContainer);
  }

  /**
   * Create a card displaying bus information
   * @param busId - ID of the bus
   * @param location - GPS location of the bus
   * @returns HTML element for the bus card
   */
  private createBusCard(busId: string, location: BusLocation): HTMLElement {
    const card = document.createElement('div');
    card.className = 'bus-card';
    card.dataset.busId = busId;

    // Bus header
    const header = document.createElement('div');
    header.className = 'bus-card-header';

    const busTitle = document.createElement('h3');
    busTitle.className = 'bus-title';
    busTitle.textContent = `Bus ${busId}`;

    header.appendChild(busTitle);

    // Check if GPS is unavailable
    if (this.gpsUnavailableBuses.has(busId)) {
      const unavailableMsg = document.createElement('div');
      unavailableMsg.className = 'gps-unavailable';
      unavailableMsg.textContent = '⚠️ Location unavailable';
      header.appendChild(unavailableMsg);
      card.appendChild(header);
      return card;
    }

    // GPS location info
    const locationInfo = document.createElement('div');
    locationInfo.className = 'bus-location-info';

    const coordsText = document.createElement('p');
    coordsText.className = 'bus-coordinates';
    coordsText.innerHTML = `<strong>Location:</strong> ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;

    const timestampText = document.createElement('p');
    timestampText.className = 'bus-timestamp';
    const timeAgo = this.formatTimeAgo(location.timestamp);
    timestampText.innerHTML = `<strong>Last updated:</strong> ${timeAgo}`;

    locationInfo.appendChild(coordsText);
    locationInfo.appendChild(timestampText);

    // Add warnings for stale data or off-route
    const warnings = document.createElement('div');
    warnings.className = 'bus-warnings';

    if (this.staleBuses.has(busId)) {
      const staleWarning = document.createElement('div');
      staleWarning.className = 'warning stale-data-warning';
      staleWarning.innerHTML = '⚠️ <strong>Warning:</strong> GPS data may be outdated';
      warnings.appendChild(staleWarning);
    }

    if (this.offRouteBuses.has(busId)) {
      const offRouteWarning = document.createElement('div');
      offRouteWarning.className = 'warning off-route-warning';
      offRouteWarning.innerHTML = '⚠️ <strong>Warning:</strong> Bus location may be inaccurate (appears off-route)';
      warnings.appendChild(offRouteWarning);
    }

    if (warnings.children.length > 0) {
      locationInfo.appendChild(warnings);
    }

    header.appendChild(locationInfo);
    card.appendChild(header);

    // Stop progress section
    if (this.currentStops.length > 0 && this.stopStatuses.has(busId)) {
      const progressSection = this.createStopProgressSection(busId);
      card.appendChild(progressSection);
    }

    return card;
  }

  /**
   * Create stop progress section showing completed/current/upcoming stops
   * @param busId - ID of the bus
   * @returns HTML element for stop progress
   */
  private createStopProgressSection(busId: string): HTMLElement {
    const section = document.createElement('div');
    section.className = 'stop-progress-section';

    const header = document.createElement('h4');
    header.className = 'stop-progress-header';
    header.textContent = 'Stop Progress';
    section.appendChild(header);

    const stopsList = document.createElement('ul');
    stopsList.className = 'stop-progress-list';

    const statusMap = this.stopStatuses.get(busId);
    if (!statusMap) {
      return section;
    }

    this.currentStops.forEach((stop, index) => {
      const status = statusMap.get(stop.id) || StopStatus.UPCOMING;

      const stopItem = document.createElement('li');
      stopItem.className = `stop-progress-item status-${status}`;
      stopItem.dataset.stopId = stop.id;
      stopItem.dataset.status = status;

      // Stop number and name
      const stopContent = document.createElement('div');
      stopContent.className = 'stop-progress-content';

      const stopNumber = document.createElement('span');
      stopNumber.className = 'stop-progress-number';
      stopNumber.textContent = `${index + 1}.`;

      const stopName = document.createElement('span');
      stopName.className = 'stop-progress-name';
      stopName.textContent = stop.name;

      // Status indicator
      const statusIndicator = document.createElement('span');
      statusIndicator.className = 'stop-status-indicator';
      statusIndicator.textContent = this.getStatusIcon(status);
      statusIndicator.title = status;

      stopContent.appendChild(stopNumber);
      stopContent.appendChild(stopName);
      stopContent.appendChild(statusIndicator);

      stopItem.appendChild(stopContent);
      stopsList.appendChild(stopItem);
    });

    section.appendChild(stopsList);
    return section;
  }

  /**
   * Get icon for stop status
   * @param status - Stop status
   * @returns Icon string
   */
  private getStatusIcon(status: StopStatus): string {
    switch (status) {
      case StopStatus.COMPLETED:
        return '✓';
      case StopStatus.CURRENT:
        return '●';
      case StopStatus.UPCOMING:
        return '○';
      default:
        return '?';
    }
  }

  /**
   * Format timestamp as time ago
   * @param timestamp - Date to format
   * @returns Formatted string
   */
  private formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) {
      return 'just now';
    } else if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diffSec / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Get all current bus locations
   * @returns Array of bus locations
   */
  getBusLocations(): BusLocation[] {
    return Array.from(this.currentBuses.values());
  }

  /**
   * Get stop statuses for a specific bus
   * @param busId - ID of the bus
   * @returns Array of stop progress objects
   */
  getStopStatusesForBus(busId: string): StopProgress[] {
    const location = this.currentBuses.get(busId);
    if (!location || this.currentStops.length === 0) {
      return [];
    }

    return calculateStopStatuses(location, this.currentStops);
  }
}
