import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { CropsGrid } from "@/components/CropsGrid";
import { PakistanPreview } from "@/components/PakistanPreview";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CropsGrid />
      <PakistanPreview />
    </>
  );
}
