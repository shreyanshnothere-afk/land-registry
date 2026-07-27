import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080B11",
        surface: {
          50: "#141A29",
          100: "#1A233A",
          200: "#222D4A",
          800: "#0E1422",
        },
        brand: {
          cyan: "#00F2FE",
          violet: "#7928CA",
          purple: "#9D4EDD",
          emerald: "#10B981",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glow-card": "linear-gradient(135deg, rgba(121, 40, 202, 0.15), rgba(0, 242, 254, 0.15))",
      },
    },
  },
  plugins: [],
};
export default config;
