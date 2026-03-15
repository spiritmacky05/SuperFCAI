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
          injectRegister: null,
          includeAssets: ['logo.png'],
          manifest: {
            name: 'Super FC AI',
            short_name: 'SuperFC',
            description: 'Super FC AI Application',
            theme_color: '#0B0E14',
            background_color: '#0B0E14',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: '/logo.png',
                sizes: 'any',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          devOptions: {
            enabled: false
          }
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
