/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#ffffff",
          dark: "#020617",
        },
        foreground: {
          light: "#0f172a",
          dark: "#f8fafc",
        },
        muted: {
          light: "#f1f5f9",
          dark: "#1e293b",
        },
        "muted-foreground": {
          light: "#64748b",
          dark: "#94a3b8",
        },
        accent: {
          light: "#0f172a",
          dark: "#f8fafc",
        },
        "accent-foreground": {
          light: "#ffffff",
          dark: "#0f172a",
        },
        border: {
          light: "#e2e8f0",
          dark: "#334155",
        },
        "highlight-today": {
          light: "#3b82f6",
          dark: "#60a5fa",
        },
        danger: {
          light: "#ef4444",
          dark: "#f87171",
        },
      },
    },
  },
  plugins: [],
};
