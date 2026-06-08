/**
 * vite.config.js
 * Vite configuration: React plugin, Tailwind CSS v4 plugin,
 * and a proxy to forward /api requests to the backend on port 5000.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
