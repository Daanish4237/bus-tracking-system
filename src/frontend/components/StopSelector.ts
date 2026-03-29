/**
 * Stop Selector Component
 */

import { Stop, BusLocation } from '../../shared/types';

export interface StopSelectorCallbacks {
  onStopSelected?: (stopId: string) => void;
}

const AVG_BUS_SPEED_KMH = 20; // fallback speed if bus has no speed data

export class StopSelector {
  private containerElement: HTMLElement;
  private callbacks: StopSelectorCallbacks;
  private selectedStopId: string | null = null;
  private currentStops: Stop[] = [];
  private busLocations: BusLocation[] = [];

  constructor(containerElementId: string, callbacks: StopSelectorCallbacks = {}) {
    const el = document.getElementById(containerElementId);
    if (!el) throw new Error(`Element with id "${containerElementId}" not found`);
    this.containerElement = el;
    this.callbacks = callbacks;
  }

  /** Update bus locations so ETA can be calculated */
  updateBusLocations(buses: BusLocation[]): void {
    this.busLocations = buses;
    // Refresh ETA if a stop is already selected
    if (this.selectedStopId) this.displaySelectedStopInfo();
  }

  displayStops(stops: Stop[]): void {
    this.currentStops = stops;
    this.containerElement.innerHTML = '';

    if (stops.length === 0) {
      this.containerElement.innerHTML = '<p class="no-stops">No stops available for selection</p>';
      return;
    }

    const instruction = document.createElement('p');
    instruction.className = 'stop-selector-instruction';
    instruction.textContent = 'Click on a stop to select it as your drop-off location:';
    this.containerElement.appendChild(instruction);

    const stopsList = document.createElement('ul');
    stopsList.className = 'selectable-stops-list';

    stops.forEach((stop, index) => {
      const stopItem = document.createElement('li');
      stopItem.className = 'selectable-stop-item';
      stopItem.dataset.stopId = stop.id;
      if (this.selectedStopId === stop.id) stopItem.classList.add('selected');

      const stopContent = document.createElement('div');
      stopContent.className = 'selectable-stop-content';

      const stopNumber = document.createElement('span');
      stopNumber.className = 'selectable-stop-number';
      stopNumber.textContent = `${index + 1}.`;

      const stopName = document.createElement('span');
      stopName.className = 'selectable-stop-name';
      stopName.textContent = stop.name;

      const stopAddress = document.createElement('span');
      stopAddress.className = 'selectable-stop-address';
      stopAddress.textContent = stop.address;

      stopContent.appendChild(stopNumber);
      stopContent.appendChild(stopName);
      stopContent.appendChild(stopAddress);
      stopItem.appendChild(stopContent);

      stopItem.addEventListener('click', (e) => {
        this.addRipple(stopItem, e);
        this.onStopSelected(stop.id);
      });

      stopsList.appendChild(stopItem);
    });

    this.containerElement.appendChild(stopsList);

    if (this.selectedStopId) this.displaySelectedStopInfo();
  }

