import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "FasalAI — Pakistan Crop Yield Detection",
  description:
    "AI-powered crop identification and yield estimation for Pakistani fields. Wheat, cotton, sugarcane, rice, maize and more — estimated in mann.",
  keywords: [
    "Pakistan agriculture",
    "crop yield",
    "wheat yield",
    "sugarcane yield",
    "cotton yield",
    "satellite agriculture",
    "NDVI Pakistan"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-base text-white min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
