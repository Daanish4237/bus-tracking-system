/**
 * GPSTracker — handles browser geolocation and reverse geocoding
 */

export type GPSUpdateCallback = (pos: GeolocationPosition) => void;
export type GPSErrorCallback = (err: GeolocationPositionError) => void;

export class GPSTracker {
  private watchId: number | null = null;
  private lastGeocodedPos: { lat: number; lon: number } | null = null;

  start(onUpdate: GPSUpdateCallback, onError?: GPSErrorCallback): boolean {
    if (!navigator.geolocation) return false;
    if (this.watchId !== null) this.stop();

    this.watchId = navigator.geolocation.watchPosition(
      onUpdate,
      onError ?? (() => {}),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return true;
  }

  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  isActive(): boolean { return this.watchId !== null; }

  /**
   * Reverse geocode a lat/lon to a human-readable place name.
   * Only re-fetches if moved more than `minMovedMeters` from last geocode.
   */
  async reversGeocode(lat: number, lon: number, minMovedMeters = 50): Promise<string | null> {
    if (this.lastGeocodedPos) {
      const moved = haversine(lat, lon, this.lastGeocodedPos.lat, this.lastGeocodedPos.lon);
      if (moved < minMovedMeters) return null; // not moved enough, skip
    }
    this.lastGeocodedPos = { lat, lon };

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const a = data.address ?? {};
      return (
        a.amenity || a.building || a.university || a.college || a.school ||
        a.mall || a.hotel || a.hospital ||
        a.road || a.pedestrian || a.footway ||
        a.suburb || a.neighbourhood || a.village ||
        a.town || a.city || null
      );
    } catch {
      return null;
    }
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toR = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
