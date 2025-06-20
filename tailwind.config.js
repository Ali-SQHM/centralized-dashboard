/** @type {import('tailwindcss').Config} */
export default { // Note: 'export default' for Vite environments
  content: [
    "./index.html", // Vite's primary HTML entry point
    "./src/**/*.{js,ts,jsx,tsx}", // All your React component files
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}