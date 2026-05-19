import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4e6",
          100: "#ffe4c7",
          200: "#ffcb95",
          300: "#ffad5e",
          400: "#ff922e",
          500: "#ff7200",
          600: "#e65e00",
          700: "#bf4a00",
          800: "#8f3600",
          900: "#5c2200",
        },
        ink: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          500: "#737373",
          700: "#404040",
          900: "#171717",
        },
        cream: "#fff8f2",
      },
      fontFamily: {
        display: ["var(--font-display)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgba(255,114,0,0.35)",
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)",
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
    },
  },
  plugins: [],
};

export default config;
