import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isInsidePakistan, mockFieldPolygons, polygonAreaAcres, type Polygon, type LatLon } from "@/lib/geo";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  lat: z.number(),
  lon: z.number()
});

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function POST(req: NextRequest) {
  try {
    const { lat, lon } = Body.parse(await req.json());
    if (!isInsidePakistan({ lat, lon })) {
      return NextResponse.json({ error: "Point is outside Pakistan" }, { status: 400 });
    }

    const polys = await fetchOSMFarmland(lat, lon).catch(() => null);
    if (polys && polys.length > 0) {
      return NextResponse.json({ source: "osm", polygons: polys });
    }

    const fallback = mockFieldPolygons({ lat, lon }, 4);
    return NextResponse.json({ source: "synthetic", polygons: fallback });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}

async function fetchOSMFarmland(lat: number, lon: number): Promise<Polygon[]> {
  const delta = 0.003;
  const bbox = `${lat - delta},${lon - delta},${lat + delta},${lon + delta}`;
  const query = `[out:json][timeout:15];
(
  way["landuse"="farmland"](${bbox});
  way["landuse"="orchard"](${bbox});
  way["landuse"="meadow"](${bbox});
);
out geom;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();

  const polygons: Polygon[] = [];
  for (const el of data.elements ?? []) {
    if (el.type === "way" && Array.isArray(el.geometry)) {
      const coords: LatLon[] = el.geometry.map((g: any) => ({ lat: g.lat, lon: g.lon }));
      if (coords.length >= 3) {
        const area = polygonAreaAcres(coords);
        if (area >= 0.1 && area <= 200) {
          polygons.push({ coordinates: coords, areaAcres: area });
        }
      }
    }
    if (polygons.length >= 12) break;
  }
  return polygons;
}
