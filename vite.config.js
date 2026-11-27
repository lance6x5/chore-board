import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// GitHub Pages serves the app from /chore-board/
export default defineConfig({
  base: '/chore-board/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg'],
      manifest: {
        name: 'Chore Champs',
        short_name: 'Chore Champs',
        description: 'Chore Champs - little helpers, big wins. A family chore and allowance board.',
        theme_color: '#2F5BEA',
        background_color: '#F5F7FF',
        display: 'standalone',
        orientation: 'any',
        start_url: '/chore-board/',
        scope: '/chore-board/',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
