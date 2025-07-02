// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Corrected custom color palette as per your latest instruction
      colors: {
        darkGreen: '#1A4D2E',
        mediumGreen: '#4F6C4C',
        lightGreen: '#738C71',
        accentGold: '#FFC200',
        offWhite: '#F3F4F6',
        darkGray: '#1F2937',
        deepGray: '#111827',
        // Note: 'errorRed' was in the previous config but not in your new list.
        // I'll retain it for now as a utility color, but let me know if it should be removed.
        errorRed: '#e53e3e',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem', // Consistent rounded corners
      },
      boxShadow: {
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
