/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        void: "#05070d",
        deep: "#0a0f1a",
        surface: {
          glass: "rgba(17, 24, 38, 0.6)",
          elevated: "rgba(25, 32, 48, 0.75)",
        },
        "border-neon": "rgba(34, 197, 94, 0.25)",
        "border-glass": "rgba(255,255,255,0.08)",
        primary: {
          DEFAULT: "#22c55e",
          glow: "rgba(16, 248, 144, 0.5)",
          foreground: "#05070d",
        },
        accent: {
          gold: "#fbbf24",
          cyan: "#22d3ee",
          magenta: "#d946ef",
        },
        text: {
          primary: "#f8fafc",
          muted: "#94a3b8",
          dim: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" },
          "50%": { boxShadow: "0 0 0 12px rgba(34,197,94,0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
