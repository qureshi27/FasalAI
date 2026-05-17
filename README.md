# FasalAI — Pakistan Crop Yield Detection

AI-powered crop identification and yield estimation for Pakistani fields. Outline any field on a live satellite map (or upload a photo), get the crop identified, and see expected yield in **mann** (1 mann = 40 kg).

Built with Next.js 15, NVIDIA NIM (Llama 3.2 Vision), TomTom Maps, and OpenStreetMap Overpass for field boundaries.

## Features

- 🛰️ **Live satellite map** — TomTom satellite tiles restricted to Pakistan
- 📤 **Image upload** — Analyze field photos from drones or phones
- 🌾 **10+ Pakistani crops** — Wheat, cotton, sugarcane, rice (basmati & IRRI), maize, mustard, chickpea, potato, onion
- ✏️ **Yellow field outlines** — Auto-detected farmland polygons via OSM, with synthetic fallback
- 🤖 **AI crop identification** — NVIDIA NIM Llama 3.2 90B Vision
- 📊 **Yield in mann** — Pakistan-calibrated baselines + NDVI proxy from imagery
- 💰 **Rupee value estimate** — Based on current market prices
- 🇵🇰 **Pakistan-only** — Map and bbox locked to the country

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Styling | Tailwind CSS + custom design tokens (see `design.md`) |
| Animations | Framer Motion |
| Vision AI | NVIDIA NIM — `meta/llama-3.2-90b-vision-instruct` |
| Maps | TomTom Satellite tiles + Geocoding |
| Field boundaries | OpenStreetMap Overpass API (free) |
| Hosting | Vercel (zero-config) |

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your keys:
#   NVIDIA_API_KEY (from https://build.nvidia.com)
#   NEXT_PUBLIC_TOMTOM_API_KEY (from https://developer.tomtom.com)

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Environment variables

| Variable | Where to get | Required |
|---|---|---|
| `NVIDIA_API_KEY` | https://build.nvidia.com → API Keys | ✅ |
| `NEXT_PUBLIC_TOMTOM_API_KEY` | https://developer.tomtom.com → Apps | ✅ |
| `SENTINEL_HUB_CLIENT_ID` | https://www.sentinel-hub.com (Phase 2 — real NDVI) | ❌ |
| `SENTINEL_HUB_CLIENT_SECRET` | Same as above | ❌ |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import in Vercel (vercel.com/new).
3. Add the two environment variables in **Project Settings → Environment Variables**:
   - `NVIDIA_API_KEY`
   - `NEXT_PUBLIC_TOMTOM_API_KEY`
4. Deploy — Vercel auto-detects Next.js.

Or via CLI:

```bash
npm i -g vercel
vercel
vercel env add NVIDIA_API_KEY
vercel env add NEXT_PUBLIC_TOMTOM_API_KEY
vercel --prod
```

## How yield is calculated

```
yield_mann_per_acre = baseline_avg × (NDVI / NDVI_optimal) × health_factor
total_mann = yield_mann_per_acre × area_acres
```

Baselines are sourced from Pakistan Bureau of Statistics and provincial agriculture department averages. See [`lib/crops.ts`](lib/crops.ts) for per-crop figures.

| Crop | Baseline (mann/acre) |
|---|---|
| Wheat | 35 |
| Cotton | 24 |
| Sugarcane | 700 |
| Basmati Rice | 28 |
| Maize | 75 |
| Mustard | 12 |

NDVI is currently estimated by the vision model from RGB imagery. **Phase 2** will swap this for real Sentinel-2 NIR/Red band calculation via Sentinel Hub.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  Frontend (Next.js App Router)                         │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ /  Landing  │  │ /upload  │  │ /map (TomTom)    │   │
│  └─────────────┘  └────┬─────┘  └────────┬─────────┘   │
└─────────────────────────┼─────────────────┼────────────┘
                          │                 │
                ┌─────────▼─────────────────▼──────────┐
                │  API Routes (Next.js)                │
                │  /api/identify-crop   → NVIDIA NIM   │
                │  /api/estimate-yield  → lib/yield.ts │
                │  /api/segment-fields  → OSM Overpass │
                │  /api/analyze-field   → orchestrator │
                └──────────────────────────────────────┘
```

## Roadmap

- [x] **Phase 1 — Web MVP** (this release): Upload + live map, NVIDIA vision ID, empirical yield
- [ ] **Phase 2 — Real NDVI**: Sentinel-2 multispectral integration
- [ ] **Phase 3 — Mobile** (React Native / Expo)
- [ ] **Phase 4 — Ground-truth ML**: Collect yields from farmers, fine-tune classifier
- [ ] Field saving / history (Postgres + PostGIS)
- [ ] WhatsApp/SMS yield reports in Urdu

## License

Internal — See Pakistan project.
