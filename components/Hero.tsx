"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Upload, MapPin } from "lucide-react";
import { FieldCard } from "./FieldCard";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
      <div className="absolute inset-0 stars opacity-60 pointer-events-none" />
      <div className="absolute inset-0 dots opacity-50 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-muted mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse-glow" />
          Powered by NVIDIA AI · TomTom Maps · Pakistan-only
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-balance text-gradient-blue"
        >
          Know your harvest<br />before you reap it
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-muted max-w-2xl mx-auto text-balance"
        >
          Outline any field in Pakistan, identify the crop, and estimate yield in <span className="text-white font-medium">mann</span> — wheat, cotton, sugarcane, rice, maize and more.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/upload"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent-primary text-white font-medium shadow-glow-soft hover:shadow-glow transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload field image
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            <MapPin className="w-4 h-4" />
            Open live map
          </Link>
        </motion.div>

        <HeroShowcase />
      </div>
    </section>
  );
}

function HeroShowcase() {
  return (
    <div className="relative mt-20 h-[420px] md:h-[480px]">
      <div className="absolute inset-0 flex items-end justify-center gap-4 md:gap-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="hidden md:block w-64 h-80 -mr-4 z-10"
          style={{ transform: "rotate(-9deg)" }}
        >
          <FieldCard crop="Cotton" yieldText="42 mann" area="1.8 acres" tone="cotton" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-56 md:w-72 h-72 md:h-96 z-20"
          style={{ transform: "rotate(-4deg)" }}
        >
          <FieldCard crop="Wheat" yieldText="68 mann" area="2.0 acres" tone="wheat" highlight />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-60 md:w-80 h-80 md:h-[420px] z-30"
        >
          <FieldCard crop="Sugarcane" yieldText="1,260 mann" area="1.8 acres" tone="sugarcane" featured />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-56 md:w-72 h-72 md:h-96 z-20"
          style={{ transform: "rotate(4deg)" }}
        >
          <FieldCard crop="Rice" yieldText="56 mann" area="2.0 acres" tone="rice" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="hidden md:block w-64 h-80 -ml-4 z-10"
          style={{ transform: "rotate(9deg)" }}
        >
          <FieldCard crop="Maize" yieldText="148 mann" area="2.0 acres" tone="maize" />
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg-base to-transparent pointer-events-none" />
    </div>
  );
}
