/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'script': ['Playwrite CZ', 'cursive'],
        'dancing': ['Dancing Script', 'cursive'],
        'th': ['Sarabun', 'sans-serif'],
        'cinzel': ['Cinzel', 'serif'],
        // ตั้งค่า Sarabun เป็นฟอนต์หลัก (sans-serif)
        'sans': ['Sarabun', 'Noto Sans Thai', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        'primary': '#5c3a58',
        'gold': '#d4af37',
        'soft-pink': '#d48c95',
        'dark-text': '#5c3a58',
        'bg-cream': '#fdfcf8',
      },
    },
  },
  plugins: [],
}

