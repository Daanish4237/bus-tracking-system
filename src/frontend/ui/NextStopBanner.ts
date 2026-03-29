/**
 * NextStopBanner — Moovit-style banner showing current/next stop
 * Also handles voice announcements via Web Speech API
 */

import { Stop, BusLocation } from '../../shared/types';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distText(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

export class NextStopBanner {
  private el: HTMLElement | null = null;
  private lastAnnouncedNext = '';
  private lastAnnouncedArriving = '';

  private getOrCreate(): HTMLElement {
    if (!this.el) {
      this.el = document.getElementById('next-stop-banner');
    }
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.id = 'next-stop-banner';
      this.el.className = 'next-stop-banner';
      document.querySelector('main')?.insertBefore(this.el, document.querySelector('main')!.firstChild);
    }
    return this.el;
  }

  /** Show real place name (before route selected) */
  showPlaceName(name: string, loading = false): void {
    const banner = this.getOrCreate();
    banner.innerHTML = `
      <div class="nsb-inner">
        <div class="nsb-current">
          <span class="nsb-label">Now at</span>
          <span class="nsb-stop-name" ${loading ? 'style="color:#94a3b8"' : ''}>${name}</span>
        </div>
        <div class="nsb-next">
          <span class="nsb-label" style="color:#64748b">Select a route to track stops</span>
        </div>
      </div>`;
  }

  /** Show route stop info (after route selected) */
  showRouteStop(
    currentStop: Stop | null,
    nextStop: Stop | null,
    bus: BusLocation,
    nearestDist: number
  ): void {
    const banner = this.getOrCreate();
    const nextDist = nextStop
      ? Math.round(haversine(bus.latitude, bus.longitude, nextStop.latitude, nextStop.longitude))
      : null;

    banner.innerHTML = `
      <div class="nsb-inner">
        ${currentStop ? `
          <div class="nsb-current">
            <span class="nsb-label">Now at</span>
            <span class="nsb-stop-name">${currentStop.name}</span>
          </div>` : `
          <div class="nsb-current">
            <span class="nsb-label">Nearest stop</span>
            <span class="nsb-stop-name" style="color:#94a3b8;font-size:.9rem">${nextStop?.name ?? '—'}</span>
            <span class="nsb-dist">${distText(Math.round(nearestDist))}</span>
          </div>`}
        ${nextStop ? `
          <div class="nsb-next">
            <span class="nsb-label">Next stop</span>
            <span class="nsb-stop-name nsb-next-name">${nextStop.name}</span>
            ${nextDist !== null ? `<span class="nsb-dist">${distText(nextDist)} away</span>` : ''}
          </div>` : `
          <div class="nsb-next">
            <span class="nsb-label" style="color:#10b981">End of route</span>
          </div>`}
        <button class="nsb-voice-btn" id="nsb-voice-btn" title="Hear announcement">🔊</button>
      </div>`;

    document.getElementById('nsb-voice-btn')?.addEventListener('click', () => {
      if (nextStop) this.speak(`Next stop: ${nextStop.name}`);
      else if (currentStop) this.speak(`Now arriving at ${currentStop.name}`);
    });
  }

  remove(): void {
    this.el?.remove();
    this.el = null;
    this.lastAnnouncedNext = '';
    this.lastAnnouncedArriving = '';
  }

  /** Announce next stop if within threshold and not already announced */
  maybeAnnounceNext(nextStop: Stop, distMeters: number, threshold = 300): void {
    if (distMeters <= threshold && this.lastAnnouncedNext !== nextStop.id) {
      this.lastAnnouncedNext = nextStop.id;
      this.speak(`Next stop: ${nextStop.name}`);
    }
  }

  /** Announce arrival if not already announced */
  maybeAnnounceArrival(stop: Stop): void {
    if (this.lastAnnouncedArriving !== stop.id) {
      this.lastAnnouncedArriving = stop.id;
      this.speak(`Now arriving at ${stop.name}`);
    }
  }

  speak(text: string): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.pitch = 1; u.volume = 1;
    window.speechSynthesis.speak(u);
  }
}
