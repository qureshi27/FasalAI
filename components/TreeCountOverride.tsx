"use client";

import { useEffect, useState } from "react";
import { Loader2, TreePine, Undo2 } from "lucide-react";

interface Props {
  currentTreeCount: number | null | undefined;
  aiTreeCount: number | null | undefined;
  disabled: boolean;
  onApply: (treeCount: number) => void;
}

export function TreeCountOverride({ currentTreeCount, aiTreeCount, disabled, onApply }: Props) {
  const [value, setValue] = useState<string>(currentTreeCount ? String(currentTreeCount) : "");

  useEffect(() => {
    setValue(currentTreeCount ? String(currentTreeCount) : "");
  }, [currentTreeCount]);

  const parsed = parseInt(value, 10);
  const valid = !Number.isNaN(parsed) && parsed >= 0 && parsed <= 100_000;
  const changed = valid && parsed !== currentTreeCount;

  return (
    <div className="rounded-2xl border border-white/10 bg-bg-elevated p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-muted-dim flex items-center gap-1.5">
          <TreePine className="w-3.5 h-3.5" /> Tree count
        </div>
        {aiTreeCount !== null && aiTreeCount !== undefined && (
          <span className="text-[10px] text-muted-dim">AI suggested: <span className="font-mono text-muted">{aiTreeCount}</span></span>
        )}
      </div>
      <p className="text-xs text-muted mb-3">
        Walk-counted the trees yourself, or know the planting plan? Enter the real number and we'll recalculate yield with <strong className="text-white">trees × kg/tree</strong>.
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="e.g. 168"
          className="flex-1 bg-bg-base border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:border-accent-primary focus:outline-none focus:ring-4 focus:ring-accent-primary/15 transition"
        />
        <button
          onClick={() => valid && onApply(parsed)}
          disabled={disabled || !changed}
          className="px-4 py-2 rounded-full bg-accent-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-accent-primary/90 transition"
        >
          {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recalculate"}
        </button>
        {aiTreeCount !== null && aiTreeCount !== undefined && aiTreeCount !== currentTreeCount && (
          <button
            onClick={() => onApply(aiTreeCount)}
            disabled={disabled}
            title="Reset to AI count"
            className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-muted-dim hover:text-white hover:border-white/20 disabled:opacity-40 transition inline-flex items-center gap-1"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
