"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, PencilLine, X, MousePointer2 } from "lucide-react";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  PAKISTAN_BBOX,
  isInsidePakistan,
  polygonAreaAcres,
  type LatLon,
  type Polygon
} from "@/lib/geo";

declare global {
  interface Window {
    google?: any;
    __gmapsLoading?: Promise<void>;
    gm_authFailure?: () => void;
    __gmapsAuthFailed?: boolean;
  }
}

interface Props {
  onClickPoint: (point: LatLon) => void;
  onDrawComplete: (polygon: Polygon) => void;
  polygons: Polygon[];
  selectedPolygonIndex?: number | null;
  onPolygonClick?: (i: number) => void;
}

const SCRIPT_ID = "google-maps-js";

async function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") throw new Error("ssr");

  if (!window.google?.maps?.importLibrary) {
    if (!window.__gmapsLoading) {
      window.__gmapsLoading = new Promise<void>((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
          const check = () => {
            if (window.google?.maps?.importLibrary) resolve();
            else setTimeout(check, 80);
          };
          existing.addEventListener("load", check);
          existing.addEventListener("error", () => reject(new Error("gmaps load failed")));
          check();
          return;
        }
        const s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.async = true;
        s.defer = true;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&libraries=places,geometry,drawing&callback=__gmapsReady`;
        (window as any).__gmapsReady = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(s);
      });
    }
    await window.__gmapsLoading;
  }

  await Promise.all([
    window.google.maps.importLibrary("maps"),
    window.google.maps.importLibrary("drawing"),
    window.google.maps.importLibrary("geometry"),
    window.google.maps.importLibrary("places")
  ]);
}

export function GoogleFieldMap({
  onClickPoint,
  onDrawComplete,
  polygons,
  selectedPolygonIndex,
  onPolygonClick
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const keyHint = apiKey ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)} (len ${apiKey.length})` : "(missing)";
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polygonObjsRef = useRef<any[]>([]);
  const labelsRef = useRef<any[]>([]);
  const drawingManagerRef = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [coords, setCoords] = useState<LatLon>(DEFAULT_MAP_CENTER);
  const [drawMode, setDrawMode] = useState(false);

  useEffect(() => {
    if (!apiKey) {
      setLoadError(
        "Google Maps key was not inlined at build time. On Vercel, add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (or VITE_GOOGLE_MAPS_API_KEY) under Project Settings → Environment Variables for the Production environment, then redeploy."
      );
      return;
    }
    if (typeof window !== "undefined") {
      window.gm_authFailure = () => {
        window.__gmapsAuthFailed = true;
        setLoadError(
          `Google rejected the API key (key ${keyHint}). Most likely: the key has HTTP-referer restrictions that don't include this site's domain. Fix in Google Cloud Console → Credentials → your key → Application restrictions. Add an entry like https://${typeof location !== "undefined" ? location.host : "your-site"}/* and save.`
        );
      };
    }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        const map = new window.google.maps.Map(containerRef.current, {
          center: { lat: DEFAULT_MAP_CENTER.lat, lng: DEFAULT_MAP_CENTER.lon },
          zoom: DEFAULT_MAP_ZOOM,
          mapTypeId: "satellite",
          tilt: 0,
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          zoomControl: true,
          restriction: {
            latLngBounds: {
              north: PAKISTAN_BBOX.maxLat,
              south: PAKISTAN_BBOX.minLat,
              east: PAKISTAN_BBOX.maxLon,
              west: PAKISTAN_BBOX.minLon
            },
            strictBounds: false
          }
        });

        map.addListener("click", (e: any) => {
          if (drawingManagerRef.current?.getDrawingMode()) return;
          const lat = e.latLng.lat();
          const lon = e.latLng.lng();
          const p = { lat, lon };
          if (!isInsidePakistan(p)) return;
          placeMarker(map, p);
          setCoords(p);
          onClickPoint(p);
        });

        map.addListener("center_changed", () => {
          const c = map.getCenter();
          if (c) setCoords({ lat: c.lat(), lon: c.lng() });
        });

        try {
          if (window.google.maps.drawing) {
            const dm = new window.google.maps.drawing.DrawingManager({
              drawingMode: null,
              drawingControl: false,
              polygonOptions: {
                strokeColor: "#FFD600",
                strokeWeight: 3,
                fillColor: "#FFD600",
                fillOpacity: 0.2,
                editable: false,
                clickable: false
              }
            });
            dm.setMap(map);
            dm.addListener("polygoncomplete", (poly: any) => {
              const path = poly.getPath();
              const coords: LatLon[] = [];
              for (let i = 0; i < path.getLength(); i++) {
                const ll = path.getAt(i);
                coords.push({ lat: ll.lat(), lon: ll.lng() });
              }
              poly.setMap(null);
              dm.setDrawingMode(null);
              setDrawMode(false);
              if (coords.length < 3) return;
              const area = polygonAreaAcres(coords);
              if (area < 0.05) return;
              onDrawComplete({ coordinates: coords, areaAcres: area });
            });
            drawingManagerRef.current = dm;
          }
        } catch (e) {
          console.warn("DrawingManager init failed, will retry on first toggle", e);
        }
        mapRef.current = map;
        setReady(true);

        placeMarker(map, DEFAULT_MAP_CENTER);
        onClickPoint(DEFAULT_MAP_CENTER);
      })
      .catch((e) => setLoadError(e.message ?? "Failed to load Google Maps"));

    return () => { cancelled = true; };
  }, [apiKey]);

  function placeMarker(map: any, p: LatLon) {
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: { lat: p.lat, lng: p.lon },
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4D9BFF",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2
      }
    });
  }

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    polygonObjsRef.current.forEach((p) => p.setMap(null));
    labelsRef.current.forEach((l) => l.setMap(null));
    polygonObjsRef.current = [];
    labelsRef.current = [];

    polygons.forEach((poly, i) => {
      const path = poly.coordinates.map((c) => ({ lat: c.lat, lng: c.lon }));
      const isSelected = selectedPolygonIndex === i;
      const gp = new window.google.maps.Polygon({
        paths: path,
        strokeColor: "#FFD600",
        strokeOpacity: 1,
        strokeWeight: isSelected ? 4 : 2.5,
        fillColor: "#FFD600",
        fillOpacity: isSelected ? 0.22 : 0.08,
        clickable: true,
        zIndex: isSelected ? 2 : 1
      });
      gp.setMap(mapRef.current);
      gp.addListener("click", () => onPolygonClick?.(i));
      polygonObjsRef.current.push(gp);

      const centroid = centroidOf(poly.coordinates);
      const label = new window.google.maps.Marker({
        position: { lat: centroid.lat, lng: centroid.lon },
        map: mapRef.current,
        label: {
          text: `F${i + 1} · ${poly.areaAcres.toFixed(2)} ac`,
          color: "#FFD600",
          fontSize: "11px",
          fontWeight: "600"
        },
        icon: { path: "M 0,0 L 0,0", scale: 0, fillOpacity: 0, strokeOpacity: 0 }
      });
      labelsRef.current.push(label);
    });
  }, [polygons, selectedPolygonIndex, ready]);

  async function geocodeSearch() {
    if (!search.trim() || !window.google) return;
    setSearching(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      const res: any = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { address: `${search}, Pakistan`, region: "pk" },
          (results: any, status: any) => status === "OK" ? resolve(results) : reject(new Error(status))
        );
      });
      const r = res?.[0];
      if (r?.geometry?.location && mapRef.current) {
        const lat = r.geometry.location.lat();
        const lon = r.geometry.location.lng();
        const p = { lat, lon };
        if (isInsidePakistan(p)) {
          mapRef.current.setCenter({ lat, lng: lon });
          mapRef.current.setZoom(18);
          placeMarker(mapRef.current, p);
          setCoords(p);
          onClickPoint(p);
        }
      }
    } catch (e) {
      console.warn("geocode failed", e);
    } finally {
      setSearching(false);
    }
  }

  async function toggleDrawing() {
    if (!mapRef.current || !window.google?.maps) {
      setLoadError("Map not ready — try refreshing.");
      return;
    }
    if (!window.google.maps.drawing) {
      try {
        await window.google.maps.importLibrary("drawing");
      } catch (e) {
        setLoadError("Drawing library failed to load. Check that the Maps JavaScript API allows the 'drawing' library on your key.");
        return;
      }
    }
    if (!drawingManagerRef.current) {
      const dm = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          strokeColor: "#FFD600",
          strokeWeight: 3,
          fillColor: "#FFD600",
          fillOpacity: 0.2,
          editable: false,
          clickable: false
        }
      });
      dm.setMap(mapRef.current);
      dm.addListener("polygoncomplete", (poly: any) => {
        const path = poly.getPath();
        const coords: LatLon[] = [];
        for (let i = 0; i < path.getLength(); i++) {
          const ll = path.getAt(i);
          coords.push({ lat: ll.lat(), lon: ll.lng() });
        }
        poly.setMap(null);
        dm.setDrawingMode(null);
        setDrawMode(false);
        if (coords.length < 3) return;
        const area = polygonAreaAcres(coords);
        if (area < 0.05) return;
        onDrawComplete({ coordinates: coords, areaAcres: area });
      });
      drawingManagerRef.current = dm;
    }
    const next = !drawMode;
    setDrawMode(next);
    drawingManagerRef.current.setDrawingMode(
      next ? window.google.maps.drawing.OverlayType.POLYGON : null
    );
  }

  return (
    <div className="relative h-full w-full bg-bg-surface">
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-dim pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && geocodeSearch()}
            placeholder="Search a city, district or village in Pakistan…"
            className="w-full glass border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm placeholder:text-muted-dim focus:border-accent-primary focus:outline-none focus:ring-4 focus:ring-accent-primary/15 transition"
          />
        </div>
        <button
          onClick={geocodeSearch}
          disabled={searching || !search.trim()}
          className="glass border border-white/10 rounded-full px-5 py-2.5 text-sm hover:border-accent-primary/40 disabled:opacity-40 inline-flex items-center gap-2"
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Find
        </button>
      </div>

      <div className="absolute top-20 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={toggleDrawing}
          className={`glass border rounded-full px-4 py-2 text-sm inline-flex items-center gap-2 transition ${
            drawMode
              ? "border-field-border bg-field-border/15 text-field-border"
              : "border-white/10 hover:border-accent-primary/40 text-white"
          }`}
        >
          {drawMode ? <X className="w-4 h-4" /> : <PencilLine className="w-4 h-4" />}
          {drawMode ? "Cancel drawing" : "Draw field"}
        </button>
        {drawMode && (
          <div className="glass border border-white/10 rounded-xl px-3 py-2 text-[11px] text-muted max-w-[220px] leading-relaxed">
            <strong className="text-white">Click each corner</strong> of your field on the map, then click the first point again to close. Pinch/scroll to zoom in for accuracy.
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-20 glass border border-white/10 rounded-xl px-3 py-2 text-[11px] text-muted-dim font-mono pointer-events-none">
        {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
      </div>

      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-30 p-6">
          <div className="glass border border-amber-400/40 rounded-2xl p-6 max-w-lg">
            <div className="text-amber-400 font-semibold mb-2 text-center">Google Maps failed to load</div>
            <div className="text-sm text-muted leading-relaxed">{loadError}</div>
            <div className="mt-4 pt-4 border-t border-white/10 text-[11px] text-muted-dim font-mono">
              key: {keyHint}
            </div>
            <div className="mt-3 text-[11px] text-muted-dim leading-relaxed">
              Also verify <strong className="text-white">Maps JavaScript API</strong>, <strong className="text-white">Geocoding API</strong>, and <strong className="text-white">Maps Static API</strong> are enabled in Google Cloud Console.
            </div>
          </div>
        </div>
      )}

      {!ready && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading satellite map…
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function centroidOf(coords: LatLon[]): LatLon {
  const n = coords.length;
  let lat = 0, lon = 0;
  for (const c of coords) { lat += c.lat; lon += c.lon; }
  return { lat: lat / n, lon: lon / n };
}
