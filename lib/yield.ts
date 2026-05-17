import { CROPS, type CropId } from "./crops";

export type YieldStatus = "estimated" | "harvested" | "fallow" | "unknown";

export interface YieldInput {
  cropId: CropId | "unknown";
  areaAcres: number;
  ndvi?: number;
  healthFactor?: number;
  landCover?: string;
  isHarvested?: boolean;
  treeCount?: number | null;
  treeCountConfidence?: "exact" | "estimate" | "unable" | "n/a";
}

export interface YieldResult {
  status: YieldStatus;
  cropId: CropId | "unknown";
  cropName: string;
  urduName: string;
  areaAcres: number;
  yieldMannPerAcre: number;
  totalMann: number;
  totalKg: number;
  estimatedValuePKR: number;
  confidence: "low" | "medium" | "high";
  health: "poor" | "moderate" | "good" | "excellent" | "n/a";
  notes: string[];
  treeCount?: number | null;
  treeCountSource?: "ai_exact" | "ai_estimate" | "density_fallback" | "n/a";
}

const NO_VEGETATION_NDVI = 0.22;

export function estimateYield(input: YieldInput): YieldResult {
  if (input.cropId === "unknown" || input.landCover === "unknown") {
    return blank("unknown", input.areaAcres, [
      "AI could not confidently identify a crop in this field.",
      "Use the override dropdown to specify the crop manually if you know it."
    ]);
  }
  if (input.isHarvested || input.landCover === "harvested") {
    return blank("harvested", input.areaAcres, [
      "Field is already harvested — stubble or bare soil with crop residue visible.",
      "Nothing standing to estimate. Yield = 0 mann."
    ]);
  }
  if (input.landCover === "fallow") {
    return blank("fallow", input.areaAcres, [
      "Field is fallow — bare soil, no crop growing currently.",
      "Yield = 0 mann."
    ]);
  }
  if (input.landCover === "water" || input.landCover === "non_agricultural") {
    return blank("unknown", input.areaAcres, [
      `Land cover is "${input.landCover}". This is not a productive crop field — yield = 0 mann.`
    ]);
  }

  const crop = CROPS[input.cropId as CropId];
  if (!crop) {
    return blank("unknown", input.areaAcres, [`Crop "${input.cropId}" not in database.`]);
  }

  const ndvi = input.ndvi !== undefined ? clamp(input.ndvi, 0, 1) : crop.ndviOptimal * 0.85;
  const health = clamp(input.healthFactor ?? 1, 0.4, 1.2);

  if (crop.kind === "field_crop" && input.ndvi !== undefined && input.ndvi < NO_VEGETATION_NDVI) {
    return blank("fallow", input.areaAcres, [
      `NDVI estimate of ${input.ndvi.toFixed(2)} is below the ${NO_VEGETATION_NDVI} threshold for a living crop.`,
      `Whatever the AI labelled, the imagery shows little or no vegetation in this field — yield = 0 mann.`
    ]);
  }

  if (crop.kind === "orchard" && crop.orchard) {
    return estimateOrchard(crop, input, ndvi, health);
  }

  return estimateFieldCrop(crop, input.areaAcres, ndvi, health, input);
}

function estimateFieldCrop(
  crop: ReturnType<typeof getCrop>,
  areaAcres: number,
  ndvi: number,
  health: number,
  input: YieldInput
): YieldResult {
  const ndviRatio = ndvi / crop.ndviOptimal;
  const adjustment = clamp(ndviRatio, 0.3, 1.15);

  const yieldMannPerAcre = round(crop.baselineYieldMannPerAcre.avg * adjustment * health, 1);
  const totalMann = round(yieldMannPerAcre * areaAcres, 1);
  const totalKg = round(totalMann * 40, 0);
  const estimatedValuePKR = round(totalMann * crop.pricePerMannPKR, 0);

  const notes: string[] = [
    `${crop.name} baseline: ${crop.baselineYieldMannPerAcre.avg} mann/acre (range ${crop.baselineYieldMannPerAcre.min}–${crop.baselineYieldMannPerAcre.max})`,
    `NDVI ${ndvi.toFixed(2)} vs optimal ${crop.ndviOptimal} → ×${adjustment.toFixed(2)}`,
    `${areaAcres.toFixed(2)} acres × ${yieldMannPerAcre} mann/acre = ${totalMann} mann`
  ];

  return {
    status: "estimated",
    cropId: crop.id,
    cropName: crop.name,
    urduName: crop.urduName,
    areaAcres: round(areaAcres, 2),
    yieldMannPerAcre,
    totalMann,
    totalKg,
    estimatedValuePKR,
    confidence: input.ndvi !== undefined && input.ndvi > 0.3 ? "high" : input.ndvi === undefined ? "low" : "medium",
    health: healthFrom(ndviRatio),
    notes,
    treeCount: null,
    treeCountSource: "n/a"
  };
}

