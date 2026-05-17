import Link from "next/link";
import { Sprout } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-primary to-accent-glow flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5 text-bg-base" strokeWidth={2.5} />
            </span>
            <span className="font-bold tracking-tight">
              Fasal<span className="text-accent-primary">AI</span>
            </span>
          </div>
          <p className="text-sm text-muted max-w-sm">
            AI-powered crop yield estimation for Pakistani farmers. Built with NVIDIA AI and live satellite data.
          </p>
          <div className="mt-5 pt-5 border-t border-white/5 max-w-sm">
            <div className="text-[10px] uppercase tracking-wider text-muted-dim mb-1.5">Developed by</div>
            <div className="text-sm font-semibold text-white">Dr. Muhammad Awais</div>
            <div className="text-xs text-muted">AI Architect</div>
            <div className="text-xs text-muted-dim">Department of Intelligent Systems</div>
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-dim mb-3">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/upload" className="text-muted hover:text-white">Upload field</Link></li>
            <li><Link href="/map" className="text-muted hover:text-white">Live map</Link></li>
            <li><Link href="/#crops" className="text-muted hover:text-white">Supported crops</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-dim mb-3">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#how" className="text-muted hover:text-white">How it works</Link></li>
            <li><a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-muted hover:text-white">NVIDIA NIM</a></li>
            <li><a href="https://developer.tomtom.com" target="_blank" rel="noreferrer" className="text-muted hover:text-white">TomTom Maps</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-muted-dim flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} FasalAI · Made for Pakistan 🇵🇰</span>
          <span className="text-center">Developed by <span className="text-white font-medium">Dr. Muhammad Awais</span> · AI Architect · Department of Intelligent Systems</span>
          <span>1 mann = 40 kg</span>
        </div>
      </div>
    </footer>
  );
}
