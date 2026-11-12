import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Esto obliga al celular a guardar la página, los colores y las letras
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Tarjetas STEEL Centinela',
        short_name: 'STEEL NFC',
        theme_color: '#FF6600',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ]
})
