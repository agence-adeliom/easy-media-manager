import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': {},
    process: { env: {} },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/dev-server': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // Pointe vers le source pour le dev (HMR actif)
      // Pour tester le build ESM compilé : remplacer par '../../dist/index.js'
      '@adeliom/easy-media-manager/plugin-sdk': resolve(__dirname, '../../src/plugin-sdk.ts'),
      '@adeliom/easy-media-manager': resolve(__dirname, '../../src/index.ts'),
      '@': resolve(__dirname, '../../src'),
    },
  },
});
