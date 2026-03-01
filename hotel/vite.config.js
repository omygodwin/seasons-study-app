import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/seasons-study-app/hotel/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: '/seasons-study-app/hotel/',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
      manifest: false,
    }),
  ],
})
