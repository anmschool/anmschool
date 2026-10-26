import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png", "ANM-logo-circle.png"],
      manifest: {
        name: "경배와찬양학교 · ANM",
        short_name: "ANM",
        description: "경배와찬양학교 · 큰잔치 · 훈련 안내와 내 등록 정보",
        lang: "ko",
        start_url: "/",
        display: "standalone",
        background_color: "#FBFBF7",
        theme_color: "#3A1022",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}", "icons/*.png", "images/season-*.jpg"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          { urlPattern: /\/images\//, handler: "CacheFirst", options: { cacheName: "images", expiration: { maxEntries: 60 } } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: "StaleWhileRevalidate", options: { cacheName: "fonts" } },
        ],
      },
    }),
  ],
  server: { port: 5181 },
});
