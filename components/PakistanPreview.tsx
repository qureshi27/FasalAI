"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PakistanPreview() {
  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-bg-elevated to-bg-surface p-8 md:p-16">
          <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />
          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs uppercase tracking-wider text-accent-glow font-medium">Coverage</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
                Every district.<br />Every season.
              </h2>
              <p className="mt-5 text-muted text-balance">
                From the wheat belts of Faisalabad and Sahiwal to the cotton fields of Multan and Bahawalpur, and the sugarcane plantations of Khairpur — FasalAI works wherever Pakistani farmers grow.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm">
                <Stat label="Provinces" value="4" />
                <Stat label="Crops" value="10+" />
                <Stat label="Map resolution" value="10m" />
                <Stat label="Unit" value="Mann" />
              </div>
              <Link
                href="/map"
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 shadow-glow-soft transition"
              >
                Try the live map <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative aspect-square max-w-md mx-auto">
              <PakistanShape />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold font-mono text-accent-glow">{value}</div>
      <div className="text-xs text-muted-dim uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function PakistanShape() {
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <radialGradient id="pkGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#4D9BFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4D9BFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pkFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4D9BFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="180" fill="url(#pkGlow)" />
      <path
        d="M 140 60 L 200 50 L 250 80 L 290 90 L 310 130 L 330 170 L 320 220 L 280 250 L 260 290 L 240 330 L 200 350 L 160 340 L 130 310 L 100 280 L 80 230 L 90 180 L 110 130 Z"
        fill="url(#pkFill)"
        stroke="#FFD600"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      {[
        { x: 200, y: 130, name: "Punjab" },
        { x: 170, y: 280, name: "Sindh" },
        { x: 130, y: 100, name: "KPK" },
        { x: 110, y: 220, name: "Balochistan" }
      ].map((p) => (
        <g key={p.name}>
          <circle cx={p.x} cy={p.y} r="4" fill="#FFD600">
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={p.x} cy={p.y} r="4" fill="#FFD600" opacity="0.3">
            <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={p.x + 10} y={p.y + 4} fill="#B4B4BE" fontSize="11" fontFamily="Inter">
            {p.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
