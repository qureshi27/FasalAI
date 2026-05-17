import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { identifyCropFromImage } from "@/lib/nvidia";
import { CROPS, type CropId } from "@/lib/crops";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  image: z.string().min(20),
  forceCrop: z.string().nullable().optional()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { image, forceCrop } = Body.parse(json);

    if (forceCrop && forceCrop in CROPS) {
      const c = CROPS[forceCrop as CropId];
      return NextResponse.json({
        cropId: c.id,
        confidence: 1,
        growthStage: "user-specified",
        visualCues: "User selected crop manually",
        alternativeCrops: [],
        ndviEstimate: c.ndviOptimal * 0.85
      });
    }

    const result = await identifyCropFromImage(image);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("identify-crop error:", e);
    return NextResponse.json(
      { error: e.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
