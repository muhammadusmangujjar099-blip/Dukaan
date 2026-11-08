import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        primary: { DEFAULT: "hsl(var(--primary) / <alpha-value>)", foreground: "hsl(var(--primary-foreground) / <alpha-value>)" },
        accent: { DEFAULT: "hsl(var(--accent) / <alpha-value>)", foreground: "hsl(var(--accent-foreground) / <alpha-value>)" },
        muted: { DEFAULT: "hsl(var(--muted) / <alpha-value>)", foreground: "hsl(var(--muted-foreground) / <alpha-value>)" },
        destructive: "hsl(var(--destructive) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { lg: "0.75rem", xl: "1rem" },
      keyframes: {
        "chat-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          to: { opacity: "1", transform: "none" },
        },
        dot: { "0%, 80%, 100%": { opacity: "0.25" }, "40%": { opacity: "1" } },
      },
      animation: {
        "chat-in": "chat-in 180ms ease-out",
        dot: "dot 1.2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
