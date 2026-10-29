import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';

import { unlayeredCss } from './vite-plugin-unlayered-css.ts';
import dts from 'vite-plugin-dts';

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
  plugins: [
    react(),
    tailwindcss(),
    unlayeredCss(),
    dts({
      include: ['src/index.ts', 'src/plugin-sdk.ts'],
      rollupTypes: true,
      outDir: 'dist/esm',
    }),
  ],
  css: {
    postcss: {
      plugins: [cssPrefixPlugin],
    },
  },
  define: {
    // Keep NODE_ENV resolvable so bundled deps (and React's runtime) pick the
    // production branch. A blanket `process.env: {}` makes NODE_ENV undefined,
    // which forces the React development jsx-runtime to be bundled.
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": {},
    process: { env: {} },
  },
  build: {
    outDir: resolve(__dirname, 'dist/esm'),
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'plugin-sdk': resolve(__dirname, 'src/plugin-sdk.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      output: {
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'style.css';
          }
          return 'assets/[name][extname]';
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
