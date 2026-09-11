import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#c9a84c",
          hover: "#b8963f",
          light: "#f7f0dc",
        },
        gold: {
          DEFAULT: "#c9a84c",
          dark: "#9a7b2e",
          light: "#f7f0dc",
          dim: "#c9a84c26",
        },
        /* Refreshed neutral scale — warm ivory surfaces + deep navy ink */
        sand: {
          50: "#fcfbf7",
          100: "#f6f3ea",
          200: "#ece6d7",
        },
        ink: {
          DEFAULT: "#1e2436",
          soft: "#5b6478",
          faint: "#8b93a5",
        },
      },
      borderRadius: {
        "4xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(30,36,54,0.05), 0 8px 24px rgba(30,36,54,0.06)",
        lift: "0 2px 4px rgba(30,36,54,0.06), 0 18px 40px rgba(30,36,54,0.10)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "recap-marquee": "recapMarquee 48s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        recapMarquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
