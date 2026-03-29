/**
 * Main Application Entry Point — Moovit-style real-time bus tracking
 */

import { StateManager } from './frontend/state/StateManager';
import { RouteViewer } from './frontend/components/RouteViewer';
import { StopSelector } from './frontend/components/StopSelector';
import { BusTrackerDisplay } from './frontend/components/BusTrackerDisplay';
import { Stop, BusLocation, StopStatus } from './shared/types';
import { calculateStopStatuses } from './shared/stopStatusCalculator';

declare const L: any;

// ─── Haversine distance (meters) ────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

class BusTrackingApp {
  private stateManager: StateManager;
  private routeViewer: RouteViewer;
  private stopSelector: StopSelector;
  private busTrackerDisplay: BusTrackerDisplay;
  private pollingInterval = 5000; // 5s for snappier updates
  private errorDisplayElement: HTMLElement | null = null;

  // Map
  private map: any = null;
  private stopMarkers: any[] = [];
  private busMarkers = new Map<string, any>();
  private routePolyline: any = null;
  private selectedStopMarker: any = null;

  // Voice
  private lastAnnouncedStop = new Map<string, string>(); // busId → stopId

  // Current route stops
  private currentStops: Stop[] = [];

  // Passenger GPS tracking
  private watchId: number | null = null;
  private passengerMarker: any = null;
  private passengerPosition: GeolocationPosition | null = null;

  constructor() {
    this.stateManager = new StateManager('/api');
    this.stateManager.setErrorCallback((error, context) => this.displayError(error.message, context));

    this.routeViewer = new RouteViewer('route-list', 'route-stops', {
      onRouteSelected: (routeId) => this.handleRouteSelection(routeId)
    });

    this.stopSelector = new StopSelector('stop-selector', {
      onStopSelected: (stopId) => this.handleStopSelection(stopId)
    });

    this.busTrackerDisplay = new BusTrackerDisplay('bus-tracker', {
      onBusSelected: () => {}
    });

    this.createErrorDisplay();
  }

  async initialize(): Promise<void> {
    try {
      const routes = await this.stateManager.loadRoutes();
      this.routeViewer.displayRoutes(routes);
    } catch (error) {
      this.displayError('Failed to load routes. Please refresh the page.', 'initialization');
    }
  }

  private async handleRouteSelection(routeId: string): Promise<void> {
    try {
      this.stateManager.stopTrackingBuses();
      this.stateManager.stopPolling();
      this.stopSelector.clearSelection();
      this.busTrackerDisplay.clear();
      this.lastAnnouncedStop.clear();
      this.hideNextStopBanner();

      await this.stateManager.selectRoute(routeId);
      const stops = this.stateManager.getStopsForCurrentRoute();
      this.currentStops = stops;

      this.routeViewer.displayRouteStops(routeId, stops);
      this.stopSelector.displayStops(stops);
      this.busTrackerDisplay.setStops(stops);

      this.initMap();
      this.drawRouteOnMap(stops);

      this.stateManager.startTrackingBuses(routeId);
      this.stateManager.startPolling(this.pollingInterval);

      await this.updateBusLocations();

      // Poll more frequently for live feel
      setInterval(() => {
        if (this.stateManager.isTrackingBuses()) this.updateBusLocations();
      }, this.pollingInterval);

      // Start tracking passenger's own GPS
      this.startPassengerGPS();

    } catch (error) {
      this.displayError('Failed to load route details. Please try again.', 'route selection');
    }
  }

