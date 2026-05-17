import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { identifyCropFromImage } from "@/lib/nvidia";
import { estimateYield } from "@/lib/yield";
import { isInsidePakistan, type LatLon } from "@/lib/geo";
import { CROPS, type CropId } from "@/lib/crops";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  center: z.object({ lat: z.number(), lon: z.number() }),
  polygon: z.object({
    coordinates: z.array(z.object({ lat: z.number(), lon: z.number() })).min(3),
    areaAcres: z.number().positive()
  }),
  forceCrop: z.string().optional().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const { center, polygon, forceCrop } = Body.parse(await req.json());
    if (!isInsidePakistan(center)) {
      return NextResponse.json({ error: "Outside Pakistan" }, { status: 400 });
    }

    let identification;
    if (forceCrop && forceCrop in CROPS) {
      const c = CROPS[forceCrop as CropId];
      identification = {
        landCover: c.kind === "orchard" ? "orchard" : "standing_crop",
        cropId: c.id,
        isOrchard: c.kind === "orchard",
        isHarvested: false,
        confidence: 1,
        growthStage: "user-specified",
        visualCues: "User-overridden crop selection",
        alternativeCrops: [],
        ndviEstimate: c.ndviOptimal * 0.85
      };
    } else {
      const dataUrl = await fetchPolygonSnapshot(polygon.coordinates);
      identification = await identifyCropFromImage(dataUrl);
    }

    const yieldResult = estimateYield({
      cropId: identification.cropId,
      areaAcres: polygon.areaAcres,
      ndvi: identification.ndviEstimate,
      landCover: identification.landCover,
      isHarvested: identification.isHarvested
    });

    return NextResponse.json({ identification, yield: yieldResult });
  } catch (e: any) {
    console.error("analyze-field error:", e);
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 500 });
  }
}

async function fetchPolygonSnapshot(coords: LatLon[]): Promise<string> {
  const googleKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!googleKey) throw new Error("Google Maps key required for satellite snapshot");

  const lats = coords.map((c) => c.lat);
  const lons = coords.map((c) => c.lon);
  const padLat = (Math.max(...lats) - Math.min(...lats)) * 0.4 + 0.0002;
  const padLon = (Math.max(...lons) - Math.min(...lons)) * 0.4 + 0.0002;

  const visible = [
    `${Math.min(...lats) - padLat},${Math.min(...lons) - padLon}`,
    `${Math.max(...lats) + padLat},${Math.max(...lons) + padLon}`
  ].join("|");

  const pathPoints = [...coords, coords[0]]
    .map((c) => `${c.lat.toFixed(6)},${c.lon.toFixed(6)}`)
    .join("|");

  const params = new URLSearchParams({
    size: "640x640",
    scale: "2",
    maptype: "satellite",
    visible,
    key: googleKey
  });
  const path = `color:0xff0000ff|weight:5|fillcolor:0xff00001a|${pathPoints}`;
  const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}&path=${encodeURIComponent(path)}`;

  const r = await fetch(url);
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Google Static Maps ${r.status}: ${txt.slice(0, 200)}`);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}
