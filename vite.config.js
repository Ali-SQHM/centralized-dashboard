import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removed any explicit 'css.postcss' or 'build.rollupOptions.input' configurations.
  // Vite's defaults are designed to work with index.html in the root and postcss.config.cjs.
})