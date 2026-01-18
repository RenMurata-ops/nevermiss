/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@nevermiss/ui/tailwind.config.js")],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
};
