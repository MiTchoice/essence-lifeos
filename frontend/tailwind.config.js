/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:"#eef2ff", 100:"#e0e7ff", 200:"#c7d2fe",
          300:"#a5b4fc", 400:"#818cf8", 500:"#6366f1",
          600:"#4f46e5", 700:"#4338ca", 800:"#3730a3", 900:"#312e81",
        },
        accent: {
          green: "#22c55e", lime: "#a3e635", cyan: "#06b6d4",
          violet: "#8b5cf6", rose: "#f43f5e", amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans:    ["'Plus Jakarta Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "fade-in":   "fadeIn 0.2s ease-out",
        "slide-up":  "slideUp 0.3s ease-out",
        "pulse-slow":"pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:  { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp: { from:{ opacity:0, transform:"translateY(12px)" }, to:{ opacity:1, transform:"translateY(0)" } },
      },
    },
  },
  plugins: [],
};
