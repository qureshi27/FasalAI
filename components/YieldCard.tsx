import { Sparkles, TrendingUp, Coins, Activity, AlertTriangle, Wheat } from "lucide-react";
import type { YieldResult } from "@/lib/yield";
import { formatPKR } from "@/lib/yield";
import { CROPS, type CropId } from "@/lib/crops";

const HEALTH_COLOR: Record<YieldResult["health"], string> = {
  excellent: "text-emerald-400",
  good: "text-green-400",
  moderate: "text-amber-400",
  poor: "text-red-400",
  "n/a": "text-muted-dim"
};

export function YieldCard({ result, confidencePct }: { result: YieldResult; confidencePct?: number }) {
  if (result.status !== "estimated") {
    return <NonStandingCard result={result} />;
  }

  const crop = CROPS[result.cropId as CropId];
  return (
    <div className="relative rounded-2xl border border-white/10 bg-bg-elevated overflow-hidden shadow-card">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent" />
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{crop.emoji}</div>
            <div>
              <div className="text-xs text-muted-dim uppercase tracking-wider">
                {crop.kind === "orchard" ? "Identified orchard" : "Identified crop"}
              </div>
              <h3 className="text-2xl font-bold">{result.cropName}</h3>
              <div className="text-sm text-muted-dim" dir="rtl">{result.urduName}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border bg-white/5 ${HEALTH_COLOR[result.health]} border-current/20`}>
              {result.health}
            </span>
            {confidencePct !== undefined && (
              <span className="text-[10px] text-muted-dim uppercase tracking-wider">
                {confidencePct}% confidence
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Activity} label="Area" value={`${result.areaAcres}`} unit="acres" />
          <Stat icon={TrendingUp} label="Yield rate" value={`${result.yieldMannPerAcre}`} unit="mann/acre" />
          <Stat icon={Sparkles} label="Total" value={`${result.totalMann.toLocaleString("en-PK")}`} unit="mann" highlight />
          <Stat icon={Coins} label="Value" value={formatPKR(result.estimatedValuePKR)} unit="" />
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-dim mb-2">Calculation</div>
            <ul className="text-xs text-muted space-y-1">
              {result.notes.map((n, i) => <li key={i}>• {n}</li>)}
              <li>• Total weight: <span className="font-mono text-white">{result.totalKg.toLocaleString("en-PK")} kg</span></li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-dim mb-2">Best regions</div>
            <div className="flex flex-wrap gap-1.5">
              {crop.primaryRegions.map((r) => (
                <span key={r} className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted">
                  {r}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted mt-3">
              {crop.harvestMonths.length > 0 && (
                <>Harvest window: month {crop.harvestMonths.join(", ")} · </>
              )}
              Season: {crop.season}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NonStandingCard({ result }: { result: YieldResult }) {
  const tone =
    result.status === "harvested"
      ? { border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-300", icon: Wheat, title: "Field appears already harvested" }
      : result.status === "fallow"
      ? { border: "border-zinc-500/30", bg: "bg-zinc-500/5", text: "text-zinc-300", icon: AlertTriangle, title: "Fallow field" }
      : { border: "border-zinc-500/30", bg: "bg-zinc-500/5", text: "text-zinc-300", icon: AlertTriangle, title: "Could not identify crop" };

  const Icon = tone.icon;
  return (
    <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-6`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl border ${tone.border} bg-white/5 flex items-center justify-center ${tone.text}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${tone.text}`}>{tone.title}</h3>
          <ul className="mt-3 text-sm text-muted space-y-1.5">
            {result.notes.map((n, i) => <li key={i}>• {n}</li>)}
            <li>• Area outlined: <span className="font-mono text-white">{result.areaAcres} acres</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  highlight
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-accent-primary/30 bg-accent-primary/5" : "border-white/5 bg-white/[0.02]"}`}>
      <div className="flex items-center gap-1.5 text-muted-dim text-[10px] uppercase tracking-wider mb-2">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`font-mono font-bold text-lg ${highlight ? "text-accent-glow" : "text-white"}`}>
        {value}
        {unit && <span className="text-xs text-muted-dim font-sans font-normal ml-1">{unit}</span>}
      </div>
    </div>
  );
}
