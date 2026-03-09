/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          DEFAULT: "#0a0a0f",
          soft: "#111118",
          muted: "#1a1a24",
        },
        slate: {
          line: "#2a2a38",
          sub: "#3a3a50",
        },
        ghost: {
          DEFAULT: "#8888a8",
          bright: "#aaaac8",
        },
        cream: "#f0ede6",
        sport: {
          nfl: "#c8392b",
          nba: "#e85d04",
          mlb: "#1a5fb4",
          nhl: "#1d6fa4",
          ncaa: "#6a2fa0",
          soccer: "#2d8a4e",
          all: "#d4a017",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.4, transform: "scale(0.85)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
      },
    },
  },
  plugins: [],
};
