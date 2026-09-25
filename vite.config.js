import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// 최박사사진관 — static site. index.html is the only Vite entry; every other page
// lives in public/ and is copied as-is. The PWA plugin stays on purpose: it ships a
// new service worker at the same /sw.js, which replaces the old game-era worker in
// returning visitors' browsers and clears its outdated caches.
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: '최박사사진관 — 원본 인증 셀프 사진관',
        short_name: '최박사사진관',
        description: '찍는 순간 원본이 증명되는 셀프 사진관. 대구 범어.',
        theme_color: '#F4F4F1',
        background_color: '#F4F4F1',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        categories: ['photo', 'lifestyle'],
        lang: 'ko',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // certificates.json and sample photos are deliberately NOT precached:
        // verification must always read the live registry and exact file bytes.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Multi-page static site, not an SPA: never answer a navigation with index.html.
        // Unknown URLs must reach GitHub Pages so they get 404.html.
        navigateFallback: null,
        // /certificate.html?id=… and /verify.html?id=… must hit their own precached page;
        // the page script reads the id from location.search itself.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^id$/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: { main: 'index.html' },
    },
  },
});
