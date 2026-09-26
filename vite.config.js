import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// DataPD (www.datapd.ai) — static site. index.html (DataPD home) is the only Vite entry;
// every other page lives in public/ and is copied as-is: public/stories/ (DataPD 이야기),
// public/drchoistudio/ (project 01, 최박사사진관 — datapd.ai/drchoistudio/).
// The PWA plugin stays on purpose: it ships a new service worker at the same /sw.js, which
// replaces the old game-era worker in returning visitors' browsers and clears its outdated caches.
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'DataPD — 오리지널 데이터',
        short_name: 'DataPD',
        description: '복제는 무한하고, 원본은 하나입니다. DataPD는 오리지널 데이터를 기록하고, 그것이 원본인지 누구나 확인할 수 있게 합니다.',
        theme_color: '#F4F4F1',
        background_color: '#F4F4F1',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        categories: ['utilities', 'photo'],
        lang: 'ko',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // drchoistudio/certificates.json and sample photos are deliberately NOT precached:
        // verification must always read the live registry and exact file bytes.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // The studio home redirects to the external studio site (vercel.json); a precached copy
        // would keep answering /drchoistudio/ from the cache instead.
        globIgnores: ['drchoistudio/index.html'],
        // Multi-page static site, not an SPA: never answer a navigation with index.html.
        // Unknown URLs must reach the host (Vercel) so they get 404.html.
        navigateFallback: null,
        // /drchoistudio/certificate.html?id=… and /drchoistudio/verify.html?id=… must hit their own precached page;
        // the page script reads the id from location.search itself.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^id$/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Reload open tabs once when a new worker replaces an older one (see public/sw-refresh.js).
        importScripts: ['sw-refresh.js'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: { main: 'index.html' },
    },
  },
});
