"use client";

import { motion } from "framer-motion";
import { CROP_LIST } from "@/lib/crops";

export function CropsGrid() {
  return (
    <section id="crops" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs uppercase tracking-wider text-accent-glow font-medium">Supported crops</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
              Built for Pakistani agriculture
            </h2>
          </div>
          <p className="text-muted max-w-md text-sm md:text-base">
            All major Rabi and Kharif crops with localized baselines for Punjab, Sindh, KPK and Balochistan.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CROP_LIST.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="group relative bg-bg-elevated/60 border border-white/[0.06] rounded-2xl p-5 hover:border-accent-primary/30 hover:bg-bg-elevated transition-all"
            >
              <div className="text-3xl mb-3">{c.emoji}</div>
              <h3 className="font-semibold text-sm">{c.name}</h3>
              <p className="text-xs text-muted-dim mt-0.5" dir="rtl">{c.urduName}</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="text-xs text-muted">
                  <span className="font-mono text-accent-glow">{c.baselineYieldMannPerAcre.avg}</span> mann/acre avg
                </div>
                <div className="text-[10px] text-muted-dim uppercase tracking-wider mt-1">
                  {c.season === "annual" ? "Year-round" : c.season}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
