# @adeliom/easy-media-manager

A headless, framework-agnostic media manager built with React — file browsing, upload, cropping, metadata editing, and a picker modal, all wired to your own backend API.

## Features

- **File browser** — paginated grid with infinite scroll, drag-and-drop reordering, breadcrumb navigation
- **Upload** — drag-and-drop zone, clipboard paste, URL import, chunked XHR via Uppy
- **Image editor** — in-browser crop and export via `react-advanced-cropper`
- **Rich preview** — images, videos, audio, PDFs, oEmbed embeds
- **Metadata editing** — `alt`, `title`, `description`, and extensible custom fields
- **Bulk operations** — multi-select, batch move, batch delete, batch alt generation
- **Picker modal** — `EasyMedia.pick()` returns a Promise that resolves with the chosen file
- **Plugin system** — add toolbar actions and modals without forking the library
- **i18n** — English and French included, fully overridable
- **Two distribution formats** — standalone IIFE bundle or ESM with React as a peer dep

---

## Installation

### ESM (React project)

```bash
npm install @adeliom/easy-media-manager
# react and react-dom must already be in your project
```

### IIFE (plain HTML / non-React project)

Download the built assets from the `dist/iife/` directory of the npm package:

```html
<link rel="stylesheet" href="/path/to/easy-media.css" />
<script src="/path/to/easy-media.js"></script>
```

---

## Quick Start

### ESM

```typescript
import { EasyMedia, enTranslations } from '@adeliom/easy-media-manager';
import '@adeliom/easy-media-manager/style.css';

EasyMedia.mount({
  target: '#app',
  translations: enTranslations,
  config: {
    baseUrl: '/api',
    generatingAlts: false,
  },
  features: {
      // ... see @docs/configurations.md for full list
  },
  routes: {
    files: '/get-files',
    upload: '/upload',
    fileInfos: '/get-file-info',
    uploadCropped: '/upload-cropped',
    uploadLink: '/upload-link',
    newFolder: '/create-new-folder',
    deleteFile: '/delete-file',
    moveFile: '/move-file',
    renameFile: '/rename-file',
    editMetas: '/edit-metas-file',
    globalSearch: '/global-search',
    folderDownload: '/folder-download',
    filesDownload: '/files-download',
  },
});
```

### IIFE (script tag)

```html
<link rel="stylesheet" href="/easy-media.css" />
<div id="app" style="height:100vh"></div>
<script src="/easy-media.js"></script>
<script>
  EasyMedia.mount({
    target: '#app',
    translations: EasyMedia.translations?.en ?? {},
    config: {
      baseUrl: '/api',
      generatingAlts: false,
    },
    features: {
        // ... see @docs/configurations.md for full list
    },
    routes: {
      files: '/get-files',
      upload: '/upload',
      fileInfos: '/get-file-info',
      uploadCropped: '/upload-cropped',
      uploadLink: '/upload-link',
      newFolder: '/create-new-folder',
      deleteFile: '/delete-file',
      moveFile: '/move-file',
      renameFile: '/rename-file',
      editMetas: '/edit-metas-file',
      globalSearch: '/global-search',
      folderDownload: '/folder-download',
      filesDownload: '/files-download',
    },
  });
</script>
```

### File picker

Open a modal and wait for the user to select a file:

```typescript
const file = await EasyMedia.pick({
  restrictions: {
    path: '/images',           // restrict navigation to this folder
    uploadTypes: ['image/*'],  // only allow image uploads
    uploadSize: 5_000_000,     // 5 MB max
  },
});

if (file) {
  console.log(file.path, file.metas?.alt);
}
```

---

## Distribution formats

| Format | File | Use case |
|--------|------|----------|
| **IIFE** | `dist/iife/easy-media.js` | Plain HTML pages, CMS templates, Symfony Twig |
| **ESM** | `dist/index.js` | React apps, Vite/Webpack, TypeScript projects |
| **Plugin SDK** | `dist/plugin-sdk.js` | Building plugins without bundling the full manager |

The IIFE bundle embeds React and all dependencies. The ESM build externalises `react` and `react-dom` as peer dependencies and is fully tree-shakeable.

---

## Plugin system

Plugins add toolbar actions and custom modals without modifying the core library.