function estimateOrchard(
  crop: ReturnType<typeof getCrop>,
  input: YieldInput,
  ndvi: number,
  health: number
): YieldResult {
  const spec = crop.orchard!;
  const areaAcres = input.areaAcres;

  const densityCount = Math.round(areaAcres * spec.defaultTreesPerAcre);
  let treeCount: number;
  let source: NonNullable<YieldResult["treeCountSource"]>;
  let usedCountNote: string;

  if (input.treeCount && input.treeCount > 0 && input.treeCountConfidence !== "n/a") {
    const aiCount = input.treeCount;
    const ratio = aiCount / Math.max(densityCount, 1);
    const reasonable = ratio >= 0.3 && ratio <= 2.5;
    if (reasonable || input.treeCountConfidence === "exact") {
      treeCount = aiCount;
      source = input.treeCountConfidence === "exact" ? "ai_exact" : "ai_estimate";
      usedCountNote = `AI counted ${aiCount} trees in the polygon (${input.treeCountConfidence}). Density-based check: ${densityCount} expected — within reasonable range.`;
    } else {
      treeCount = densityCount;
      source = "density_fallback";
      usedCountNote = `AI count (${aiCount}) was far from density estimate (${densityCount}). Using density: ${areaAcres.toFixed(2)} ac × ${spec.defaultTreesPerAcre} trees/ac.`;
    }
  } else {
    treeCount = densityCount;
    source = "density_fallback";
    usedCountNote = `AI could not count trees — using density: ${areaAcres.toFixed(2)} ac × ${spec.defaultTreesPerAcre} trees/ac at ${spec.spacingFeet}ft spacing.`;
  }

  const ndviRatio = ndvi / crop.ndviOptimal;
  const healthAdj = clamp(ndviRatio, 0.4, 1.15) * health;

  const totalKg = round(treeCount * spec.kgPerTree * healthAdj, 0);
  const totalMann = round(totalKg / 40, 1);
  const yieldMannPerAcre = areaAcres > 0 ? round(totalMann / areaAcres, 1) : 0;
  const estimatedValuePKR = round(totalMann * crop.pricePerMannPKR, 0);

  const notes: string[] = [
    usedCountNote,
    `${treeCount} trees × ${spec.kgPerTree} kg/tree × health ${healthAdj.toFixed(2)} = ${totalKg.toLocaleString("en-PK")} kg (${totalMann} mann)`,
    `NDVI ${ndvi.toFixed(2)} vs optimal ${crop.ndviOptimal}`
  ];

  return {
    status: "estimated",
    cropId: crop.id,
    cropName: crop.name,
    urduName: crop.urduName,
    areaAcres: round(areaAcres, 2),
    yieldMannPerAcre,
    totalMann,
    totalKg,
    estimatedValuePKR,
    confidence: source === "ai_exact" ? "high" : source === "ai_estimate" ? "medium" : "low",
    health: healthFrom(ndviRatio),
    notes,
    treeCount,
    treeCountSource: source
  };
}

function getCrop(id: CropId) { return CROPS[id]; }

function blank(status: YieldStatus, areaAcres: number, notes: string[]): YieldResult {
  return {
    status,
    cropId: "unknown",
    cropName: status === "harvested" ? "Already harvested" : status === "fallow" ? "Fallow" : "Unidentified",
    urduName: "—",
    areaAcres: round(areaAcres, 2),
    yieldMannPerAcre: 0,
    totalMann: 0,
    totalKg: 0,
    estimatedValuePKR: 0,
    confidence: "low",
    health: "n/a",
    notes,
    treeCount: null,
    treeCountSource: "n/a"
  };
}

function healthFrom(ndviRatio: number): YieldResult["health"] {
  if (ndviRatio >= 0.95) return "excellent";
  if (ndviRatio >= 0.8) return "good";
  if (ndviRatio >= 0.6) return "moderate";
  return "poor";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

export function formatPKR(amount: number): string {
  if (amount === 0) return "—";
  if (amount >= 1_00_00_000) return `PKR ${(amount / 1_00_00_000).toFixed(2)} crore`;
  if (amount >= 1_00_000) return `PKR ${(amount / 1_00_000).toFixed(2)} lakh`;
  return `PKR ${amount.toLocaleString("en-PK")}`;
}
