import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // One service worker, written in src/sw.ts: precaching plus push notifications
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // No update prompt exists in the UI, so new versions install and reload on their own
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'MoneyTalk - Gestor financiero',
        short_name: 'MoneyTalk',
        description: 'Tu gestor financiero personal con IA y voz',
        lang: 'es',
        theme_color: '#10b981',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
        shortcuts: [
          { name: 'Agregar transacción', short_name: 'Nueva', url: '/transactions/new' },
          { name: 'Panel principal', short_name: 'Panel', url: '/dashboard' },
          { name: 'Reportes', short_name: 'Reportes', url: '/reports' },
        ],
      },
      // The service worker only runs in builds (`pnpm build && pnpm preview`);
      // set to true locally to test push notifications in dev
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
