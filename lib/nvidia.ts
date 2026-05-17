import { CROP_LIST, FIELD_CROPS, ORCHARDS, type CropId } from "./crops";

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const VISION_MODEL = "meta/llama-3.2-90b-vision-instruct";

export type LandCover =
  | "standing_crop"
  | "orchard"
  | "harvested"
  | "fallow"
  | "water"
  | "non_agricultural"
  | "unknown";

export interface CropIdentification {
  landCover: LandCover;
  cropId: CropId | "unknown";
  isOrchard: boolean;
  isHarvested: boolean;
  confidence: number;
  growthStage: string;
  visualCues: string;
  alternativeCrops: { cropId: CropId; confidence: number }[];
  ndviEstimate: number;
  raw?: string;
}

const fieldCropMenu = FIELD_CROPS.map((c) => `  - ${c.id}: ${c.name} — ${c.visualCues}`).join("\n");
const orchardMenu = ORCHARDS.map((c) => `  - ${c.id}: ${c.name} — ${c.visualCues}`).join("\n");

const SYSTEM_PROMPT = `You are an expert agronomist analyzing a satellite image of a Pakistani agricultural area. A red polygon has been drawn on the image to mark the SPECIFIC field to analyze. Focus ONLY on what is inside that red outline.

# STEP 1 — Classify land cover (most important)

Look at the area INSIDE the red polygon and pick ONE:

- "standing_crop": uniform green/golden vegetation in field rows; a herbaceous crop is currently growing
- "orchard": TREES arranged in a regular grid; visible spacing between distinct round canopies; circular shadows
- "harvested": cut stubble, bare/plowed soil with crop residue, dry brown uniform field with no standing crop
- "fallow": bare soil, no agriculture visible, no recent residue
- "water": flooded/waterlogged with reflective surface (could be rice paddy in early stage)
- "non_agricultural": buildings, roads, scattered wild trees, urban
- "unknown": image too unclear / cloud cover / cannot determine

# STEP 2 — If standing_crop, pick the crop

Pakistani field crops to choose from:
${fieldCropMenu}

# STEP 3 — If orchard, pick the tree type

Pakistani orchards:
${orchardMenu}

# STEP 4 — Growth stage

"germination" | "tillering" | "vegetative" | "flowering" | "grain_filling" | "maturity" | "harvested" | "post_harvest" | "n/a_orchard"

# CRITICAL RULES

1. If you see TREES in a grid pattern with circular canopies and visible spacing → it is an ORCHARD, NOT wheat or any field crop.
2. If you see CUT STUBBLE, plowed/bare soil, or brown uniform residue → it is HARVESTED. Do not guess what was grown.
3. NEVER default to "wheat" when uncertain. Return cropId: "unknown" and landCover: "unknown" if you cannot tell.
4. Pakistan harvest calendar context — adjust expectations to the imagery date:
   - Wheat: harvested April–May (so May images usually show stubble or already-plowed fields)
   - Cotton: standing June–November
   - Sugarcane: standing most of the year, very tall
   - Mango/citrus: orchards visible year-round
5. Confidence should be LOW (0.2–0.5) if the image is ambiguous. Be honest about uncertainty.

# OUTPUT

Respond with strict JSON ONLY (no prose, no markdown):

{
  "landCover": "<one of the 7 categories above>",
  "cropId": "<one of the crop ids, or 'unknown'>",
  "isOrchard": <true if landCover is orchard>,
  "isHarvested": <true if landCover is harvested>,
  "confidence": <0..1>,
  "growthStage": "<stage>",
  "visualCues": "<concrete description: tree pattern? stubble? row spacing? soil color? what you actually see inside the red polygon>",
  "alternativeCrops": [{"cropId": "<id>", "confidence": <0..1>}],
  "ndviEstimate": <0..1, your read of vegetation health from the greenness inside the polygon>
}`;

export async function identifyCropFromImage(imageBase64DataUrl: string): Promise<CropIdentification> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY not configured");

  const today = new Date();
  const monthName = today.toLocaleString("en-US", { month: "long" });

  const body = {
    model: VISION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Today is ${monthName} ${today.getFullYear()}. Analyze the field inside the red polygon outline. Remember: look for tree grid patterns (orchards), cut stubble (harvested), or actual standing crops. Don't guess wheat by default.`
          },
          { type: "image_url", image_url: { url: imageBase64DataUrl } }
        ]
      }
    ],
    max_tokens: 700,
    temperature: 0.15,
    top_p: 0.85,
    stream: false
  };

  const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  return parseCropResponse(content);
}

function parseCropResponse(raw: string): CropIdentification {
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return uncertain(raw, "Model returned no JSON");

  try {
    const parsed = JSON.parse(match[0]);
    const validIds = new Set(CROP_LIST.map((c) => c.id));
    const validCovers: LandCover[] = [
      "standing_crop", "orchard", "harvested", "fallow", "water", "non_agricultural", "unknown"
    ];

    const landCover: LandCover = validCovers.includes(parsed.landCover) ? parsed.landCover : "unknown";
    const rawCrop = String(parsed.cropId ?? "unknown");
    const cropId: CropId | "unknown" = validIds.has(rawCrop) ? (rawCrop as CropId) : "unknown";

    return {
      landCover,
      cropId,
      isOrchard: Boolean(parsed.isOrchard) || landCover === "orchard",
      isHarvested: Boolean(parsed.isHarvested) || landCover === "harvested",
      confidence: clamp01(parsed.confidence ?? 0.5),
      growthStage: String(parsed.growthStage ?? "unknown"),
      visualCues: String(parsed.visualCues ?? ""),
      alternativeCrops: Array.isArray(parsed.alternativeCrops)
        ? parsed.alternativeCrops
            .filter((a: any) => validIds.has(a?.cropId))
            .slice(0, 3)
            .map((a: any) => ({ cropId: a.cropId as CropId, confidence: clamp01(a.confidence ?? 0) }))
        : [],
      ndviEstimate: clamp01(parsed.ndviEstimate ?? 0.4),
      raw
    };
  } catch (e: any) {
    return uncertain(raw, `JSON parse error: ${e.message}`);
  }
}

function uncertain(raw: string, reason: string): CropIdentification {
  return {
    landCover: "unknown",
    cropId: "unknown",
    isOrchard: false,
    isHarvested: false,
    confidence: 0.2,
    growthStage: "unknown",
    visualCues: reason,
    alternativeCrops: [],
    ndviEstimate: 0.3,
    raw
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n) || 0));
}
