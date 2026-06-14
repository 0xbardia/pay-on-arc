import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        card: "#111827",
        surface: "#111827",
        elevated: "#1A2235",
        border: "rgba(255,255,255,0.08)",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        primary: {
          DEFAULT: "#7C3AED",
          hover: "#8B5CF6",
          foreground: "#F8FAFC",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 58, 237, 0.22)",
        premium: "0 24px 80px rgba(0,0,0,0.32)",
      },
    },
  },
  plugins: [],
};

export default config;
