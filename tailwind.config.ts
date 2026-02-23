import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        vitrii: {
          // Primary Colors
          blue: "#0071CE",
          "blue-dark": "#0052A3",
          yellow: "#FFC220",
          green: "#16A34A",

          // Neutral Colors
          "gray-bg": "#F7F7F7",
          "gray-light": "#FAFAFA",
          text: "#1A1A1A",
          "text-secondary": "#666666",
          bg: "#FFFFFF",

          // Category Colors
          purple: "#9333EA",     // Eventos
          orange: "#EA580C",     // Agendas/Aulas
          red: "#DC2626",        // Vagas/Oportunidades
          "orange-alert": "#F97316", // Alerta/Warning

          // Hover/Active states
          "blue-hover": "#005BAD",
          "yellow-dark": "#FFB800",
          "green-dark": "#15803D",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        // Typography hierarchy per specification
        "heading-1": ["30px", { lineHeight: "1.2", fontWeight: "700" }],    // H1: Page titles
        "heading-2": ["24px", { lineHeight: "1.3", fontWeight: "700" }],    // H2: Section titles
        "heading-3": ["20px", { lineHeight: "1.4", fontWeight: "600" }],    // H3: Subtitles
        "price": ["22px", { lineHeight: "1.2", fontWeight: "700" }],        // Prices
        "body": ["15px", { lineHeight: "1.5", fontWeight: "400" }],         // Body text
        "label": ["13px", { lineHeight: "1.4", fontWeight: "400" }],        // Labels/metadata
        "button": ["15px", { lineHeight: "1.4", fontWeight: "600" }],       // CTA buttons
        "footer": ["12px", { lineHeight: "1.4", fontWeight: "400" }],       // Footer/legal
        // Additional utility sizes
        "xs-label": ["12px", { lineHeight: "1.4", fontWeight: "400" }],     // Extra small labels
        "sm-body": ["14px", { lineHeight: "1.5", fontWeight: "400" }],      // Small body text
      },
      lineHeight: {
        tight: "1.2",
        snug: "1.3",
        normal: "1.4",
        relaxed: "1.5",
        loose: "1.75",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", opacity: "1" },
          "100%": { transform: "scale(1.1)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.25s ease-in-out",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-ring": "pulse-ring 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
