import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const disableHmr = process.env.DISABLE_HMR === 'true' || env.DISABLE_HMR === 'true';
    const backendPort = env.BACKEND_PORT || process.env.BACKEND_PORT || '3001';
    const hmrClientPort = env.HMR_CLIENT_PORT || process.env.HMR_CLIENT_PORT;
    const hmrHost = env.HMR_HOST || process.env.HMR_HOST;
    const hmrProtocol = env.HMR_PROTOCOL || process.env.HMR_PROTOCOL;

    const hmr = disableHmr
      ? false
      : (hmrClientPort || hmrHost || hmrProtocol)
        ? {
            ...(hmrClientPort ? { clientPort: parseInt(hmrClientPort, 10) } : {}),
            ...(hmrHost ? { host: hmrHost } : {}),
            ...(hmrProtocol ? { protocol: hmrProtocol as 'ws' | 'wss' } : {}),
          }
        : true;

    return {
      base: './',
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: `http://localhost:${backendPort}`,
            changeOrigin: true,
          },
        },
        hmr,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'script',
          includeAssets: ['logo.png', 'new_logo.png'],
          manifest: {
            name: 'Super Fire Code AI',
            short_name: 'SuperFC AI',
            description: 'AI-powered Fire Safety Inspection Assistant for BFP personnel.',
            theme_color: '#0B0E14',
            background_color: '#0B0E14',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            scope: '/',
            icons: [
              {
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                // Cache Google Fonts stylesheets
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // Cache Google Fonts files
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                  },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // API calls — serve cached data when offline (NetworkFirst)
                urlPattern: /^\/api\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24, // 24 hours
                  },
                  networkTimeoutSeconds: 10,
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
              {
                // All other static assets — StaleWhileRevalidate
                urlPattern: /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'static-assets-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                },
              },
            ],
          },
          devOptions: {
            enabled: true,
            type: 'module',
          },
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
