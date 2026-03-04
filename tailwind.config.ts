import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Sage Green — Primary Brand Color
        primary: {
          DEFAULT: "#15803d", // emerald-700
          dark: "#065f46",    // emerald-800
          light: "#d1fae5",   // emerald-100
          foreground: "#ffffff",
        },
        // Zinc — Neutral & Text
        background: "#ffffff",
        foreground: "#18181b",  // zinc-900
        muted: {
          DEFAULT: "#f4f4f5",   // zinc-100
          foreground: "#71717a", // zinc-500
        },
        card: {
          DEFAULT: "#fafafa",   // zinc-50
          foreground: "#27272a", // zinc-800
        },
        border: "#e4e4e7",      // zinc-200
        input: "#e4e4e7",
        ring: "#15803d",
        // Shadcn UI mapping
        secondary: {
          DEFAULT: "#f4f4f5",
          foreground: "#27272a",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#f0fdf4",   // green-50
          foreground: "#15803d",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#18181b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "Prompt", "Noto Sans Thai", "sans-serif"],
        thai: ["Prompt", "Noto Sans Thai", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "ken-burns": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.08)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "ken-burns": "ken-burns 8s ease-in-out infinite alternate",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
