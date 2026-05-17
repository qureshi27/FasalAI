export type CropId =
  | "wheat"
  | "cotton"
  | "sugarcane"
  | "rice_basmati"
  | "rice_irri"
  | "maize"
  | "mustard"
  | "chickpea"
  | "potato"
  | "onion"
  | "mango"
  | "citrus_kinnow"
  | "dates"
  | "banana"
  | "guava";

export type Season = "rabi" | "kharif" | "annual";
export type CropKind = "field_crop" | "orchard";

export interface CropInfo {
  id: CropId;
  name: string;
  urduName: string;
  kind: CropKind;
  season: Season;
  sowingMonths: number[];
  harvestMonths: number[];
  baselineYieldMannPerAcre: { min: number; max: number; avg: number };
  ndviOptimal: number;
  pricePerMannPKR: number;
  visualCues: string;
  emoji: string;
  primaryRegions: string[];
}

export const CROPS: Record<CropId, CropInfo> = {
  wheat: {
    id: "wheat", name: "Wheat", urduName: "گندم", kind: "field_crop", season: "rabi",
    sowingMonths: [10, 11, 12], harvestMonths: [3, 4, 5],
    baselineYieldMannPerAcre: { min: 25, max: 50, avg: 35 },
    ndviOptimal: 0.75, pricePerMannPKR: 4000,
    visualCues: "Uniform light green tillering Dec–Feb; golden uniform stalks at harvest (Apr–May)",
    emoji: "🌾", primaryRegions: ["Punjab", "Sindh", "KPK"]
  },
  cotton: {
    id: "cotton", name: "Cotton", urduName: "کپاس", kind: "field_crop", season: "kharif",
    sowingMonths: [4, 5, 6], harvestMonths: [9, 10, 11, 12],
    baselineYieldMannPerAcre: { min: 15, max: 35, avg: 24 },
    ndviOptimal: 0.7, pricePerMannPKR: 8500,
    visualCues: "Bushy plants in straight rows; white bolls visible Oct–Nov",
    emoji: "🌱", primaryRegions: ["Punjab (Multan, Bahawalpur)", "Sindh"]
  },
  sugarcane: {
    id: "sugarcane", name: "Sugarcane", urduName: "گنا", kind: "field_crop", season: "annual",
    sowingMonths: [2, 3, 9, 10], harvestMonths: [11, 12, 1, 2, 3],
    baselineYieldMannPerAcre: { min: 500, max: 1000, avg: 700 },
    ndviOptimal: 0.8, pricePerMannPKR: 400,
    visualCues: "Very tall (8-12ft), dense dark green canopy, visible row stripes",
    emoji: "🎋", primaryRegions: ["Punjab", "Sindh", "KPK"]
  },
  rice_basmati: {
    id: "rice_basmati", name: "Basmati Rice", urduName: "باسمتی چاول", kind: "field_crop", season: "kharif",
    sowingMonths: [5, 6, 7], harvestMonths: [10, 11],
    baselineYieldMannPerAcre: { min: 20, max: 40, avg: 28 },
    ndviOptimal: 0.78, pricePerMannPKR: 6500,
    visualCues: "Flooded fields with reflective water Jun–Aug; golden panicles Oct–Nov",
    emoji: "🌾", primaryRegions: ["Punjab (Kallar Tract)", "Sheikhupura", "Gujranwala"]
  },
  rice_irri: {
    id: "rice_irri", name: "IRRI Rice", urduName: "ایری چاول", kind: "field_crop", season: "kharif",
    sowingMonths: [5, 6], harvestMonths: [9, 10],
    baselineYieldMannPerAcre: { min: 30, max: 55, avg: 40 },
    ndviOptimal: 0.78, pricePerMannPKR: 3500,
    visualCues: "Flooded paddies, shorter and stockier than basmati",
    emoji: "🌾", primaryRegions: ["Sindh", "Lower Punjab"]
  },
  maize: {
    id: "maize", name: "Maize (Corn)", urduName: "مکئی", kind: "field_crop", season: "kharif",
    sowingMonths: [2, 3, 7, 8], harvestMonths: [6, 10, 11],
    baselineYieldMannPerAcre: { min: 50, max: 110, avg: 75 },
    ndviOptimal: 0.75, pricePerMannPKR: 2200,
    visualCues: "Tall plants in distinct rows with wide leaves and dark green canopy",
    emoji: "🌽", primaryRegions: ["KPK", "Punjab (Okara, Sahiwal)"]
  },
  mustard: {
    id: "mustard", name: "Mustard / Canola", urduName: "سرسوں", kind: "field_crop", season: "rabi",
    sowingMonths: [10, 11], harvestMonths: [2, 3],
    baselineYieldMannPerAcre: { min: 8, max: 20, avg: 12 },
    ndviOptimal: 0.7, pricePerMannPKR: 7000,
    visualCues: "Striking bright yellow blooms in February (unmistakable)",
    emoji: "🌼", primaryRegions: ["Punjab", "Sindh"]
  },
  chickpea: {
    id: "chickpea", name: "Chickpea (Gram)", urduName: "چنا", kind: "field_crop", season: "rabi",
    sowingMonths: [10, 11], harvestMonths: [3, 4],
    baselineYieldMannPerAcre: { min: 6, max: 16, avg: 10 },
    ndviOptimal: 0.65, pricePerMannPKR: 9500,
    visualCues: "Low bushy plants on sandy soil (Thal, Cholistan)",
    emoji: "🫛", primaryRegions: ["Thal", "Cholistan", "DG Khan"]
  },
  potato: {
    id: "potato", name: "Potato", urduName: "آلو", kind: "field_crop", season: "rabi",
    sowingMonths: [9, 10, 11], harvestMonths: [1, 2, 3],
    baselineYieldMannPerAcre: { min: 200, max: 350, avg: 270 },
    ndviOptimal: 0.78, pricePerMannPKR: 1800,
    visualCues: "Mounded rows, dense low canopy",
    emoji: "🥔", primaryRegions: ["Okara", "Sahiwal", "Pakpattan"]
  },
  onion: {
    id: "onion", name: "Onion", urduName: "پیاز", kind: "field_crop", season: "rabi",
    sowingMonths: [10, 11, 12], harvestMonths: [3, 4, 5],
    baselineYieldMannPerAcre: { min: 150, max: 300, avg: 220 },
    ndviOptimal: 0.72, pricePerMannPKR: 2500,
    visualCues: "Slender upright green shoots in dense rows",
    emoji: "🧅", primaryRegions: ["Sindh", "Balochistan", "Punjab"]
  },
  mango: {
    id: "mango", name: "Mango Orchard", urduName: "آم کا باغ", kind: "orchard", season: "annual",
    sowingMonths: [], harvestMonths: [5, 6, 7, 8],
    baselineYieldMannPerAcre: { min: 120, max: 220, avg: 160 },
    ndviOptimal: 0.78, pricePerMannPKR: 4500,
    visualCues: "TREES in clear grid pattern (~80 trees/acre, 20ft spacing). Dark dense canopies casting circular shadows. Visible spacing between trees.",
    emoji: "🥭", primaryRegions: ["Multan", "Khanewal", "Mirpurkhas", "Rahim Yar Khan"]
  },
  citrus_kinnow: {
    id: "citrus_kinnow", name: "Kinnow / Citrus Orchard", urduName: "کنو کا باغ", kind: "orchard", season: "annual",
    sowingMonths: [], harvestMonths: [12, 1, 2],
    baselineYieldMannPerAcre: { min: 150, max: 250, avg: 187 },
    ndviOptimal: 0.75, pricePerMannPKR: 2500,
    visualCues: "Smaller TREES in tighter grid (~150 trees/acre, 12-15ft spacing). Lighter green than mango.",
    emoji: "🍊", primaryRegions: ["Sargodha", "Bhalwal", "Toba Tek Singh"]
  },
  dates: {
    id: "dates", name: "Date Palm", urduName: "کھجور", kind: "orchard", season: "annual",
    sowingMonths: [], harvestMonths: [7, 8, 9],
    baselineYieldMannPerAcre: { min: 80, max: 180, avg: 130 },
    ndviOptimal: 0.65, pricePerMannPKR: 5500,
    visualCues: "Tall palms with star-shaped fronds, wide spacing, arid context",
    emoji: "🌴", primaryRegions: ["Khairpur (Sindh)", "DG Khan", "Turbat"]
  },
  banana: {
    id: "banana", name: "Banana", urduName: "کیلا", kind: "orchard", season: "annual",
    sowingMonths: [2, 3], harvestMonths: [9, 10, 11, 12],
    baselineYieldMannPerAcre: { min: 300, max: 600, avg: 450 },
    ndviOptimal: 0.82, pricePerMannPKR: 1800,
    visualCues: "Very dense bright green canopy, wide leaves visible, tight spacing",
    emoji: "🍌", primaryRegions: ["Sindh (Thatta, Hyderabad, Tando Allahyar)"]
  },
  guava: {
    id: "guava", name: "Guava Orchard", urduName: "امرود کا باغ", kind: "orchard", season: "annual",
    sowingMonths: [], harvestMonths: [8, 9, 10, 11, 12, 1, 2],
    baselineYieldMannPerAcre: { min: 100, max: 200, avg: 140 },
    ndviOptimal: 0.74, pricePerMannPKR: 2200,
    visualCues: "Small trees in grid, lower canopy than mango",
    emoji: "🫒", primaryRegions: ["Sharaqpur", "Kohat", "Larkana"]
  }
};

export const CROP_LIST = Object.values(CROPS);
export const FIELD_CROPS = CROP_LIST.filter((c) => c.kind === "field_crop");
export const ORCHARDS = CROP_LIST.filter((c) => c.kind === "orchard");

export function mannToKg(mann: number): number { return mann * 40; }
export function kgToMann(kg: number): number { return kg / 40; }
