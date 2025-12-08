/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1a1a',
        surface: '#2a2a2a',
        primary: '#f97316', // Orange-500
        'primary-hover': '#fb923c', // Orange-400
        'text-primary': '#f2f2f2',
        'text-secondary': '#a3a3a3',
      }
    },
  },
  plugins: [],
}
