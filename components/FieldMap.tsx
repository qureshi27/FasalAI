"use client";

import { useEffect, useRef, useState } from "react";
import { PAKISTAN_BBOX, PAKISTAN_CENTER, isInsidePakistan, type LatLon, type Polygon } from "@/lib/geo";

interface Props {
  onSelect: (point: LatLon) => void;
  polygons: Polygon[];
  selectedPolygonIndex?: number | null;
  onPolygonClick?: (i: number) => void;
}

const TILE_SIZE = 256;

export function FieldMap({ onSelect, polygons, selectedPolygonIndex, onPolygonClick }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(14);
  const [center, setCenter] = useState<LatLon>({ lat: 31.5204, lon: 74.3587 });
  const [pin, setPin] = useState<LatLon | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function lonLatToPixel(p: LatLon): { x: number; y: number } {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const cx = ((center.lon + 180) / 360) * scale;
    const cy = (1 - Math.log(Math.tan((center.lat * Math.PI) / 180) + 1 / Math.cos((center.lat * Math.PI) / 180)) / Math.PI) / 2 * scale;
    const px = ((p.lon + 180) / 360) * scale;
    const py = (1 - Math.log(Math.tan((p.lat * Math.PI) / 180) + 1 / Math.cos((p.lat * Math.PI) / 180)) / Math.PI) / 2 * scale;
    return { x: size.w / 2 + (px - cx), y: size.h / 2 + (py - cy) };
  }

  function pixelToLonLat(x: number, y: number): LatLon {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const cx = ((center.lon + 180) / 360) * scale;
    const cy = (1 - Math.log(Math.tan((center.lat * Math.PI) / 180) + 1 / Math.cos((center.lat * Math.PI) / 180)) / Math.PI) / 2 * scale;
    const worldX = cx + (x - size.w / 2);
    const worldY = cy + (y - size.h / 2);
    const lon = (worldX / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * worldY) / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { lat, lon };
  }

  function getTiles() {
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const cx = ((center.lon + 180) / 360) * scale;
    const cy = (1 - Math.log(Math.tan((center.lat * Math.PI) / 180) + 1 / Math.cos((center.lat * Math.PI) / 180)) / Math.PI) / 2 * scale;

    const tilesX = Math.ceil(size.w / TILE_SIZE) + 2;
    const tilesY = Math.ceil(size.h / TILE_SIZE) + 2;

    const tcx = Math.floor(cx / TILE_SIZE);
    const tcy = Math.floor(cy / TILE_SIZE);

    const tiles: { x: number; y: number; left: number; top: number }[] = [];
    for (let dx = -Math.floor(tilesX / 2); dx <= Math.floor(tilesX / 2); dx++) {
      for (let dy = -Math.floor(tilesY / 2); dy <= Math.floor(tilesY / 2); dy++) {
        const tx = tcx + dx;
        const ty = tcy + dy;
        if (tx < 0 || ty < 0 || tx >= Math.pow(2, zoom) || ty >= Math.pow(2, zoom)) continue;
        const left = size.w / 2 + (tx * TILE_SIZE - cx);
        const top = size.h / 2 + (ty * TILE_SIZE - cy);
        tiles.push({ x: tx, y: ty, left, top });
      }
    }
    return tiles;
  }

  const tiles = getTiles();

  async function geocodeSearch() {
    if (!search.trim() || !apiKey) return;
    setSearching(true);
    try {
      const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(search + " Pakistan")}.json?key=${apiKey}&countrySet=PK&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      const r = data?.results?.[0];
      if (r?.position) {
        const lp = { lat: r.position.lat, lon: r.position.lon };
        if (isInsidePakistan(lp)) {
          setCenter(lp);
          setPin(lp);
          onSelect(lp);
        }
      }
    } finally {
      setSearching(false);
    }
  }

  const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, cx: center.lon, cy: center.lat };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const scale = TILE_SIZE * Math.pow(2, zoom);
    const dLon = (-dx / scale) * 360;
    const newLon = dragRef.current.cx + dLon;
    const lat = dragRef.current.cy;
    const startY = (1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * scale;
    const newY = startY - dy;
    const n = Math.PI - (2 * Math.PI * newY) / scale;
    const newLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    const clampedLat = Math.max(PAKISTAN_BBOX.minLat, Math.min(PAKISTAN_BBOX.maxLat, newLat));
    const clampedLon = Math.max(PAKISTAN_BBOX.minLon, Math.min(PAKISTAN_BBOX.maxLon, newLon));
    setCenter({ lat: clampedLat, lon: clampedLon });
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    setZoom((z) => Math.max(6, Math.min(18, z + delta)));
  }

  function onClick(e: React.MouseEvent) {
    if (!containerRef.current) return;
    if (dragRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const p = pixelToLonLat(e.clientX - r.left, e.clientY - r.top);
    if (!isInsidePakistan(p)) return;
    setPin(p);
    onSelect(p);
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 left-4 right-4 z-20 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && geocodeSearch()}
          placeholder="Search a city or district in Pakistan…"
          className="flex-1 glass border border-white/10 rounded-full px-5 py-2.5 text-sm placeholder:text-muted-dim focus:border-accent-primary focus:outline-none focus:ring-4 focus:ring-accent-primary/15 transition"
        />
        <button
          onClick={geocodeSearch}
          disabled={searching || !search.trim()}
          className="glass border border-white/10 rounded-full px-5 py-2.5 text-sm hover:border-accent-primary/40 disabled:opacity-40"
        >
          {searching ? "…" : "Find"}
        </button>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 glass border border-white/10 rounded-xl p-1">
        <button onClick={() => setZoom((z) => Math.min(18, z + 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 text-lg">+</button>
        <button onClick={() => setZoom((z) => Math.max(6, z - 1))} className="w-9 h-9 rounded-lg hover:bg-white/10 text-lg">−</button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 glass border border-white/10 rounded-xl px-3 py-2 text-[11px] text-muted-dim font-mono">
        {center.lat.toFixed(4)}, {center.lon.toFixed(4)} · z{zoom}
      </div>

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClick={onClick}
        className="h-full w-full overflow-hidden bg-bg-surface relative select-none touch-none cursor-crosshair"
        style={{ touchAction: "none" }}
      >
        {!apiKey && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="glass border border-amber-400/40 rounded-2xl p-6 max-w-md text-center">
              <div className="text-amber-400 font-semibold mb-2">TomTom API key missing</div>
              <div className="text-sm text-muted">
                Set <code className="text-white">NEXT_PUBLIC_TOMTOM_API_KEY</code> in your <code className="text-white">.env.local</code> and reload.
              </div>
            </div>
          </div>
        )}

        {apiKey && tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}-${zoom}`}
            src={`https://api.tomtom.com/map/1/tile/sat/main/${zoom}/${t.x}/${t.y}.jpg?key=${apiKey}`}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{ left: t.left, top: t.top, width: TILE_SIZE, height: TILE_SIZE }}
          />
        ))}

        <svg className="absolute inset-0 pointer-events-none" width={size.w} height={size.h}>
          {polygons.map((poly, i) => {
            const pts = poly.coordinates.map(lonLatToPixel);
            const d = pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
            const isSelected = selectedPolygonIndex === i;
            return (
              <g key={i} className="pointer-events-auto" onClick={(e) => { e.stopPropagation(); onPolygonClick?.(i); }} style={{ cursor: "pointer" }}>
                <path
                  d={d}
                  fill={isSelected ? "rgba(255, 214, 0, 0.18)" : "rgba(255, 214, 0, 0.08)"}
                  stroke="#FFD600"
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={isSelected ? "" : "6 4"}
                />
                {pts.map((p, j) => (
                  <circle key={j} cx={p.x} cy={p.y} r={isSelected ? 5 : 3} fill="#FFD600" />
                ))}
                {pts.length > 0 && (
                  <text x={pts[0].x + 8} y={pts[0].y - 8} fill="#FFD600" fontSize="11" fontFamily="JetBrains Mono">
                    Field {i + 1} · {poly.areaAcres.toFixed(2)} ac
                  </text>
                )}
              </g>
            );
          })}

          {pin && (
            <g>
              {(() => {
                const p = lonLatToPixel(pin);
                return (
                  <>
                    <circle cx={p.x} cy={p.y} r="18" fill="rgba(77, 155, 255, 0.2)">
                      <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={p.x} cy={p.y} r="8" fill="#4D9BFF" stroke="#fff" strokeWidth="2" />
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
