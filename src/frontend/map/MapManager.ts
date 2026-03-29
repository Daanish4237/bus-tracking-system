/**
 * MapManager — handles all Leaflet map operations
 */

import { Stop, BusLocation } from '../../shared/types';

declare const L: any;

export class MapManager {
  private map: any = null;
  private stopMarkers: any[] = [];
  private busMarkers = new Map<string, any>();
  private routePolyline: any = null;
  private selectedStopMarker: any = null;
  private passengerMarker: any = null;

  init(elementId = 'route-map', center: [number, number] = [3.05, 101.65], zoom = 13): void {
    if (this.map) return;
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    this.map = L.map(elementId).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);
  }

  isReady(): boolean { return this.map !== null; }

  drawRoute(stops: Stop[]): void {
    if (!this.map) return;
    this.stopMarkers.forEach(m => m.remove());
    this.stopMarkers = [];
    if (this.routePolyline) { this.routePolyline.remove(); this.routePolyline = null; }
    if (stops.length === 0) return;

    const coords: [number, number][] = stops.map(s => [s.latitude, s.longitude]);
    this.routePolyline = L.polyline(coords, { color: '#4f46e5', weight: 4, opacity: 0.8 }).addTo(this.map);

    stops.forEach((stop, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#4f46e5;color:white;border-radius:50%;width:26px;height:26px;
               display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
               border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i + 1}</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13]
      });
      const m = L.marker([stop.latitude, stop.longitude], { icon })
        .addTo(this.map)
        .bindPopup(`<strong>${i + 1}. ${stop.name}</strong><br><small>${stop.address}</small>`);
      this.stopMarkers.push(m);
    });

    this.map.fitBounds(coords, { padding: [40, 40] });
  }

  updateBusMarkers(buses: BusLocation[]): void {
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
        existing.setLatLng([bus.latitude, bus.longitude]);
        existing.setPopupContent(`<strong>Bus ${bus.busId}</strong><br>Speed: ${bus.speed ?? '?'} km/h`);
      } else {
        const m = L.marker([bus.latitude, bus.longitude], { icon: busIcon })
          .addTo(this.map)
          .bindPopup(`<strong>Bus ${bus.busId}</strong><br>Speed: ${bus.speed ?? '?'} km/h`);
        this.busMarkers.set(bus.busId, m);
      }
    });

    const activeIds = new Set(buses.map(b => b.busId));
    this.busMarkers.forEach((marker, busId) => {
      if (!activeIds.has(busId)) { marker.remove(); this.busMarkers.delete(busId); }
    });
  }

  updatePassengerMarker(lat: number, lon: number, popupContent?: string): void {
    if (!this.map) return;
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#3b82f6;border-radius:50%;width:18px;height:18px;
             border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,.3)"></div>`,
      iconSize: [18, 18], iconAnchor: [9, 9]
    });

    if (this.passengerMarker) {
      this.passengerMarker.setLatLng([lat, lon]);
      if (popupContent) this.passengerMarker.setPopupContent(popupContent);
    } else {
      this.passengerMarker = L.marker([lat, lon], { icon, zIndexOffset: 1000 })
        .addTo(this.map)
        .bindPopup(popupContent ?? '<strong>You are here</strong>');
      this.map.setView([lat, lon], 15, { animate: true });
    }
  }

  highlightStop(stop: Stop): void {
    if (!this.map) return;
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

    this.map.setView([stop.latitude, stop.longitude], 16, { animate: true });
  }

  panTo(lat: number, lon: number, zoom = 15): void {
    if (!this.map) return;
    this.map.setView([lat, lon], zoom, { animate: true });
  }
}
