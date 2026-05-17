import { CROPS, type CropId } from "./crops";

export type YieldStatus = "estimated" | "harvested" | "fallow" | "unknown";

export interface YieldInput {
  cropId: CropId | "unknown";
  areaAcres: number;
  ndvi?: number;
  healthFactor?: number;
  landCover?: string;
  isHarvested?: boolean;
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
}

export function estimateYield(input: YieldInput): YieldResult {
  if (input.cropId === "unknown" || input.landCover === "unknown") {
    return blank("unknown", input.areaAcres, [
      "AI could not confidently identify the crop in this field.",
      "Use the override dropdown to specify the crop manually."
    ]);
  }
  if (input.isHarvested || input.landCover === "harvested") {
    return blank("harvested", input.areaAcres, [
      "Field appears to be already harvested (stubble/bare soil visible).",
      "No standing crop to estimate. Re-analyze during the growing season for yield projection."
    ]);
  }
  if (input.landCover === "fallow") {
    return blank("fallow", input.areaAcres, [
      "Field appears fallow — bare soil, no current crop.",
      "Nothing to estimate this season."
    ]);
  }
  if (input.landCover === "water" || input.landCover === "non_agricultural") {
    return blank("unknown", input.areaAcres, [
      `Field cover is "${input.landCover}" — no crop yield to estimate.`
    ]);
  }

  const crop = CROPS[input.cropId as CropId];
  if (!crop) {
    return blank("unknown", input.areaAcres, [`Crop "${input.cropId}" not in database.`]);
  }

  const ndvi = clamp(input.ndvi ?? crop.ndviOptimal * 0.85, 0, 1);
  const health = clamp(input.healthFactor ?? 1, 0.4, 1.2);

  const ndviRatio = ndvi / crop.ndviOptimal;
  const adjustment = clamp(ndviRatio, 0.4, 1.15);

  const yieldMannPerAcre = round(crop.baselineYieldMannPerAcre.avg * adjustment * health, 1);
  const totalMann = round(yieldMannPerAcre * input.areaAcres, 1);
  const totalKg = round(totalMann * 40, 0);
  const estimatedValuePKR = round(totalMann * crop.pricePerMannPKR, 0);

  const notes: string[] = [];
  notes.push(`${crop.kind === "orchard" ? "Orchard" : "Crop"} baseline: ${crop.baselineYieldMannPerAcre.avg} mann/acre (range ${crop.baselineYieldMannPerAcre.min}–${crop.baselineYieldMannPerAcre.max})`);
  notes.push(`NDVI ${ndvi.toFixed(2)} vs optimal ${crop.ndviOptimal} → ×${adjustment.toFixed(2)}`);

  let healthLabel: YieldResult["health"] = "moderate";
  if (ndviRatio >= 0.95) healthLabel = "excellent";
  else if (ndviRatio >= 0.8) healthLabel = "good";
  else if (ndviRatio >= 0.6) healthLabel = "moderate";
  else healthLabel = "poor";

  let confidence: YieldResult["confidence"] = "medium";
  if (input.ndvi !== undefined && input.ndvi > 0.3) confidence = "high";
  else if (input.ndvi === undefined) confidence = "low";

  return {
    status: "estimated",
    cropId: crop.id,
    cropName: crop.name,
    urduName: crop.urduName,
    areaAcres: round(input.areaAcres, 2),
    yieldMannPerAcre,
    totalMann,
    totalKg,
    estimatedValuePKR,
    confidence,
    health: healthLabel,
    notes
  };
}

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
    notes
  };
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
