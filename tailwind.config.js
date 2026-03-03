/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // enable class-based dark mode (scalable to other themes)
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
