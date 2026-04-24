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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        sativa: "hsl(var(--sativa))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "Prompt", "Noto Sans Thai", "sans-serif"],
        /** Alias to sans so legacy `font-serif` never selects a transitional serif stack */
        serif: ["Inter", "Prompt", "Noto Sans Thai", "sans-serif"],
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
        /** ~0.5s nod in first 14.3% of 3.5s cycle, then 3s rest (rhythmic cart pulse) */
        "cart-nod": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "2.2%": { transform: "rotate(-6deg) scale(1.04)" },
          "4.4%": { transform: "rotate(6deg) scale(1.04)" },
          "6.6%": { transform: "rotate(-6deg) scale(1.04)" },
          "8.8%": { transform: "rotate(6deg) scale(1.04)" },
          "11%": { transform: "rotate(0deg) scale(1.04)" },
          "14.3%, 100%": { transform: "rotate(0deg) scale(1)" },
        },
        /** One-shot when fly animation hits the cart */
        "cart-hit": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "20%": { transform: "rotate(-10deg) scale(1.07)" },
          "40%": { transform: "rotate(8deg) scale(1.06)" },
          "60%": { transform: "rotate(-4deg) scale(1.03)" },
          "100%": { transform: "rotate(0deg) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "ken-burns": "ken-burns 8s ease-in-out infinite alternate",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "cart-nod": "cart-nod 3.5s ease-in-out infinite",
        "cart-hit": "cart-hit 0.45s ease-out both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