```typescript
import { defineEasyMediaPlugin } from '@adeliom/easy-media-manager/plugin-sdk';
import { Wand2 } from 'lucide-react';

const myPlugin = defineEasyMediaPlugin({
  id: 'my-plugin',
  translations: {
    'my-plugin.action': 'Do something',
    'my-plugin.modal.title': 'My modal',
  },
  toolbarActions: [
    {
      id: 'my-action',
      pluginId: 'my-plugin',
      icon: Wand2,
      labelKey: 'my-plugin.action',
      section: 'selection',
      isVisible: (ctx) => ctx.selectedFile !== null,
      onClick: (ctx) => ctx.runtime.openModal('my-plugin:my-modal'),
    },
  ],
  modals: [
    {
      id: 'my-plugin:my-modal',
      pluginId: 'my-plugin',
      component: ({ close, context }) => (
        <div>
          <p>Selected: {context.selectedFile?.name}</p>
          <button onClick={close}>Close</button>
        </div>
      ),
    },
  ],
});

// Register before or after init
EasyMedia.use(myPlugin);
```

Plugins can also be queued before `EasyMedia.init()` is called (useful in IIFE setups):

```javascript
window.EasyMediaPlugins ??= [];
window.EasyMediaPlugins.push(myPlugin);
```

---

## Contributing

### Getting started

```bash
git clone https://github.com/agence-adeliom/easy-media-manager.git
cd easy-media-manager
npm install
```

### Playground

The repository includes a full-stack dev environment under `playground/` that lets you work on the library against a real backend without needing an external project.

```bash
npm run playground
```

This starts two processes concurrently:

| Process | Command | URL | Description |
|---------|---------|-----|-------------|
| Express API server | `playground:server` | `http://localhost:3001` | REST API + IIFE test page |
| Vite dev server (ESM) | `playground:esm` | `http://localhost:5174` | HMR, imports directly from `src/` |

#### What the playground does

**Express server** (`playground/server/server.ts`) — implements the full API contract expected by EasyMedia:
- Stores file/folder metadata in a local SQLite database (`playground/data/dev.sqlite`)
- Persists uploaded files to `playground/data/uploads/` via a storage abstraction
- Handles chunked uploads (Uppy's Dropzone chunking protocol)
- Stubs out alt-generation routes (returns fake results instantly)
- Serves the IIFE test page at `http://localhost:3001`

On first start the database is empty and gets seeded automatically with demo folders and files if you have sample files available. You can also upload your own files directly through the UI.

**ESM playground** (`playground/esm/`) — a minimal React app that mounts `EasyMedia` against the Express API. It resolves `@adeliom/easy-media-manager` directly to `src/index.ts` so any source change triggers HMR immediately.

**IIFE playground** (`playground/iife/index.html`) — a plain HTML page served by the Express server that loads the compiled IIFE bundle from `dist/iife/`. Useful for testing the standalone bundle end-to-end.

```bash
npm run build:iife-playground  # IIFE bundle + example plugins → dist/iife/
npm run build:esm              # ESM bundle → dist/
npm run build:all              # Both distribution formats (no example plugins)
```

> `build:iife-playground` uses `playground/iife/entry.ts` which bundles example plugins alongside the library. Use `build` for the clean distribution build.

#### Data directory

`playground/data/` is gitignored — each contributor gets their own local database and uploads. Running `npm run playground` creates it automatically on first launch.

### Building & publishing

```bash
npm run prod       # type-check + build:all
npm publish        # runs prod automatically via prepublishOnly
```

---

## API reference

| Method | Signature | Description |
|--------|-----------|-------------|
| `mount` | `(options: EasyMediaInitConfig & { target }) => void` | Initialize and render full-page manager |
| `init` | `(config: EasyMediaInitConfig) => void` | Initialize without mounting |
| `pick` | `(options?: PickOptions) => Promise<MediaItem \| null>` | Open picker modal |
| `use` | `(plugin: EasyMediaPlugin) => void` | Register a plugin |
| `useMany` | `(plugins: EasyMediaPlugin[]) => void` | Register multiple plugins |
| `isReady` | `() => boolean` | Returns true after `init` |
| `translations` | `{ en, fr }` | Built-in translation objects |

See [CONFIGURATION.md](./CONFIGURATION.md) for the full configuration reference and [PLUGINS.md](./PLUGINS.md) for the plugin guide.

---

## Tech stack

| Library | Role |
|---------|------|
| React 18/19 | UI rendering |
| Zustand | Client-side state |
| TanStack Query | Server state & caching |
| Uppy | File upload engine |
| react-advanced-cropper | Image cropping |
| Tailwind CSS v4 | Styling |
| dnd-kit | Drag and drop |
| Lucide React | Icons |
| Sonner | Toast notifications |

---

## License

MIT © Adeliom
