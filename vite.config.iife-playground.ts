import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { unlayeredCss } from './vite-plugin-unlayered-css.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), unlayeredCss()],
  define: {
    // Vite 8 no longer resolves NODE_ENV through the blanket `process.env: {}`,
    // which leaves bare `process.env.NODE_ENV` reads in the IIFE bundle.
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": {},
    process: { env: {} },
  },
  build: {
    outDir: resolve(__dirname, 'dist/iife'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'playground/iife/entry.ts'),
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
      '@agence-adeliom/easy-media-manager/plugin-sdk': resolve(__dirname, 'src/plugin-sdk.ts'),
      '@agence-adeliom/easy-media-manager': resolve(__dirname, 'src/index.ts'),
      '@': resolve(__dirname, 'src'),
    },
  },
});
