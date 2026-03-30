# Configuration Reference

Full reference for all `@adeliom/easy-media-manager` configuration options.

---

## Table of Contents

- [Quick start: configure once, use everywhere](#quick-start-configure-once-use-everywhere)
- [EasyMediaInitConfig](#easymediainitconfig) — full config object passed to `EasyMedia.configure()` / `EasyMedia.init()`
- [EasyMediaConfigOverride](#easymediaconfigoverride) — partial overrides for `EasyMedia.mount()`
- [EasyMediaMountOptions](#easymediamountoptions) — options for `EasyMedia.mount()`
- [EasyMediaConfig](#easymediaconfig) — general settings
- [EasyMediaRoutes](#easymediaroutes) — API endpoint mapping
- [EasyMediaFeatureFlags](#easymediafeatureflags) — enable/disable capabilities
- [PickOptions](#pickoptions) — options for `EasyMedia.pick()`
- [EasyMediaTranslations](#easymediatranslations) — i18n
- [Plugin API](#plugin-api) — extending the media manager
- [Media Types](#media-types) — TypeScript types for media items

---

## Quick start: configure once, use everywhere

Call `EasyMedia.configure()` once at startup (before any `mount()` or `pick()` calls). Both methods will then reuse the stored configuration automatically.

```typescript
// 1. Register plugins (optional)
EasyMedia.use(myPlugin);

// 2. Set the configuration once
EasyMedia.configure({
  locale: 'fr',
  translations: frTranslations,
  config: { baseUrl: '/api', generatingAlts: true },
  features: {
    enableEditor: true,
    enableUpload: true,
    enableMove: true,
    enableRename: true,
    enableMetas: true,
    enableDelete: true,
    enableBulkSelection: true,
    enableGeneratingAlts: true,
  },
  routes: {
    files: '/get-files',
    // ... all routes
  },
});

// 3. Mount a full-page manager (no config needed)
EasyMedia.mount({ target: '#app' });

// 4. Open a picker anywhere (auto-initializes from stored config)
const file = await EasyMedia.pick();

// Per-call overrides are still supported
const image = await EasyMedia.pick({
  restrictions: { path: '/images', uploadTypes: ['image/*'] },
  features: { enableDelete: false },
});
```

You can also still pass the full config inline to `mount()` if you prefer — backwards compatibility is preserved:

```typescript
EasyMedia.mount({ target: '#app', config: { ... }, routes: { ... }, features: { ... }, translations: { ... } });
```

---

## EasyMediaInitConfig

Full configuration object. Passed to `EasyMedia.configure(config)` or `EasyMedia.init(config)`, or provided inline to `EasyMedia.mount()`.

```typescript
interface EasyMediaInitConfig {
  config: EasyMediaConfig;
  routes: EasyMediaRoutes;
  translations: EasyMediaTranslations;
  features: EasyMediaFeatureFlags;
  locale?: string;
}
```

All four keys (`config`, `routes`, `translations`, `features`) are required.

---

## EasyMediaConfigOverride

A partial version of `EasyMediaInitConfig` used for per-call overrides in `EasyMedia.mount()`. Every key is optional; omitted keys fall back to the value set by `EasyMedia.configure()`.

```typescript
type EasyMediaConfigOverride = Partial<EasyMediaInitConfig>;
```

Merge rules when a global config exists and an override is provided:
- `config` — replaced whole if provided
- `routes` — replaced whole if provided
- `features` — replaced whole if provided
- `translations` — shallow-merged (`{ ...globalTranslations, ...override.translations }`)
- `locale` — last-write-wins

---

## EasyMediaMountOptions

Options for `EasyMedia.mount()`. The `target` is always required; all config keys are optional when a global config has been set via `EasyMedia.configure()`.

```typescript
type EasyMediaMountOptions = EasyMediaConfigOverride & {
  target: string | HTMLElement;
};
```

---

## EasyMediaConfig

```typescript
interface EasyMediaConfig {
  baseUrl?: string;
  hideFilesExt?: string[];
  mimeTypes?: EasyMediaMimeTypes;
  generatingAlts: boolean;
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `baseUrl` | `string` | No | Base URL automatically prepended to every route (e.g. `"/api"`). When set, routes should be defined without this prefix. |
| `hideFilesExt` | `string[]` | No | List of extensions or filenames to hide from the browser. Each entry should include the leading dot (e.g. `".php"`, `".DS_Store"`). Matching is case-insensitive and uses a suffix check on the filename, so it handles both standard extensions (`.php`, `.env`) and dot-files (`.DS_Store`, `.gitkeep`). Folders are never hidden. Pass `[]` to hide nothing. |
| `mimeTypes` | `EasyMediaMimeTypes` | No | Override the MIME type categories used for filtering. See below. |
| `generatingAlts` | `boolean` | Yes | Enable the AI alt-text generation feature globally. Also requires `features.enableGeneratingAlts`. |

### EasyMediaMimeTypes

```typescript
interface EasyMediaMimeTypes {
  image: string[];   // MIME types considered images (e.g. ["image/jpeg", "image/png"])
  archive: string[]; // MIME types considered archives
  [key: string]: string[]; // Custom categories
}
```

---

## EasyMediaRoutes

Maps each manager action to a backend endpoint. Every property is required. All paths are relative to `config.baseUrl`.

```typescript
interface EasyMediaRoutes {
  files: string;
  upload: string;
  uploadCropped: string;
  uploadLink: string;
  newFolder: string;
  deleteFile: string;
  moveFile: string;
  renameFile: string;
  editMetas: string;
  generateAlt: string;
  generateAltGroup: string;
  generateAllAlt: string;
  globalSearch: string;
  folderDownload: string;
  filesDownload: string;
}
```

| Property | HTTP method | Description |
|----------|-------------|-------------|
| `files` | `POST` | List files and folders in a given folder. |
| `upload` | `POST` (multipart) | Upload one or more files. |
| `uploadCropped` | `POST` (multipart) | Upload a cropped version of an image. |
| `uploadLink` | `POST` | Import a file from a remote URL. |
| `newFolder` | `POST` | Create a new folder. |
| `deleteFile` | `POST` | Delete one or more files or folders. |
| `moveFile` | `POST` | Move files to a different folder. |
| `renameFile` | `POST` | Rename a file or folder. |
| `editMetas` | `POST` | Update metadata (alt, title, description) for a file. |
| `generateAlt` | `POST` | AI-generate alt text for a single file. |
| `generateAltGroup` | `POST` | AI-generate alt text for a selection of files. |
| `generateAllAlt` | `POST` | AI-generate alt text for all files in the current folder. |
| `globalSearch` | `POST` | Full-text search across all files. |
| `folderDownload` | `POST` | Download a folder as a ZIP archive. |
| `filesDownload` | `POST` | Download a selection of files as a ZIP archive. |

### Example

```typescript
// With baseUrl: '/api' in config — routes are relative to the base
routes: {
  files: '/get-files',
  upload: '/upload',
  uploadCropped: '/upload-cropped',
  uploadLink: '/upload-link',
  newFolder: '/create-new-folder',
  deleteFile: '/delete-file',
  moveFile: '/move-file',
  renameFile: '/rename-file',
  editMetas: '/edit-metas-file',
  generateAlt: '/generate-alt-file',
  generateAltGroup: '/generate-alt-group',
  generateAllAlt: '/generate-all-alt',
  globalSearch: '/global-search',
  folderDownload: '/folder-download',
  filesDownload: '/files-download',
}

// Without baseUrl — use full paths
routes: {
  files: '/api/get-files',
  // ...
}
```

---

## EasyMediaFeatureFlags

Controls which capabilities are available in the UI. All properties are required and must be explicitly set to `true` or `false`.

```typescript
interface EasyMediaFeatureFlags {
  enableEditor: boolean;
  enableUpload: boolean;
  enableMove: boolean;
  enableRename: boolean;
  enableMetas: boolean;
  enableDelete: boolean;
  enableBulkSelection: boolean;
  enableGeneratingAlts: boolean;
  enableSearch: boolean;
  enableFilter: boolean;
  enableSort: boolean;
}
```

| Flag | Default | Description |
|------|---------|-------------|
| `enableEditor` | `false` | Show the image crop/edit toolbar action and editor modal. |
| `enableUpload` | `false` | Show the upload zone and the "Upload from URL" action. |
| `enableMove` | `false` | Allow dragging files between folders and show the move action. |
| `enableRename` | `false` | Show the rename action in the toolbar. |
| `enableMetas` | `false` | Show the metadata editing panel in the sidebar and toolbar. |
| `enableDelete` | `false` | Show the delete action in the toolbar and via keyboard shortcut. |
| `enableBulkSelection` | `false` | Allow multi-file selection and bulk operations. |
| `enableGeneratingAlts` | `false` | Show AI alt-text generation actions (also requires `config.generatingAlts: true`). |
| `enableSearch` | `true` | Show the search bar in the toolbar. |
| `enableFilter` | `true` | Show the file type filter options in the toolbar dropdown. |
| `enableSort` | `true` | Show the sort options in the toolbar dropdown. |

Flags can also be overridden per `pick()` call via `PickOptions.features`.

---

## PickOptions

Options passed to `EasyMedia.pick()` to open the file picker modal. If `EasyMedia.configure()` was called and the library has not yet been initialized, `pick()` will auto-initialize using the stored configuration before opening the modal.

```typescript
interface PickOptions {
  restrictions?: PickRestrictions;
  features?: Partial<EasyMediaFeatureFlags>;
}

interface PickRestrictions {
  path?: string | null;
  uploadTypes?: string[] | null;
  uploadSize?: number | null;
}
```

### PickOptions

| Property | Type | Description |
|----------|------|-------------|
| `restrictions` | `PickRestrictions` | Limit which files the user can navigate to or upload. |
| `features` | `Partial<EasyMediaFeatureFlags>` | Override feature flags for this picker session only. |

### PickRestrictions

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string \| null` | Restrict the picker to a specific folder path. The user cannot navigate above it. |
| `uploadTypes` | `string[] \| null` | Allowed MIME types for uploads in this session (e.g. `["image/*", "application/pdf"]`). |
| `uploadSize` | `number \| null` | Maximum upload file size in bytes. |

### Example

```typescript
const image = await EasyMedia.pick({
  restrictions: {
    path: '/uploads/images',
    uploadTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadSize: 10_000_000, // 10 MB
  },
  features: {
    enableDelete: false,   // read-only picker
    enableBulkSelection: false,
  },
});
```

---

## EasyMediaTranslations

A flat key/value object. You can pass one of the built-in translation objects, override individual keys, or provide a completely custom translation set.

```typescript
type EasyMediaTranslations = Record<string, string>;
```

### Built-in translations

```typescript
import { enTranslations, frTranslations } from '@adeliom/easy-media-manager';
```

Pass them directly or spread and override specific keys:

```typescript
translations: {
  ...enTranslations,
  'toolbar.delete': 'Remove file',
  'upload.drop_here': 'Drop your files here',
}
```

### IIFE usage

The built-in translations are available on the global `EasyMedia.translations` object:

```javascript
translations: EasyMedia.translations?.en ?? {}
```

### Plugin translations

Plugins declare their own translation keys in `plugin.translations`. These are merged in before the config translations, so you can override plugin strings from the init config.

---

## Plugin API

Import types and helpers from the plugin SDK entry point:

```typescript
import {
  defineEasyMediaPlugin,
  registerEasyMediaPlugin,
} from '@adeliom/easy-media-manager/plugin-sdk';
```

### EasyMediaPlugin

```typescript
interface EasyMediaPlugin {
  id: string;
  order?: number;
  translations?: Record<string, string>;
  toolbarActions?: EasyMediaToolbarAction[];
  modals?: EasyMediaModalDefinition[];
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique plugin identifier. |
| `order` | `number` | Controls plugin registration order when multiple plugins are used. Lower values load first. |
| `translations` | `Record<string, string>` | Translation keys provided by this plugin. Can be overridden from the init config. |
| `toolbarActions` | `EasyMediaToolbarAction[]` | Actions added to the toolbar. |
| `modals` | `EasyMediaModalDefinition[]` | Modal panels registered by this plugin. |

### EasyMediaToolbarAction

```typescript
interface EasyMediaToolbarAction {
  id: string;
  pluginId: string;
  icon: ComponentType<{ className?: string }>;
  labelKey: string;
  section?: 'primary' | 'selection' | 'utility';
  order?: number;
  isVisible(context: EasyMediaPluginContext): boolean;
  isDisabled?(context: EasyMediaPluginContext): boolean;
  onClick(context: EasyMediaPluginContext): void;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique action identifier. |
| `pluginId` | `string` | Must match the parent plugin's `id`. |
| `icon` | `ComponentType` | Lucide React icon or any React component accepting `className`. |
| `labelKey` | `string` | Translation key for the tooltip/label. |
| `section` | `'primary' \| 'selection' \| 'utility'` | Toolbar section. `primary` = always visible, `selection` = visible when a file is selected, `utility` = secondary actions. Defaults to `'utility'`. |
| `order` | `number` | Position within the section. Lower = closer to the start. |
| `isVisible` | `(ctx) => boolean` | Return `false` to hide the button entirely. |
| `isDisabled` | `(ctx) => boolean` | Return `true` to render the button as disabled. |
| `onClick` | `(ctx) => void` | Action handler. Typically calls `ctx.runtime.openModal(modalId)`. |

### EasyMediaModalDefinition

```typescript
interface EasyMediaModalDefinition {
  id: string;
  pluginId: string;
  component: ComponentType<EasyMediaPluginModalProps>;
}

interface EasyMediaPluginModalProps {
  close: () => void;
  context: EasyMediaPluginContext;
}
```

### EasyMediaPluginContext

The context object passed to all plugin callbacks and modal components.

```typescript
interface EasyMediaPluginContext {
  runtime: {
    openModal(modalId: string): void;
    closeModal(): void;
    refresh(): void;              // Re-fetch the current folder
  };
  mode: 'fullpage' | 'modal';    // How the manager is displayed
  selectedFile: MediaItem | null; // Currently focused file
  bulkList: MediaItem[];          // Files in bulk selection
  bulkMode: boolean;              // Whether bulk mode is active
  features: EasyMediaFeatureFlags;
  routes: EasyMediaRoutes | null;
  config: EasyMediaConfig | null;
  currentFolderId: number | null;
  currentPath: string;
  t(key: string): string;         // Translate a key using current translations
}
```

### Registration

Plugins must be registered **before** `EasyMedia.init()` is called. Use either:

```typescript
// Helper (queues the plugin for registration at init time)
defineEasyMediaPlugin(myPlugin);

// Or push to the pre-init queue manually (IIFE-friendly)
window.EasyMediaPlugins ??= [];
window.EasyMediaPlugins.push(myPlugin);
```

After `init()`, you can still register plugins programmatically:

```typescript
EasyMedia.use(myPlugin);
EasyMedia.useMany([plugin1, plugin2]);
```

---

## Media Types

### MediaItem

```typescript
type MediaItem = FolderItem | MediaFileItem;
```

### FolderItem

```typescript
interface FolderItem {
  id: number;
  name: string;
  type: 'folder';
  path: string;
  storage_path: string;
}
```

### MediaFileItem

```typescript
interface MediaFileItem {
  id: number;
  name: string;
  type: string;          // MIME type, e.g. "image/jpeg"
  size: number;          // Size in bytes
  path: string;
  download_url: string | null;
  storage_path: string;
  last_modified: number | string | null;
  last_modified_formated: string;
  metas: MediaMetas;
}
```

### MediaMetas

All metadata fields are optional. Your backend can extend this object with custom keys.

```typescript
interface MediaMetas {
  alt?: string;
  title?: string;
  description?: string;
  icon?: string;
  image?: string;                                      // oEmbed thumbnail URL
  code?: { html: string; ratio?: number };             // oEmbed embed code (ratio = height/width * 100)
  provider?: { name: string; url?: string };           // oEmbed provider
  author?: { name: string; url?: string };             // oEmbed author
  type?: string;
  url?: string;
  duration?: number;                                  // Audio/video duration in seconds
  tags?: {
    title?: string;
    album?: string;
    artist?: string;
    genre?: string;
    year?: string;
  };
  dimensions?: { width?: number; height?: number };
  extra?: Record<string, string>;                     // Arbitrary key/value pairs
  [key: string]: unknown;                             // Any additional fields
}
```

### FileCategory

The logical category inferred from a file's MIME type.

```typescript
type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'application'
  | 'compressed'
  | 'oembed'
  | 'folder';
```

### Type guards

```typescript
import { isFolder, isMediaFile } from '@adeliom/easy-media-manager';

if (isFolder(item)) {
  console.log('folder:', item.name);
}

if (isMediaFile(item)) {
  console.log('file:', item.metas.alt);
}
```