  onStopSelected(stopId: string): void {
    this.selectedStopId = stopId;

    const stopItems = this.containerElement.querySelectorAll('.selectable-stop-item');
    stopItems.forEach(item => {
      if (item instanceof HTMLElement && item.dataset.stopId === stopId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    this.displaySelectedStopInfo();

    if (this.callbacks.onStopSelected) this.callbacks.onStopSelected(stopId);
  }

  private addRipple(el: HTMLElement, e: MouseEvent): void {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  /**
   * Haversine distance in meters between two lat/lon points
   */
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Estimate minutes until the bus reaches the target stop.
   * Strategy: find the closest stop the bus has already passed (its current position),
   * then sum distances along the route from there to the target stop.
   */
  private estimateETA(bus: BusLocation, targetStopId: string): number | null {
    const stops = this.currentStops;
    if (stops.length === 0) return null;

    const targetIdx = stops.findIndex(s => s.id === targetStopId);
    if (targetIdx === -1) return null;

    // Find which stop index the bus is closest to right now
    let closestIdx = 0;
    let minDist = Infinity;
    stops.forEach((stop, i) => {
      const d = this.haversine(bus.latitude, bus.longitude, stop.latitude, stop.longitude);
      if (d < minDist) { minDist = d; closestIdx = i; }
    });

    // If bus is already past the target stop, return 0
    if (closestIdx >= targetIdx) return 0;

    // Sum distances: bus → next stop → ... → target stop
    let totalMeters = this.haversine(bus.latitude, bus.longitude, stops[closestIdx + 1]?.latitude ?? stops[closestIdx].latitude, stops[closestIdx + 1]?.longitude ?? stops[closestIdx].longitude);

    for (let i = closestIdx + 1; i < targetIdx; i++) {
      totalMeters += this.haversine(stops[i].latitude, stops[i].longitude, stops[i + 1].latitude, stops[i + 1].longitude);
    }

    const speedKmh = (bus.speed && bus.speed > 0) ? bus.speed : AVG_BUS_SPEED_KMH;
    const speedMs = (speedKmh * 1000) / 60; // meters per minute
    return Math.round(totalMeters / speedMs);
  }

  private displaySelectedStopInfo(): void {
    const existingInfo = this.containerElement.querySelector('.selected-stop-info');
    if (existingInfo) existingInfo.remove();

    if (!this.selectedStopId) return;

    const selectedStop = this.currentStops.find(s => s.id === this.selectedStopId);
    if (!selectedStop) return;

    const infoContainer = document.createElement('div');
    infoContainer.className = 'selected-stop-info';

    const infoHeader = document.createElement('h3');
    infoHeader.className = 'selected-stop-header';
    infoHeader.textContent = 'Your Selected Drop-off Stop:';

    const infoContent = document.createElement('div');
    infoContent.className = 'selected-stop-details';

    const nameEl = document.createElement('p');
    nameEl.className = 'selected-stop-name-display';
    nameEl.innerHTML = `<strong>${selectedStop.name}</strong>`;

    const addrEl = document.createElement('p');
    addrEl.className = 'selected-stop-address-display';
    addrEl.textContent = selectedStop.address;

    infoContent.appendChild(nameEl);
    infoContent.appendChild(addrEl);

    // ETA section
    if (this.busLocations.length > 0) {
      const etaContainer = document.createElement('div');
      etaContainer.className = 'eta-container';

      this.busLocations.forEach(bus => {
        const minutes = this.estimateETA(bus, this.selectedStopId!);
        const etaEl = document.createElement('div');
        etaEl.className = 'eta-item';

        if (minutes === null) {
          etaEl.innerHTML = `🚌 <strong>Bus ${bus.busId}:</strong> ETA unavailable`;
        } else if (minutes === 0) {
          etaEl.innerHTML = `🚌 <strong>Bus ${bus.busId}:</strong> <span class="eta-value eta-arrived">Arriving now</span>`;
        } else {
          etaEl.innerHTML = `🚌 <strong>Bus ${bus.busId}:</strong> <span class="eta-value">~${minutes} min</span>`;
        }

        etaContainer.appendChild(etaEl);
      });

      infoContent.appendChild(etaContainer);
    } else {
      const noEta = document.createElement('p');
      noEta.className = 'eta-no-bus';
      noEta.textContent = '⏱ No active buses — ETA unavailable';
      infoContent.appendChild(noEta);
    }

    const requestBtn = document.createElement('button');
    requestBtn.className = 'request-stop-btn';
    requestBtn.innerHTML = `🔔 Request Stop at ${selectedStop.name}`;
    requestBtn.addEventListener('click', () =>
      this.requestStop(selectedStop.id, selectedStop.name, requestBtn, infoContainer)
    );

    infoContainer.appendChild(infoHeader);
    infoContainer.appendChild(infoContent);
    infoContainer.appendChild(requestBtn);

    this.containerElement.appendChild(infoContainer);
  }

  private async requestStop(
    stopId: string,
    stopName: string,
    btn: HTMLButtonElement,
    container: HTMLElement
  ): Promise<void> {
    btn.disabled = true;
    btn.innerHTML = '⏳ Sending request...';

    const existing = container.querySelector('.request-stop-toast');
    if (existing) existing.remove();

    try {
      const res = await fetch(`/api/stops/${stopId}/request`, { method: 'POST' });
      const data = await res.json();

      const toast = document.createElement('div');
      toast.className = 'request-stop-toast success';
      toast.innerHTML = `✅ ${data.message}`;
      container.appendChild(toast);

      btn.innerHTML = '✅ Stop Requested';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `🔔 Request Stop at ${stopName}`;
        toast.remove();
      }, 5000);
    } catch {
      const toast = document.createElement('div');
      toast.className = 'request-stop-toast error';
      toast.innerHTML = '❌ Failed to send request. Please try again.';
      container.appendChild(toast);
      btn.disabled = false;
      btn.innerHTML = `🔔 Request Stop at ${stopName}`;
    }
  }

  getSelectedStop(): string | null {
    return this.selectedStopId;
  }

  clearSelection(): void {
    this.selectedStopId = null;
    this.containerElement.querySelectorAll('.selectable-stop-item').forEach(item => {
      item.classList.remove('selected');
    });
    const existingInfo = this.containerElement.querySelector('.selected-stop-info');
    if (existingInfo) existingInfo.remove();
  }

  clearStops(): void {
    this.containerElement.innerHTML = '';
    this.selectedStopId = null;
    this.currentStops = [];
    this.busLocations = [];
  }
}
