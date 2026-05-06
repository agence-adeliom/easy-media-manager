import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import prefixSelector from 'postcss-prefix-selector';
import { defineConfig } from 'vite';
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
      external: ['react', 'react-dom', 'react-dom/client'],
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
