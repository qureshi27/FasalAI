"use client";

import { motion } from "framer-motion";
import { MapPin, Sparkles, BarChart3 } from "lucide-react";

const STEPS = [
  {
    icon: MapPin,
    title: "1. Pick the field",
    body: "Choose any location in Pakistan on our TomTom map or upload a field photo from your phone. We draw a yellow border around the field area in acres."
  },
  {
    icon: Sparkles,
    title: "2. AI identifies the crop",
    body: "NVIDIA's vision model analyzes the imagery and identifies which Pakistani crop is growing — wheat, cotton, sugarcane, rice, maize, mustard and more."
  },
  {
    icon: BarChart3,
    title: "3. Get yield in mann",
    body: "Using NDVI health, growth stage, and Pakistan baseline data, we estimate expected output in mann (1 mann = 40 kg) and rupee value."
  }
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24 md:py-32">
      <div className="absolute inset-0 bg-radial-deep opacity-50 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-wider text-accent-glow font-medium">How it works</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-balance">
            From map to mann in three steps
          </h2>
          <p className="mt-4 text-muted text-balance">
            No agronomy degree required. Built for farmers, agents and aggregators across Punjab, Sindh, KPK and Balochistan.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-bg-elevated/80 border border-white/[0.06] rounded-2xl p-6 hover:border-white/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-accent-glow" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
