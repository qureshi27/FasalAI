"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { YieldCard } from "@/components/YieldCard";
import { CROP_LIST, type CropId } from "@/lib/crops";
import type { YieldResult } from "@/lib/yield";
import type { CropIdentification } from "@/lib/nvidia";

type Status = "idle" | "ready" | "analyzing" | "done" | "error";

export default function UploadPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [imageData, setImageData] = useState<string | null>(null);
  const [areaAcres, setAreaAcres] = useState<number>(2);
  const [manualCrop, setManualCrop] = useState<CropId | "auto">("auto");
  const [identification, setIdentification] = useState<CropIdentification | null>(null);
  const [yieldResult, setYieldResult] = useState<YieldResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(dataUrl: string) {
    setImageData(dataUrl);
    setStatus("ready");
    setError(null);
    setIdentification(null);
    setYieldResult(null);
  }

  async function analyze() {
    if (!imageData) return;
    setStatus("analyzing");
    setError(null);
    try {
      const idRes = await fetch("/api/identify-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, forceCrop: manualCrop === "auto" ? null : manualCrop })
      });
      if (!idRes.ok) throw new Error(`Identification failed (${idRes.status})`);
      const id: CropIdentification = await idRes.json();
      setIdentification(id);

      const yRes = await fetch("/api/estimate-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropId: id.cropId,
          areaAcres,
          ndvi: id.ndviEstimate,
          landCover: id.landCover,
          isHarvested: id.isHarvested,
          treeCount: id.treeCount,
          treeCountConfidence: id.treeCountConfidence
        })
      });
      if (!yRes.ok) throw new Error(`Yield estimation failed (${yRes.status})`);
      const y: YieldResult = await yRes.json();
      setYieldResult(y);
      setStatus("done");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setStatus("error");
    }
  }

  return (
    <div className="relative min-h-screen pt-32 pb-24">
      <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />
      <div className="absolute inset-0 stars opacity-30 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-wider text-accent-glow font-medium">Upload</span>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-balance text-gradient-blue">
            Analyze any field image
          </h1>
          <p className="mt-4 text-muted max-w-xl mx-auto text-balance">
            Drone shots, phone photos, or satellite screenshots — we'll identify the crop and estimate yield in mann.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
          <UploadDropzone onFile={handleFile} disabled={status === "analyzing"} />

          <div className="bg-bg-elevated border border-white/10 rounded-2xl p-5 space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-dim block mb-2">
                Field area (acres)
              </label>
              <input
                type="number"
                value={areaAcres}
                step="0.1"
                min="0.1"
                onChange={(e) => setAreaAcres(parseFloat(e.target.value) || 0)}
                className="w-full bg-bg-base border border-white/10 rounded-xl px-4 py-2.5 font-mono text-lg focus:border-accent-primary focus:outline-none focus:ring-4 focus:ring-accent-primary/15 transition"
              />
              <div className="text-[11px] text-muted-dim mt-1">1 acre ≈ 4,047 m² ≈ 8 kanal</div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted-dim block mb-2">
                Crop (optional)
              </label>
              <select
                value={manualCrop}
                onChange={(e) => setManualCrop(e.target.value as any)}
                className="w-full bg-bg-base border border-white/10 rounded-xl px-4 py-2.5 focus:border-accent-primary focus:outline-none"
              >
                <option value="auto">🤖 Auto-detect with AI</option>
                {CROP_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={analyze}
              disabled={status !== "ready" || !imageData}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-accent-primary text-white font-medium shadow-glow-soft hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {status === "analyzing" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Estimate yield</>
              )}
            </button>

            {status === "analyzing" && (
              <div className="text-xs text-muted-dim space-y-1">
                <div>• Sending to NVIDIA vision model…</div>
                <div>• Computing NDVI proxy…</div>
                <div>• Calibrating against Pakistan baselines…</div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Analysis failed</div>
              <div className="text-red-300/80 mt-1">{error}</div>
              <div className="text-xs text-muted-dim mt-2">
                Check that <code className="text-white">NVIDIA_API_KEY</code> is set in environment variables.
              </div>
            </div>
          </div>
        )}

        {status === "done" && identification && yieldResult && (
          <div className="mt-10 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5">
              <div className="text-xs uppercase tracking-wider text-muted-dim mb-3">AI observation</div>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-dim text-xs mb-1">Land cover</div>
                  <div className="font-medium capitalize">{identification.landCover.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <div className="text-muted-dim text-xs mb-1">Growth stage</div>
                  <div className="font-medium capitalize">{identification.growthStage.replace(/_/g, " ")}</div>
                </div>
                <div>
                  <div className="text-muted-dim text-xs mb-1">NDVI estimate</div>
                  <div className="font-mono text-accent-glow">{identification.ndviEstimate.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-dim text-xs mb-1">Visual cues</div>
                  <div className="text-muted text-xs leading-relaxed">{identification.visualCues}</div>
                </div>
              </div>
            </div>

            <YieldCard
              result={yieldResult}
              confidencePct={Math.round(identification.confidence * 100)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
