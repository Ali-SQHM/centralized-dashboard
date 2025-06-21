/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      // --- ADDED CUSTOM COLORS ---
      colors: {
        darkGreen: '#1A4D2E',
        mediumGreen: '#4F6C4C',
        lightGreen: '#738C71',
        accentGold: '#FFC200',
        offWhite: '#F3F4F6',
        darkGray: '#1F2937',
        deepGray: '#111827',
      },
      // --- END CUSTOM COLORS ---
    },
  },
  plugins: [],
}