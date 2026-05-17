"use client";

import Link from "next/link";
import { Sprout, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/map", label: "Live Map" },
  { href: "/#crops", label: "Crops" },
  { href: "/#how", label: "How it works" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-glow flex items-center justify-center shadow-glow-soft">
              <Sprout className="w-4 h-4 text-bg-base" strokeWidth={2.5} />
            </span>
            <span className="font-bold text-lg tracking-tight">
              Fasal<span className="text-accent-primary">AI</span>
            </span>
            <span className="hidden md:inline text-xs text-muted-dim ml-2 px-2 py-0.5 rounded-full border border-white/10">
              Pakistan
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/upload"
              className="px-5 py-2 rounded-full bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition shadow-glow-soft"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/5 px-6 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-white py-2"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/upload"
              onClick={() => setOpen(false)}
              className="mt-2 px-5 py-2 rounded-full bg-accent-primary text-white text-sm font-medium text-center"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
