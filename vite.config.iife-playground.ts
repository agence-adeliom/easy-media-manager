import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';

// Same `.easy-media` scope as the published IIFE build (vite.config.ts), so the e2e tests see its CSS.
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
