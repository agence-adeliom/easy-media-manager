import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
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
      '@adeliom/easy-media-manager/plugin-sdk': resolve(__dirname, 'src/plugin-sdk.ts'),
      '@adeliom/easy-media-manager': resolve(__dirname, 'src/index.ts'),
      '@': resolve(__dirname, 'src'),
    },
  },
});
