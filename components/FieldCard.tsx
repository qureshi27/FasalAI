import { cn } from "@/lib/utils";

const TONES: Record<string, { bg: string; pattern: string; emoji: string }> = {
  wheat: {
    bg: "from-amber-700/50 via-amber-900/40 to-zinc-900",
    pattern: "repeating-linear-gradient(35deg, rgba(245,158,11,0.18) 0 6px, transparent 6px 14px)",
    emoji: "🌾"
  },
  cotton: {
    bg: "from-emerald-700/40 via-zinc-900 to-zinc-900",
    pattern: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.25) 2px, transparent 3px), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 2px, transparent 3px)",
    emoji: "🌱"
  },
  sugarcane: {
    bg: "from-green-700/50 via-emerald-900/40 to-zinc-900",
    pattern: "repeating-linear-gradient(90deg, rgba(34,197,94,0.25) 0 4px, transparent 4px 10px)",
    emoji: "🎋"
  },
  rice: {
    bg: "from-cyan-700/40 via-emerald-900/40 to-zinc-900",
    pattern: "repeating-linear-gradient(0deg, rgba(6,182,212,0.2) 0 8px, rgba(34,197,94,0.18) 8px 16px)",
    emoji: "🌾"
  },
  maize: {
    bg: "from-yellow-600/40 via-green-900/40 to-zinc-900",
    pattern: "repeating-linear-gradient(60deg, rgba(234,179,8,0.2) 0 5px, transparent 5px 12px)",
    emoji: "🌽"
  }
};

interface Props {
  crop: string;
  yieldText: string;
  area: string;
  tone: keyof typeof TONES;
  highlight?: boolean;
  featured?: boolean;
}

export function FieldCard({ crop, yieldText, area, tone, highlight, featured }: Props) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden border border-white/10",
        "bg-gradient-to-br shadow-card",
        t.bg,
        featured && "shadow-glow"
      )}
    >
      <div className="absolute inset-0" style={{ backgroundImage: t.pattern, backgroundSize: "auto" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <svg
        className="absolute inset-4"
        viewBox="0 0 200 240"
        fill="none"
        style={{ width: "calc(100% - 32px)", height: "calc(100% - 32px)" }}
      >
        <path
          d="M 20 30 L 180 25 L 175 200 L 25 210 Z"
          stroke="#FFD600"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          fill="rgba(255, 214, 0, 0.05)"
        />
        <circle cx="180" cy="25" r="4" fill="#FFD600" />
        <circle cx="20" cy="30" r="4" fill="#FFD600" />
        <circle cx="175" cy="200" r="4" fill="#FFD600" />
        <circle cx="25" cy="210" r="4" fill="#FFD600" />
      </svg>

      <div className="absolute bottom-3 left-3 right-3 glass rounded-xl px-3 py-2.5 border border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-white font-semibold text-sm">{crop}</div>
            <div className="text-muted-dim">{area}</div>
          </div>
          <div className="text-right">
            <div className="text-accent-glow font-mono font-bold">{yieldText}</div>
            <div className="text-muted-dim text-[10px] uppercase tracking-wider">expected</div>
          </div>
        </div>
      </div>

      {highlight && (
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-accent-primary/20 border border-accent-primary/40 text-[10px] uppercase tracking-wider text-accent-glow">
          Live
        </div>
      )}
    </div>
  );
}