  private handleStopSelection(stopId: string): void {
    this.stateManager.selectDropOffStop(stopId);
    const stop = this.stateManager.getStop(stopId);
    if (!stop || !this.map) return;

    this.map.setView([stop.latitude, stop.longitude], 16, { animate: true });

    if (this.selectedStopMarker) this.selectedStopMarker.remove();

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#10b981;color:white;border-radius:50%;width:36px;height:36px;
             display:flex;align-items:center;justify-content:center;font-size:18px;
             border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.5)">📍</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18]
    });

    this.selectedStopMarker = L.marker([stop.latitude, stop.longitude], { icon })
      .addTo(this.map)
      .bindPopup(`<strong>Your stop: ${stop.name}</strong><br><small>${stop.address}</small>`)
      .openPopup();
  }

  private async updateBusLocations(): Promise<void> {
    const busLocations = this.stateManager.getBusLocations();
    if (busLocations.length === 0) { this.busTrackerDisplay.clear(); return; }

    this.busTrackerDisplay.displayBuses(busLocations);
    this.moveBusMarkersOnMap(busLocations);
    this.stopSelector.updateBusLocations(busLocations);
    this.updateNextStopBanner(busLocations);
  }

  // ─── Passenger GPS ───────────────────────────────────────────────────────

  private startPassengerGPS(): void {
    if (!navigator.geolocation) {
      this.showGPSStatus('GPS not supported on this device', 'warn');
      return;
    }

    // Stop any existing watch
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);

    this.showGPSStatus('Waiting for GPS...', 'info');

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.passengerPosition = pos;
        this.onPassengerLocationUpdate(pos);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          this.showGPSStatus('GPS permission denied — enable location to track your position', 'warn');
        } else {
          this.showGPSStatus('GPS signal lost...', 'warn');
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
  }

  private onPassengerLocationUpdate(pos: GeolocationPosition): void {
    const { latitude, longitude, accuracy } = pos.coords;

    this.showGPSStatus(`GPS active · ±${Math.round(accuracy)}m`, 'ok');

    // Update passenger marker on map
    this.updatePassengerMarker(latitude, longitude);

    // Use passenger's location as the "bus" location for stop detection
    const fakeBus: BusLocation = {
      busId: 'passenger',
      routeId: '',
      latitude,
      longitude,
      timestamp: new Date(),
      speed: pos.coords.speed ? pos.coords.speed * 3.6 : undefined
    };

    // Update next stop banner using passenger's real position
    this.updateNextStopBanner([fakeBus]);
  }

  private updatePassengerMarker(lat: number, lon: number): void {
    if (!this.map) return;

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#3b82f6;border-radius:50%;width:18px;height:18px;
             border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,.3)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9]
    });

    if (this.passengerMarker) {
      this.passengerMarker.setLatLng([lat, lon]);
    } else {
      this.passengerMarker = L.marker([lat, lon], { icon, zIndexOffset: 1000 })
        .addTo(this.map)
        .bindPopup('<strong>You are here</strong>');
      // Pan map to follow passenger on first fix
      this.map.setView([lat, lon], 15, { animate: true });
    }
  }

  private showGPSStatus(msg: string, type: 'ok' | 'warn' | 'info'): void {
    let el = document.getElementById('gps-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gps-status';
      el.className = 'gps-status';
      document.querySelector('main')?.insertBefore(el, document.querySelector('main')!.firstChild);
    }
    const colors: Record<string, string> = { ok: '#10b981', warn: '#f59e0b', info: '#6366f1' };
    el.innerHTML = `<span style="color:${colors[type]}">●</span> ${msg}`;
  }

  // ─── Map ──────────────────────────────────────────────────────────────────

  private initMap(): void {
    if (this.map) return;
    const el = document.getElementById('route-map');
    if (!el) return;
    el.innerHTML = '';
    this.map = L.map('route-map').setView([3.05, 101.65], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);
  }

  private drawRouteOnMap(stops: Stop[]): void {
    if (!this.map) return;

    // Clear old markers and polyline
    this.stopMarkers.forEach(m => m.remove());
    this.stopMarkers = [];
    if (this.routePolyline) { this.routePolyline.remove(); this.routePolyline = null; }

    if (stops.length === 0) return;

    const coords: [number, number][] = stops.map(s => [s.latitude, s.longitude]);

    // Draw route line
    this.routePolyline = L.polyline(coords, {
      color: '#4f46e5', weight: 4, opacity: 0.8
    }).addTo(this.map);

    // Stop markers with sequence numbers
    stops.forEach((stop, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#4f46e5;color:white;border-radius:50%;width:26px;height:26px;
               display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
               border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i+1}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13]
      });
      const m = L.marker([stop.latitude, stop.longitude], { icon })
        .addTo(this.map)
        .bindPopup(`<strong>${i+1}. ${stop.name}</strong><br><small>${stop.address}</small>`);
      this.stopMarkers.push(m);
    });

    this.map.fitBounds(coords, { padding: [40, 40] });
  }

  private moveBusMarkersOnMap(buses: BusLocation[]): void {
    if (!this.map) return;

    const busIcon = L.divIcon({
      className: '',
      html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:36px;height:36px;
             display:flex;align-items:center;justify-content:center;font-size:18px;
             border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,.4)">🚌</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18]
    });

    buses.forEach(bus => {
      const existing = this.busMarkers.get(bus.busId);
      if (existing) {
        // Smoothly move existing marker
        existing.setLatLng([bus.latitude, bus.longitude]);
        existing.setPopupContent(`<strong>Bus ${bus.busId}</strong><br>Speed: ${bus.speed ?? '?'} km/h`);
      } else {
        const m = L.marker([bus.latitude, bus.longitude], { icon: busIcon })
          .addTo(this.map)
          .bindPopup(`<strong>Bus ${bus.busId}</strong><br>Speed: ${bus.speed ?? '?'} km/h`);
        this.busMarkers.set(bus.busId, m);
      }
    });

    // Remove markers for buses no longer active
    const activeBusIds = new Set(buses.map(b => b.busId));
    this.busMarkers.forEach((marker, busId) => {
      if (!activeBusIds.has(busId)) { marker.remove(); this.busMarkers.delete(busId); }
    });
  }

  // ─── Next Stop Banner ─────────────────────────────────────────────────────

  private updateNextStopBanner(buses: BusLocation[]): void {
    if (this.currentStops.length === 0 || buses.length === 0) return;

    // Use the first bus for the banner (can extend to multi-bus later)
    const bus = buses[0];
    const statuses = calculateStopStatuses(bus, this.currentStops);

    // Find current stop (CURRENT) and next stop (first UPCOMING)
    const currentStop = this.currentStops.find((_, i) => statuses[i]?.status === StopStatus.CURRENT);
    const nextStopIdx = statuses.findIndex(s => s.status === StopStatus.UPCOMING);
    const nextStop = nextStopIdx !== -1 ? this.currentStops[nextStopIdx] : null;

    this.showNextStopBanner(currentStop ?? null, nextStop, bus);

    // Voice announcement: announce next stop when bus is within ~300m
    if (nextStop) {
      const dist = haversine(bus.latitude, bus.longitude, nextStop.latitude, nextStop.longitude);
      const lastAnnounced = this.lastAnnouncedStop.get(bus.busId);
      if (dist <= 300 && lastAnnounced !== nextStop.id) {
        this.lastAnnouncedStop.set(bus.busId, nextStop.id);
        this.announce(`Next stop: ${nextStop.name}`);
      }
    }

    // Announce "Arriving" when bus is at current stop
    if (currentStop) {
      const key = `arriving-${bus.busId}`;
      if (this.lastAnnouncedStop.get(key) !== currentStop.id) {
        this.lastAnnouncedStop.set(key, currentStop.id);
        this.announce(`Now arriving at ${currentStop.name}`);
      }
    }
  }

  private showNextStopBanner(
    currentStop: Stop | null,
    nextStop: Stop | null,
    bus: BusLocation
  ): void {
    let banner = document.getElementById('next-stop-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'next-stop-banner';
      banner.className = 'next-stop-banner';
      const main = document.querySelector('main');
      if (main) main.insertBefore(banner, main.firstChild);
    }

    const nextDist = nextStop
      ? Math.round(haversine(bus.latitude, bus.longitude, nextStop.latitude, nextStop.longitude))
      : null;

    banner.innerHTML = `
      <div class="nsb-inner">
        ${currentStop ? `
          <div class="nsb-current">
            <span class="nsb-label">Now at</span>
            <span class="nsb-stop-name">${currentStop.name}</span>
          </div>` : ''}
        ${nextStop ? `
          <div class="nsb-next">
            <span class="nsb-label">Next stop</span>
            <span class="nsb-stop-name nsb-next-name">${nextStop.name}</span>
            ${nextDist !== null ? `<span class="nsb-dist">${nextDist < 1000 ? nextDist + 'm' : (nextDist/1000).toFixed(1) + 'km'} away</span>` : ''}
          </div>` : `<div class="nsb-next"><span class="nsb-label">End of route</span></div>`}
        <button class="nsb-voice-btn" onclick="window.__announceNext && window.__announceNext()" title="Hear announcement">🔊</button>
      </div>
    `;

    // Expose announce function for the button
    (window as any).__announceNext = () => {
      if (nextStop) this.announce(`Next stop: ${nextStop.name}`);
      else if (currentStop) this.announce(`Now arriving at ${currentStop.name}`);
    };
  }

  private hideNextStopBanner(): void {
    const banner = document.getElementById('next-stop-banner');
    if (banner) banner.remove();
  }

  // ─── Voice Announcements ──────────────────────────────────────────────────

  private announce(text: string): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  // ─── Error Display ────────────────────────────────────────────────────────

  private createErrorDisplay(): void {
    let el = document.getElementById('error-display');
    if (!el) {
      el = document.createElement('div');
      el.id = 'error-display';
      el.className = 'error-display hidden';
      document.querySelector('.container')?.insertBefore(el, document.querySelector('.container')!.firstChild);
    }
    this.errorDisplayElement = el;
  }

  private displayError(message: string, context: string): void {
    console.error(`Error in ${context}: ${message}`);
    if (!this.errorDisplayElement) return;
    this.errorDisplayElement.innerHTML = `
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-close" onclick="this.parentElement.remove()">×</button>
      </div>`;
    this.errorDisplayElement.classList.remove('hidden');
    setTimeout(() => this.errorDisplayElement?.classList.add('hidden'), 10000);
  }

  cleanup(): void {
    this.stateManager.stopTrackingBuses();
    this.stateManager.stopPolling();
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new BusTrackingApp();
  app.initialize();
  window.addEventListener('beforeunload', () => app.cleanup());
});
