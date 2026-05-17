"use client";

import { useState } from "react";
import { Loader2, MapPin, Sparkles, AlertCircle, PencilLine, Search as SearchIcon, RefreshCw } from "lucide-react";
import { GoogleFieldMap } from "@/components/GoogleFieldMap";
import { YieldCard } from "@/components/YieldCard";
import { TreeCountOverride } from "@/components/TreeCountOverride";
import type { LatLon, Polygon } from "@/lib/geo";
import type { YieldResult } from "@/lib/yield";
import type { CropIdentification } from "@/lib/nvidia";
import { CROPS, CROP_LIST, type CropId } from "@/lib/crops";

interface FieldAnalysis {
  polygon: Polygon;
  identification: CropIdentification;
  yield: YieldResult;
}

export default function MapPage() {
  const [point, setPoint] = useState<LatLon | null>(null);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [analyses, setAnalyses] = useState<Record<number, FieldAnalysis>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [analyzingIdx, setAnalyzingIdx] = useState<number | null>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClickPoint(p: LatLon) {
    setPoint(p);
    setError(null);
  }

  function handleDrawComplete(poly: Polygon) {
    setPolygons((prev) => {
      const next = [...prev, poly];
      const newIdx = next.length - 1;
      setTimeout(() => analyzeField(newIdx, next), 50);
      return next;
    });
  }

  async function autoDetect() {
    if (!point) return;
    setAutoDetecting(true);
    setError(null);
    try {
      const res = await fetch("/api/segment-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: point.lat, lon: point.lon })
      });
      if (!res.ok) throw new Error(`Detection failed (${res.status})`);
      const data = await res.json();
      const fetched: Polygon[] = data.polygons ?? [];
      if (fetched.length === 0) {
        setError("No farmland boundaries found in OpenStreetMap for this area. Use \"Draw field\" to outline manually for accurate results.");
      } else if (data.source === "synthetic") {
        setError("OSM has no field data here. Showing placeholder rectangles — please use \"Draw field\" for real boundaries.");
        setPolygons(fetched);
      } else {
        setPolygons(fetched);
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to detect fields");
    } finally {
      setAutoDetecting(false);
    }
  }

  async function analyzeField(i: number, polys: Polygon[] = polygons, forceCrop: CropId | null = null) {
    const poly = polys[i];
    if (!poly || !point) return;
    setAnalyzingIdx(i);
    setSelectedIdx(i);
    setError(null);
    try {
      const res = await fetch("/api/analyze-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          center: { lat: point.lat, lon: point.lon },
          polygon: poly,
          forceCrop
        })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Analysis failed (${res.status}): ${txt.slice(0, 200)}`);
      }
      const data = await res.json();
      setAnalyses((prev) => ({
        ...prev,
        [i]: { polygon: poly, identification: data.identification, yield: data.yield }
      }));
    } catch (e: any) {
      setError(e.message ?? "Analysis failed");
    } finally {
      setAnalyzingIdx(null);
    }
  }

  async function recalcWithTreeCount(idx: number, treeCount: number) {
    const a = analyses[idx];
    if (!a) return;
    setAnalyzingIdx(idx);
    setError(null);
    try {
      const res = await fetch("/api/estimate-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: a.identification.cropId,
          areaAcres: a.polygon.areaAcres,
          ndvi: a.identification.ndviEstimate,
          landCover: a.identification.landCover,
          isHarvested: a.identification.isHarvested,
          treeCount,
          treeCountConfidence: "exact",
          isUserTreeOverride: true
        })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Recalc failed (${res.status}): ${txt.slice(0, 200)}`);
      }
      const updated: YieldResult = await res.json();
      setAnalyses((prev) => ({
        ...prev,
        [idx]: { ...a, yield: updated }
      }));
    } catch (e: any) {
      setError(e.message ?? "Recalc failed");
    } finally {
      setAnalyzingIdx(null);
    }
  }

  function clearAll() {
    setPolygons([]);
    setAnalyses({});
    setSelectedIdx(null);
    setError(null);
  }

  const selected = selectedIdx !== null ? analyses[selectedIdx] : null;
  const selectedCropInfo = selected && selected.identification.cropId !== "unknown"
    ? CROPS[selected.identification.cropId as CropId]
    : null;

  return (
    <div className="relative pt-[72px]">
      <div className="grid lg:grid-cols-[1fr_440px] h-[calc(100vh-72px)]">
        <div className="relative border-r border-white/5">
          <GoogleFieldMap
            onClickPoint={handleClickPoint}
            onDrawComplete={handleDrawComplete}
            polygons={polygons}
            selectedPolygonIndex={selectedIdx}
            onPolygonClick={(i) => analyzeField(i)}
          />
        </div>

        <aside className="overflow-y-auto bg-bg-surface">
          <div className="p-6 border-b border-white/5">
            <div className="text-xs uppercase tracking-wider text-accent-glow font-medium">Live satellite</div>
            <h1 className="mt-2 text-2xl font-bold">Outline your field</h1>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">
              For accurate results, click <strong className="text-white">Draw field</strong> on the map and trace your actual field corner-by-corner. Auto-detect is a quick approximation using OpenStreetMap.
            </p>
          </div>

          <div className="p-6 border-b border-white/5 space-y-3">
            <button
              onClick={autoDetect}
              disabled={!point || autoDetecting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm hover:border-white/20 disabled:opacity-40 transition"
            >
              {autoDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
              Auto-detect nearby fields (OSM)
            </button>
            {polygons.length > 0 && (
              <button
                onClick={clearAll}
                className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-full text-xs text-muted-dim hover:text-white transition"
              >
                <RefreshCw className="w-3 h-3" /> Clear all fields
              </button>
            )}
          </div>

          {!point && (
            <div className="p-6 text-center text-muted">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-dim" />
              <div className="text-sm">No location selected</div>
              <div className="text-xs text-muted-dim mt-1">Search or click anywhere on the map</div>
            </div>
          )}

          {point && polygons.length === 0 && !autoDetecting && (
            <div className="p-6 text-sm text-muted text-center">
              <PencilLine className="w-8 h-8 mx-auto mb-3 text-muted-dim" />
              No fields yet. Tap <span className="text-white font-medium">Draw field</span> on the map to outline one.
            </div>
          )}

          {polygons.length > 0 && (
            <div className="p-6 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-dim mb-2">
                {polygons.length} field{polygons.length > 1 ? "s" : ""}
              </div>
              {polygons.map((poly, i) => {
                const a = analyses[i];
                const isAnalyzing = analyzingIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => analyzeField(i)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      selectedIdx === i
                        ? "border-accent-primary/40 bg-accent-primary/5"
                        : "border-white/10 bg-bg-elevated hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-field-border" />
                          Field {i + 1}
                        </div>
                        <div className="text-xs text-muted mt-0.5 font-mono">
                          {poly.areaAcres.toFixed(2)} acres · {poly.coordinates.length} corners
                        </div>
                      </div>
                      {a ? (
                        <div className="text-right">
                          <div className="text-xs font-medium text-white flex items-center gap-1 justify-end">
                            {a.yield.status === "harvested" && <span className="text-amber-400">Harvested</span>}
                            {a.yield.status === "fallow" && <span className="text-muted-dim">Fallow</span>}
                            {a.yield.status === "unknown" && <span className="text-muted-dim">Unknown</span>}
                            {a.yield.status === "estimated" && a.identification.cropId !== "unknown" && (
                              <>
                                <span>{CROPS[a.identification.cropId as CropId].emoji}</span>
                                {a.yield.cropName}
                              </>
                            )}
                          </div>
                          {a.yield.status === "estimated" && (
                            <div className="text-xs font-mono text-accent-glow mt-0.5">
                              {a.yield.totalMann.toLocaleString("en-PK")} mann
                            </div>
                          )}
                        </div>
                      ) : isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin text-accent-glow" />
                      ) : (
                        <span className="text-xs text-accent-primary inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Analyze
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="m-6 flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {selected && selectedIdx !== null && (
            <div className="p-6 border-t border-white/5 space-y-4">
              <ObservationStrip identification={selected.identification} />
              <YieldCard
                result={selected.yield}
                confidencePct={Math.round(selected.identification.confidence * 100)}
              />
              {selectedCropInfo?.kind === "orchard" && (
                <TreeCountOverride
                  currentTreeCount={selected.yield.treeCount}
                  aiTreeCount={selected.identification.treeCount}
                  disabled={analyzingIdx === selectedIdx}
                  onApply={(n) => recalcWithTreeCount(selectedIdx!, n)}
                />
              )}
              <CropOverride
                currentCrop={selected.identification.cropId}
                disabled={analyzingIdx === selectedIdx}
                onOverride={(cropId) => analyzeField(selectedIdx!, polygons, cropId)}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ObservationStrip({ identification }: { identification: CropIdentification }) {
  const labels: Record<string, string> = {
    standing_crop: "Standing crop",
    orchard: "Orchard / trees",
    harvested: "Harvested",
    fallow: "Fallow",
    water: "Water / flooded",
    non_agricultural: "Non-agricultural",
    unknown: "Unclear"
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5">
      <div className="text-xs uppercase tracking-wider text-muted-dim mb-3">AI observation</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-dim text-[10px] uppercase tracking-wider mb-1">Land cover</div>
          <div className="font-medium">{labels[identification.landCover] ?? identification.landCover}</div>
        </div>
        <div>
          <div className="text-muted-dim text-[10px] uppercase tracking-wider mb-1">Growth stage</div>
          <div className="font-medium capitalize">{identification.growthStage.replace(/_/g, " ")}</div>
        </div>
        <div>
          <div className="text-muted-dim text-[10px] uppercase tracking-wider mb-1">NDVI estimate</div>
          <div className="font-mono text-accent-glow">{identification.ndviEstimate.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-dim text-[10px] uppercase tracking-wider mb-1">Confidence</div>
          <div className="font-mono">{Math.round(identification.confidence * 100)}%</div>
        </div>
      </div>
      {identification.visualCues && (
        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-muted leading-relaxed">
          <span className="text-muted-dim">Cues: </span>{identification.visualCues}
        </div>
      )}
    </div>
  );
}

function CropOverride({
  currentCrop,
  disabled,
  onOverride
}: {
  currentCrop: CropId | "unknown";
  disabled: boolean;
  onOverride: (cropId: CropId) => void;
}) {
  const [value, setValue] = useState<string>("");
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5">
      <div className="text-xs uppercase tracking-wider text-muted-dim mb-2">Wrong crop? Override</div>
      <p className="text-xs text-muted mb-3">
        If you know what's growing in this field, pick it and we'll recalculate the yield with that crop's baselines.
      </p>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-bg-base border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-accent-primary focus:outline-none"
        >
          <option value="">Select crop…</option>
          {CROP_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name} {c.kind === "orchard" ? "(orchard)" : ""}
            </option>
          ))}
        </select>
        <button
          onClick={() => value && onOverride(value as CropId)}
          disabled={disabled || !value || value === currentCrop}
          className="px-4 py-2 rounded-full bg-accent-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-accent-primary/90 transition"
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
        </button>
      </div>
    </div>
  );
}
