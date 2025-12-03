import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  base: '/Storix/', // Repository name
  plugins: [
    react(),
    svgr(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   injectRegister: 'auto',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   },
    //   manifest: {
    //     name: 'Inventory Manager',
    //     short_name: 'Inventory',
    //     description: 'A simple inventory management app.',
    //     theme_color: '#ffffff',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.svg',
    //         sizes: '192x192',
    //         type: 'image/svg+xml'
    //       },
    //       {
    //         src: 'pwa-512x512.svg',
    //         sizes: '512x512',
    //         type: 'image/svg+xml'
    //       }
    //     ]
    //   }
    // }),
    // tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },

      manifest: {
        name: "Storix",
        short_name: "StoX",
        description: "Storix is a modern hybrid inventory and POS system that works with both Google Sheets and traditional databases. Fast, simple, and completely free — manage products, stock, and sales from anywhere.",
        theme_color: "#0a70e6",
        background_color: "#0a70e6",
        display: "standalone",
        start_url: "/Storix/",
        scope: "/Storix/",
        icons: [
          {
            "src": "android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ],
        "screenshots": [
          {
            "src": "screenshots/product-1280x720.png",
            "sizes": "1280x720",
            "type": "image/png",
            "form_factor": "wide",
            "label": "Product Page"
          },
          {
            "src": "screenshots/product-720x1280.png",
            "sizes": "720x1280",
            "type": "image/png",
            "form_factor": "narrow",
            "label": "Product Page"
          }
        ]
      }
    }),
    tailwindcss(),
  ],
})
