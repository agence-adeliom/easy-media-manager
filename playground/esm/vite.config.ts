import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';

// Reproduit le scoping CSS de la distribution (.easy-media) en mode dev,
// pour tester le comportement réel (ex. cible des portails de modales).
const cssPrefixPlugin = prefixSelector({
  prefix: '.easy-media',
  transform(prefix, selector, prefixedSelector) {
    if (selector.startsWith('.easy-media')) return selector;
    if (selector.includes('sonner') || selector.includes('data-sonner')) return selector;
    if (selector === ':root') return prefix;
    if (selector === 'html' || selector === 'body') return prefix;
    if (selector === '*') return `${prefix} *`;
    return prefixedSelector;
  },
});

export default defineConfig({
  root: resolve(__dirname),
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {
      plugins: [cssPrefixPlugin],
    },
  },
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
