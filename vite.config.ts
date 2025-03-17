import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcssImport from 'postcss-import'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindNesting from 'tailwindcss/nesting'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  css: {
    postcss: {
      plugins: [
        postcssImport,
        tailwindNesting,
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
