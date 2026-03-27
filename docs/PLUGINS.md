# Plugin Guide

`@adeliom/easy-media-manager` ships with a plugin system that lets you add toolbar actions and modal panels without modifying the library source. This guide walks through the concepts and builds up to the complete source of the built-in `generate-alt` plugin.

---

## Table of Contents

- [How plugins work](#how-plugins-work)
- [Plugin anatomy](#plugin-anatomy)
- [Step-by-step: the generate-alt plugin](#step-by-step-the-generate-alt-plugin)
  - [1. Define IDs](#1-define-ids)
  - [2. Write the API client](#2-write-the-api-client)
  - [3. Write the modal component](#3-write-the-modal-component)
  - [4. Assemble the plugin object](#4-assemble-the-plugin-object)
- [Modal ID format](#modal-id-format)
- [Registering plugins](#registering-plugins)
- [Ordering plugins and actions](#ordering-plugins-and-actions)
- [Overriding plugin translations](#overriding-plugin-translations)

---

## How plugins work

When `EasyMedia.init()` runs:

1. It drains the `window.EasyMediaPlugins` queue (plugins registered before init).
2. It locks the registry — no more plugins can be added after this point.
3. Plugin translations are merged in, then overridden by the translations you passed in the init config.

Each plugin can contribute:
- **Toolbar actions** — buttons that appear in the top toolbar. Their visibility and disabled state are evaluated on each render via callbacks that receive the current context.
- **Modals** — panels opened by `context.runtime.openModal(modalId)`. They receive a `close` callback and the same context object.

---

## Plugin anatomy

```typescript
import type { EasyMediaPlugin } from '@adeliom/easy-media-manager/plugin-sdk';

const myPlugin: EasyMediaPlugin = {
  // Required: unique identifier for this plugin
  id: 'my-plugin',

  // Optional: controls load order when multiple plugins are registered
  order: 50,

  // Translation keys used by this plugin (can be overridden at init time)
  translations: {
    'my-plugin.action.label': 'Do something',
    'my-plugin.modal.title': 'My modal',
  },

  // Buttons added to the toolbar
  toolbarActions: [
    {
      id: 'open-modal',
      pluginId: 'my-plugin',        // must match plugin.id
      icon: SomeIcon,               // any React component accepting className
      labelKey: 'my-plugin.action.label',
      section: 'selection',         // 'primary' | 'selection' | 'utility'
      order: 10,
      isVisible: (ctx) => ctx.selectedFile !== null,
      isDisabled: (ctx) => false,
      onClick: (ctx) => ctx.runtime.openModal('plugin:my-plugin:my-modal'),
    },
  ],

  // Modal panels registered by this plugin
  modals: [
    {
      id: 'my-modal',
      pluginId: 'my-plugin',        // must match plugin.id
      component: MyModalComponent,
    },
  ],
};
```

> **Constraint:** every `toolbarAction.pluginId` and `modal.pluginId` **must** match the parent `plugin.id`. The registry will throw if they don't.

---

## Step-by-step: the generate-alt plugin

The `generate-alt` plugin is provided as a ready-to-use example in [`examples/plugins/generate-alt/`](../examples/plugins/generate-alt/) and enabled when `config.generatingAlts: true` and `features.enableGeneratingAlts: true`. It adds a sparkle button to the toolbar that opens a modal offering three alt-text generation scopes: selected file, current bulk selection, or all files in the folder.

### 1. Define IDs

Start by pinning the plugin ID and the modal ID as constants. This avoids typos and makes modal opening type-safe.

```typescript
const GENERATE_ALT_PLUGIN_ID = 'generate-alt';
const GENERATE_ALT_MODAL_ID  = 'main';
```

The full modal ID used at runtime is `plugin:generate-alt:main` — produced by `getPluginModalId(pluginId, modalId)` (see [Modal ID format](#modal-id-format)).

### 2. Write the API client

The plugin communicates with three separate backend routes. Isolating the HTTP calls in a small client object makes the modal component easier to read and test.

```typescript
// examples/plugins/generate-alt/api.ts

import { postJson, postVoid } from '@adeliom/easy-media-manager/plugin-sdk';

export interface GenerateAltRequest {
  file: { id: number };
  path: string;
}

export interface GenerateAltGroupRequest {
  files: number[];
}

export interface GenerateAltResponse {
  error: string;
  alt: string;
}

export interface GenerateAltBatchResponse {
  error: string | null;
  data: string;
}

export const generateAltClient = {
  // POST routes.generateAlt
  generateAlt(route: string, body: GenerateAltRequest): Promise<GenerateAltResponse> {
    return postJson<GenerateAltResponse, GenerateAltRequest>(route, body);
  },

  // POST routes.generateAltGroup
  generateAltGroup(route: string, body: GenerateAltGroupRequest): Promise<GenerateAltBatchResponse> {
    return postJson<GenerateAltBatchResponse, GenerateAltGroupRequest>(route, body);
  },

  // POST routes.generateAllAlt (no body)
  generateAllAlt(route: string): Promise<GenerateAltBatchResponse> {
    return postVoid<GenerateAltBatchResponse>(route);
  },
};
```

### 3. Write the modal component

The modal component receives `close` and `context` as props. It uses TanStack Query's `useMutation` to call the API and Sonner's `toast` for feedback.

```tsx
// examples/plugins/generate-alt/index.tsx

import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { ModalShell } from '...';   // core UI shell (not part of the public API)
import { Button } from '...';       // core Button component (not part of the public API)
import { getPluginModalId } from '@adeliom/easy-media-manager/plugin-sdk';
import { generateAltClient } from './api';
import type { EasyMediaPlugin, EasyMediaPluginModalProps } from '@adeliom/easy-media-manager/plugin-sdk';
import { isMediaFile } from '@adeliom/easy-media-manager';

function GenerateAltPluginModal({ close, context }: EasyMediaPluginModalProps) {
  const { routes, selectedFile, bulkList, t } = context;

  const mutation = useMutation({
    mutationFn: async (scope: 'single' | 'group' | 'all') => {
      if (!routes) throw new Error(t('routes_unavailable'));

      if (scope === 'single') {
        if (!routes.generateAlt || selectedFile === null)
          throw new Error(t('plugins.generate_alt.single_unavailable'));

        return generateAltClient.generateAlt(routes.generateAlt, {
          file: { id: selectedFile.id },
          path: selectedFile.path,
        });
      }

      if (scope === 'group') {
        if (!routes.generateAltGroup)
          throw new Error(t('plugins.generate_alt.group_unavailable'));

        return generateAltClient.generateAltGroup(routes.generateAltGroup, {
          files: bulkList.map((item) => item.id),
        });
      }

      // scope === 'all'
      if (!routes.generateAllAlt)
        throw new Error(t('plugins.generate_alt.all_unavailable'));

      return generateAltClient.generateAllAlt(routes.generateAllAlt);
    },
    onSuccess: () => toast.success(t('plugins.generate_alt.started')),
    onError: (error) => toast.error(error.message),
  });

  return (
    <ModalShell onClose={close} open title={t('plugins.generate_alt.title')}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={selectedFile === null || mutation.isPending}
            onClick={() => mutation.mutate('single')}
            variant="secondary"
          >
            {t('plugins.generate_alt.selected_file')}
          </Button>
          <Button
            disabled={bulkList.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate('group')}
            variant="secondary"
          >
            {t('plugins.generate_alt.group')}
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('all')}
            variant="primary"
          >
            {t('plugins.generate_alt.all')}
          </Button>
        </div>

        {/* Raw API response for debugging */}
        {mutation.data && (
          <pre className="overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs">
            {JSON.stringify(mutation.data, null, 2)}
          </pre>
        )}

        {mutation.error && (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        )}
      </div>
    </ModalShell>
  );
}
```

Key points:

- **`context.routes`** provides the backend URLs configured at init time — the plugin never hard-codes paths.
- **`context.t(key)`** returns the translated string — the plugin never hard-codes UI copy.
- **`context.selectedFile`** and **`context.bulkList`** reflect the live manager state at the moment the modal was opened.
- The mutation dispatches to a different route depending on the scope, so one modal handles three operations cleanly.

### 4. Assemble the plugin object

```typescript
export const generateAltPlugin: EasyMediaPlugin = {
  id: GENERATE_ALT_PLUGIN_ID,

  // Locale-keyed translations — the library picks the right locale automatically
  // based on the `locale` field passed to EasyMedia.init(). Falls back to 'en'.
  translations: {
    en: {
      'plugins.generate_alt.title':              'Generate alt',
      'plugins.generate_alt.action':             'Generate alt',
      'plugins.generate_alt.selected_file':      'Generate alt for selected file',
      'plugins.generate_alt.group':              'Generate alt for selection',
      'plugins.generate_alt.all':                'Generate alt for all files',
      'plugins.generate_alt.started':            'Alt generation started',
      'plugins.generate_alt.single_unavailable': 'Single-file alt generation is unavailable.',
      'plugins.generate_alt.group_unavailable':  'Bulk alt generation is unavailable.',
      'plugins.generate_alt.all_unavailable':    'Global alt generation is unavailable.',
    },
    fr: {
      'plugins.generate_alt.title':              "Générer l'alt",
      'plugins.generate_alt.action':             "Générer l'alt",
      'plugins.generate_alt.selected_file':      "Générer l'alt pour le fichier sélectionné",
      'plugins.generate_alt.group':              "Générer l'alt pour la sélection",
      'plugins.generate_alt.all':                "Générer l'alt pour tous les fichiers",
      'plugins.generate_alt.started':            'Génération des alts démarrée',
      'plugins.generate_alt.single_unavailable': "La génération d'alt pour un seul fichier n'est pas disponible.",
      'plugins.generate_alt.group_unavailable':  "La génération d'alt en masse n'est pas disponible.",
      'plugins.generate_alt.all_unavailable':    "La génération globale d'alt n'est pas disponible.",
    },
  },

  toolbarActions: [
    {
      id: 'open-modal',
      pluginId: GENERATE_ALT_PLUGIN_ID,
      icon: Sparkles,
      labelKey: 'plugins.generate_alt.action',
      section: 'selection',

      // Only show the button when alt generation is enabled AND a non-folder file is selected
      isVisible(context) {
        return Boolean(
          context.features.enableGeneratingAlts
          && context.selectedFile
          && isMediaFile(context.selectedFile),
        );
      },

      // Open the modal using the canonical plugin modal ID
      onClick(context) {
        context.runtime.openModal(
          getPluginModalId(GENERATE_ALT_PLUGIN_ID, GENERATE_ALT_MODAL_ID),
        );
      },
    },
  ],

  modals: [
    {
      id: GENERATE_ALT_MODAL_ID,         // 'main' → resolved as 'plugin:generate-alt:main'
      pluginId: GENERATE_ALT_PLUGIN_ID,
      component: GenerateAltPluginModal,
    },
  ],
};
```

---

## Modal ID format

Internally, modal IDs follow the pattern:

```
plugin:<pluginId>:<modalId>
```

Use `getPluginModalId(pluginId, modalId)` from the plugin SDK to build this string safely:

```typescript
import { getPluginModalId } from '@adeliom/easy-media-manager/plugin-sdk';

getPluginModalId('generate-alt', 'main')
// → 'plugin:generate-alt:main'
```

Always use this helper in `onClick` when opening a modal — never construct the string by hand.

---

## Registering plugins

### Before `EasyMedia.init()` (recommended)

Use `registerEasyMediaPlugin()`. It is queue-safe: if init has not run yet the plugin is pushed onto `window.EasyMediaPlugins`; if `EasyMedia` is already on the window it calls `EasyMedia.use()` directly.

```typescript
// ESM — register before init
import { generateAltPlugin } from './generate-alt';
import { EasyMedia } from '@adeliom/easy-media-manager';

EasyMedia.use(generateAltPlugin);
EasyMedia.mount({ ... });

// IIFE — GenerateAltPlugin is exposed on window by the bundle
EasyMedia.use(GenerateAltPlugin);
EasyMedia.mount({ ... });
```

Or, for plain scripts without module bundlers, push to the queue manually:

```javascript
window.EasyMediaPlugins ??= [];
window.EasyMediaPlugins.push(myPlugin);
// EasyMedia.mount(...) will drain this queue at init time
```

### After `EasyMedia.init()`

Not supported — the registry is locked after initialization. Attempting to register a plugin after init throws an error.

---

## Ordering plugins and actions

Both plugins and toolbar actions accept an optional `order` number. Lower values appear first. When two items share the same `order`, they are sorted alphabetically by `id` / `pluginId`.

```typescript
const myPlugin: EasyMediaPlugin = {
  id: 'my-plugin',
  order: 10,           // loads before plugins with order > 10 or no order (defaults to 100)
  toolbarActions: [
    {
      id: 'first-action',
      order: 5,          // appears before actions with order > 5
      // ...
    },
  ],
};
```

---

## Plugin translations and locale

Plugins define their translations as a locale-keyed object. The library automatically picks the right locale based on the `locale` field passed to `EasyMedia.init()` (defaults to `'en'`, falls back to `'en'` if the requested locale is not defined by the plugin):

```typescript
EasyMedia.init({
  locale: 'fr',
  translations: frTranslations,
  // ...
});
```

No manual spreading of plugin translation objects is needed — the library resolves them automatically.

### Overriding plugin translations

Plugin translations are merged at a lower priority than `EasyMediaInitConfig.translations`. To override a specific key, include it in the `translations` object:

```typescript
EasyMedia.init({
  locale: 'en',
  translations: {
    ...enTranslations,
    'plugins.generate_alt.action': 'Auto-generate ALT text',
    'plugins.generate_alt.started': 'Generation queued — check back shortly.',
  },
  // ...
});
```
