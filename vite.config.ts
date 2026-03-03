import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const disableHmr = process.env.DISABLE_HMR === 'true' || env.DISABLE_HMR === 'true';
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: disableHmr ? false : {
          clientPort: 443,
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: [],
          manifest: {
            name: 'Super FC AI',
            short_name: 'SuperFC',
            description: 'Super FC AI Application',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: 'logo.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'logo.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          devOptions: {
            enabled: true
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
