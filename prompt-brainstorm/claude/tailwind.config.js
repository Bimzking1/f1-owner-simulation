/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "rgb(var(--bg-void) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        raised: "rgb(var(--bg-raised) / <alpha-value>)",
        hairline: "rgb(var(--border-hairline) / <alpha-value>)",
        ink: "rgb(var(--text-primary) / <alpha-value>)",
        "ink-soft": "rgb(var(--text-secondary) / <alpha-value>)",
        "ink-faint": "rgb(var(--text-muted) / <alpha-value>)",
        signal: "rgb(var(--accent-signal) / <alpha-value>)",
        telemetry: "rgb(var(--accent-telemetry) / <alpha-value>)",
        elite: "rgb(var(--accent-elite) / <alpha-value>)",
        caution: "rgb(var(--accent-caution) / <alpha-value>)",
        positive: "rgb(var(--accent-positive) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Rajdhani", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      backgroundImage: {
        "sector-stripe":
          "repeating-linear-gradient(135deg, transparent, transparent 6px, rgb(var(--border-hairline)) 6px, rgb(var(--border-hairline)) 7px)",
      },
    },
  },
  plugins: [],
};
