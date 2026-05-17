export const PAKISTAN_BBOX = { minLon: 60.87, minLat: 23.69, maxLon: 77.84, maxLat: 37.13 };
export const PAKISTAN_CENTER = { lat: 30.3753, lon: 69.3451 };
export const DEFAULT_MAP_CENTER = { lat: 29.32397499175977, lon: 71.4947509455709 };
export const DEFAULT_MAP_ZOOM = 17;

export interface LatLon { lat: number; lon: number }
export interface Polygon { coordinates: LatLon[]; areaAcres: number }

export function isInsidePakistan(p: LatLon): boolean {
  return (
    p.lon >= PAKISTAN_BBOX.minLon &&
    p.lon <= PAKISTAN_BBOX.maxLon &&
    p.lat >= PAKISTAN_BBOX.minLat &&
    p.lat <= PAKISTAN_BBOX.maxLat
  );
}

export function polygonAreaAcres(coords: LatLon[]): number {
  if (coords.length < 3) return 0;
  const sqM = sphericalArea(coords);
  return sqM / 4046.8564224;
}

function sphericalArea(coords: LatLon[]): number {
  const R = 6378137;
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    area +=
      toRad(p2.lon - p1.lon) *
      (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }
  return Math.abs((area * R * R) / 2);
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function mockFieldPolygons(center: LatLon, count = 4): Polygon[] {
  const polys: Polygon[] = [];
  const baseOffset = 0.0012;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cx = center.lon + (col - 0.5) * baseOffset * 2.4;
    const cy = center.lat + (row - 0.5) * baseOffset * 2.4;
    const w = baseOffset * (0.8 + Math.random() * 0.4);
    const h = baseOffset * (0.8 + Math.random() * 0.4);
    const coords: LatLon[] = [
      { lat: cy - h, lon: cx - w },
      { lat: cy - h, lon: cx + w },
      { lat: cy + h, lon: cx + w },
      { lat: cy + h, lon: cx - w }
    ];
    polys.push({ coordinates: coords, areaAcres: polygonAreaAcres(coords) });
  }
  return polys;
}
