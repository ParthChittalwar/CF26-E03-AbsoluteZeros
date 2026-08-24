/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0F1A",
        surface: "#111A2B",
        "surface-raised": "#17233A",
        border: "#24314A",
        teal: "#22C4A0",
        cyan: "#4CC9F0",
        amber: "#F2A93B",
        red: "#F0554D",
        ink2: "#E7ECF3",
        muted: "#8DA0BE",
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["Manrope", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "monospace"],
      },
    },
  },
  plugins: [],
};
