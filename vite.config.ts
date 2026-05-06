import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';

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
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {
      plugins: [cssPrefixPlugin],
    },
  },
  define: {
    "process.env": {},
    process: { env: {} },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/iife'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EasyMediaBundleFrontend',
      formats: ['iife'],
      fileName: () => 'easy-media.js',
    },
    rollupOptions: {
      output: {
        exports: 'named',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'easy-media.css';
          }

          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
