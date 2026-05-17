import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { estimateYield } from "@/lib/yield";
import { CROPS } from "@/lib/crops";

export const runtime = "nodejs";

const Body = z.object({
  cropId: z.string().refine((v) => v === "unknown" || v in CROPS, "Unknown crop"),
  areaAcres: z.number().positive().max(10000),
  ndvi: z.number().min(0).max(1).optional(),
  healthFactor: z.number().min(0.4).max(1.2).optional(),
  landCover: z.string().optional(),
  isHarvested: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.parse(await req.json());
    const result = estimateYield(parsed as any);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}
