/**
 * Main Application Entry Point
 */

import { StateManager } from './frontend/state/StateManager';
import { RouteViewer } from './frontend/components/RouteViewer';
import { StopSelector } from './frontend/components/StopSelector';
import { BusTrackerDisplay } from './frontend/components/BusTrackerDisplay';
import { MapManager } from './frontend/map/MapManager';
import { GPSTracker } from './frontend/gps/GPSTracker';
import { NextStopBanner } from './frontend/ui/NextStopBanner';
import { Stop } from './shared/types';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class BusTrackingApp {
  private stateManager = new StateManager('/api');
  private routeViewer: RouteViewer;
  private stopSelector: StopSelector;
  private busTrackerDisplay: BusTrackerDisplay;
  private mapManager = new MapManager();
  private gpsTracker = new GPSTracker();
  private banner = new NextStopBanner();

  private currentStops: Stop[] = [];
  private currentRouteId = '';
  private currentStopIndex = 0; // tracks progress along the route
  private pollingInterval = 5000;
  private errorEl: HTMLElement | null = null;

  constructor() {
    this.stateManager.setErrorCallback((err, ctx) => this.showError(err.message, ctx));

    this.routeViewer = new RouteViewer('route-list', 'route-stops', {
      onRouteSelected: (id) => this.handleRouteSelection(id)
    });

    this.stopSelector = new StopSelector('stop-selector', {
      onStopSelected: (id) => this.handleStopSelection(id)
    });

    this.busTrackerDisplay = new BusTrackerDisplay('bus-tracker', { onBusSelected: () => {} });

    this.createErrorEl();
  }

  async initialize(): Promise<void> {
    try {
      const routes = await this.stateManager.loadRoutes();
      this.routeViewer.displayRoutes(routes);
      this.mapManager.init();
      this.startGPS();
    } catch {
      this.showError('Failed to load routes. Please refresh the page.', 'init');
    }
  }

  // ─── Route Selection ──────────────────────────────────────────────────────

  private async handleRouteSelection(routeId: string): Promise<void> {
    try {
      this.stateManager.stopTrackingBuses();
      this.stateManager.stopPolling();
      this.stopSelector.clearSelection();
      this.busTrackerDisplay.clear();

      await this.stateManager.selectRoute(routeId);
      const stops = this.stateManager.getStopsForCurrentRoute();
      this.currentStops = stops;
      this.currentRouteId = routeId;
      this.currentStopIndex = 0;

      this.routeViewer.displayRouteStops(routeId, stops);
      this.stopSelector.displayStops(stops);
      this.busTrackerDisplay.setStops(stops);
      this.mapManager.drawRoute(stops);

      this.stateManager.startTrackingBuses(routeId);
      this.stateManager.startPolling(this.pollingInterval);

      await this.refreshBusLocations();

      setInterval(() => {
        if (this.stateManager.isTrackingBuses()) this.refreshBusLocations();
      }, this.pollingInterval);

    } catch {
      this.showError('Failed to load route details. Please try again.', 'route selection');
    }
  }

  private async refreshBusLocations(): Promise<void> {
    const buses = this.stateManager.getBusLocations();
    if (buses.length === 0) { this.busTrackerDisplay.clear(); return; }
    this.busTrackerDisplay.displayBuses(buses);
    this.mapManager.updateBusMarkers(buses);
    this.stopSelector.updateBusLocations(buses);

    this.routeViewer.displayRouteStops(this.currentRouteId, this.currentStops);
  }

  // ─── Stop Selection ───────────────────────────────────────────────────────

  private handleStopSelection(stopId: string): void {
    this.stateManager.selectDropOffStop(stopId);
    const stop = this.stateManager.getStop(stopId);
    if (stop) this.mapManager.highlightStop(stop);
  }

  // ─── GPS ──────────────────────────────────────────────────────────────────

  private startGPS(): void {
    const started = this.gpsTracker.start(
      (pos) => this.onGPSUpdate(pos),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          this.showGPSStatus('GPS permission denied', 'warn');
        } else {
          this.showGPSStatus('GPS signal lost...', 'warn');
        }
      }
    );
    if (!started) this.showGPSStatus('GPS not supported on this device', 'warn');
    else this.showGPSStatus('Waiting for GPS...', 'info');
  }

  private async onGPSUpdate(pos: GeolocationPosition): Promise<void> {
    const { latitude, longitude, accuracy } = pos.coords;
    this.showGPSStatus(`GPS active · ±${Math.round(accuracy)}m`, 'ok');

    const popupContent = await this.buildPassengerPopup(latitude, longitude);
    this.mapManager.updatePassengerMarker(latitude, longitude, popupContent);

    if (this.currentStops.length === 0) {
      // No route selected — show real place name
      this.banner.showPlaceName('Locating...', true);
      const place = await this.gpsTracker.reversGeocode(latitude, longitude);
      if (place) {
        this.banner.showPlaceName(place);
        this.mapManager.updatePassengerMarker(latitude, longitude, `<strong>You are here</strong><br>${place}`);
      } else {
        this.banner.showPlaceName(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
      return;
    }

    // Route selected — advance stop index based on proximity
    // Only move forward, never backward (like real navigation)
    const ARRIVED_THRESHOLD = 100;   // within 100m = at this stop
    const DEPARTED_THRESHOLD = 200;  // more than 200m away = departed, advance to next

    // Check if we've passed the current stop and should advance
    while (this.currentStopIndex < this.currentStops.length - 1) {
      const currentStop = this.currentStops[this.currentStopIndex];
      const distToCurrent = haversine(latitude, longitude, currentStop.latitude, currentStop.longitude);
      const nextStop = this.currentStops[this.currentStopIndex + 1];
      const distToNext = haversine(latitude, longitude, nextStop.latitude, nextStop.longitude);

      // Advance if we're closer to the next stop than the current one and have departed
      if (distToCurrent > DEPARTED_THRESHOLD && distToNext < distToCurrent) {
        this.currentStopIndex++;
      } else {
        break;
      }
    }

    const nearestStop = this.currentStops[this.currentStopIndex];
    const nearestDist = haversine(latitude, longitude, nearestStop.latitude, nearestStop.longitude);
    const nextStop = this.currentStops[this.currentStopIndex + 1] ?? null;
    const isAtStop = nearestDist <= ARRIVED_THRESHOLD;

    const fakeBus = { busId: 'passenger', routeId: '', latitude, longitude, timestamp: new Date(), speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined };

    this.banner.showRouteStop(isAtStop ? nearestStop : null, isAtStop ? nextStop : nearestStop, fakeBus, nearestDist);

    if (nextStop) {
      const distToNext = haversine(latitude, longitude, nextStop.latitude, nextStop.longitude);
      this.banner.maybeAnnounceNext(nextStop, distToNext);
    }
    if (isAtStop) this.banner.maybeAnnounceArrival(nearestStop);
  }

  private async buildPassengerPopup(lat: number, lon: number): Promise<string> {
    if (this.currentStops.length > 0) {
      let nearestStop = this.currentStops[0];
      let nearestDist = Infinity;
      this.currentStops.forEach(s => {
        const d = haversine(lat, lon, s.latitude, s.longitude);
        if (d < nearestDist) { nearestDist = d; nearestStop = s; }
      });
      const isAt = nearestDist <= 100;
      return `<strong>You are here</strong><br>${isAt ? '📍 At: ' : '🔜 Nearest: '}<strong>${nearestStop.name}</strong><br><small>${nearestDist < 1000 ? Math.round(nearestDist) + 'm' : (nearestDist / 1000).toFixed(1) + 'km'} away</small>`;
    }
    return '<strong>You are here</strong>';
  }

  // ─── UI Helpers ───────────────────────────────────────────────────────────

  private showGPSStatus(msg: string, type: 'ok' | 'warn' | 'info'): void {
    let el = document.getElementById('gps-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gps-status';
      el.className = 'gps-status';
      document.querySelector('main')?.insertBefore(el, document.querySelector('main')!.firstChild);
    }
    const colors = { ok: '#10b981', warn: '#f59e0b', info: '#6366f1' };
    el.innerHTML = `<span style="color:${colors[type]}">●</span> ${msg}`;
  }

  private createErrorEl(): void {
    let el = document.getElementById('error-display');
    if (!el) {
      el = document.createElement('div');
      el.id = 'error-display';
      el.className = 'error-display hidden';
      document.querySelector('.container')?.insertBefore(el, document.querySelector('.container')!.firstChild);
    }
    this.errorEl = el;
  }

  private showError(message: string, context: string): void {
    console.error(`[${context}] ${message}`);
    if (!this.errorEl) return;
    this.errorEl.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-close" onclick="this.parentElement.remove()">×</button>
      </div>`;
    this.errorEl.classList.remove('hidden');
    setTimeout(() => this.errorEl?.classList.add('hidden'), 10000);
  }

  cleanup(): void {
    this.stateManager.stopTrackingBuses();
    this.stateManager.stopPolling();
    this.gpsTracker.stop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new BusTrackingApp();
  app.initialize();
  window.addEventListener('beforeunload', () => app.cleanup());
});
