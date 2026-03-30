import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

// Shared deps that the main easy-media.js IIFE exposes as globals.
// The plugin must NOT bundle its own copies to avoid duplicate React instances.
const SHARED_GLOBALS: Record<string, string> = {
  'react': 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOM',
  '@tanstack/react-query': 'ReactQuery',
  'sonner': 'Sonner',
  '@adeliom/easy-media-manager/plugin-sdk': 'EasyMediaPluginSDK',
};

// Vite plugin with enforce:'pre' so it runs before Vite's own package
// resolution and intercepts shared deps before they can be bundled.
function externalizeSharedDeps(): Plugin {
  return {
    name: 'externalize-shared-deps',
    enforce: 'pre',
    resolveId(id) {
      if (id in SHARED_GLOBALS) {
        return { id: SHARED_GLOBALS[id], external: true };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), externalizeSharedDeps()],
  define: {
    'process.env': {},
    process: { env: {} },
  },
  build: {
    outDir: resolve(__dirname, 'dist/iife'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'examples/plugins/generate-alt/iife-entry.ts'),
      name: 'GenerateAltPlugin',
      formats: ['iife'],
      fileName: () => 'easy-media-plugin-generate-alt.js',
    },
    rollupOptions: {
      output: {
        // Map external module ids (set by externalizeSharedDeps) to the global
        // variable names that easy-media.js exposes on the host page.
        globals: Object.fromEntries(
          Object.values(SHARED_GLOBALS).map((globalName) => [globalName, globalName]),
        ),
      },
    },
  },
});
