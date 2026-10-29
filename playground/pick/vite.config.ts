import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';

// Same `.easy-media` scope as the distribution, except for the demo page's own stylesheet.
const cssPrefixPlugin = prefixSelector({
  prefix: '.easy-media',
  ignoreFiles: [resolve(__dirname, 'style.css')],
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
    port: 5175,
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
      '@agence-adeliom/easy-media-manager/plugin-sdk': resolve(__dirname, '../../src/plugin-sdk.ts'),
      '@agence-adeliom/easy-media-manager': resolve(__dirname, '../../src/index.ts'),
      '@': resolve(__dirname, '../../src'),
    },
  },
});
