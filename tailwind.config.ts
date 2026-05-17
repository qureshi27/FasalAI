import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#000000",
          surface: "#0A0A0F",
          elevated: "#13131A"
        },
        accent: {
          primary: "#4D9BFF",
          glow: "#00D4FF",
          deep: "#1E3A8A"
        },
        field: { border: "#FFD600" },
        muted: {
          DEFAULT: "#B4B4BE",
          dim: "#6B6B7A"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        card: "0 8px 32px rgba(0,0,0,0.4)",
        glow: "0 40px 80px -20px rgba(77,155,255,0.45)",
        "glow-soft": "0 0 0 1px rgba(77,155,255,0.2), 0 20px 60px -20px rgba(77,155,255,0.35)"
      },
      borderRadius: {
        lg: "20px",
        xl: "24px"
      },
      animation: {
        "fade-up": "fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both",
        "float-slow": "float 8s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
