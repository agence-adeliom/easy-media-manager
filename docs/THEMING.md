# Theming

The media manager reads its colors and font from CSS custom properties. Nothing is required:
when none is set, it looks exactly like the default theme (Tailwind `slate`, `sky` and `red`).

---

## Table of Contents

- [Setting a theme](#setting-a-theme)
- [Setting a theme from the configuration](#setting-a-theme-from-the-configuration)
- [Tokens](#tokens)
- [Deriving a scale from one color](#deriving-a-scale-from-one-color)
- [Using the tokens in a plugin](#using-the-tokens-in-a-plugin)
- [Living with the host page's CSS](#living-with-the-host-pages-css)

---

## Setting a theme

Set the `--emm-*` custom properties on `.easy-media`, or on any ancestor such as `:root`, from
your own stylesheet:

```css
.easy-media {
  --emm-accent-600: #4f46e5;
  --emm-accent-700: #4338ca;
  --emm-font: "Inter", system-ui, sans-serif;
}
```

Every token is optional: set only the ones you want to change. The library never declares the
`--emm-*` properties itself, it only reads them with a fallback. A value set on an ancestor
therefore reaches every part of the manager, including the modals and the picker overlay,
which are rendered in a portal. Load order and specificity do not matter.

---

## Setting a theme from the configuration

The same tokens can be set from JavaScript, with the `theme` option of the configuration:

```typescript
EasyMedia.configure({
  config: {
    // ...
    theme: {
      accent: '#4f46e5',                  // the whole accent scale
      font: '"Inter", system-ui, sans-serif',
      tokens: { toolbar: '#1e1b4b', 'accent-700': '#3730a3' },
    },
  },
  // ...
});
```

| Key | Sets |
|-----|------|
| `accent`, `neutral`, `danger` | The eleven shades of the scale from one color, see [Deriving a scale from one color](#deriving-a-scale-from-one-color) |
| `font` | `--emm-font` |
| `tokens` | Any token by name, without the `--emm-` prefix. Applied after the scales, so it can adjust one of their shades |

The library sets these values as inline custom properties on its root elements. They win over
the same tokens set in a stylesheet, and the tokens the configuration leaves out still follow the
stylesheet. The theme is read once, by the first `init()`, `mount()` or `pick()`.

---

## Tokens

### Color scales

Three scales of eleven shades each (`50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`,
`800`, `900`, `950`), from the lightest to the darkest:

| Tokens | Default | Used for |
|--------|---------|----------|
| `--emm-neutral-50` to `--emm-neutral-950` | Tailwind `slate` | Text, borders, secondary backgrounds, primary buttons, tooltips, image editor background |
| `--emm-accent-50` to `--emm-accent-950` | Tailwind `sky` | Selection, active toolbar buttons, active filters, drop zone, links |
| `--emm-danger-50` to `--emm-danger-950` | Tailwind `red` | Errors, delete button |

The shades used the most:

| Token | Role |
|-------|------|
| `--emm-neutral-900` | Main text, primary button |
| `--emm-neutral-500` | Secondary text, icons |
| `--emm-neutral-200` / `--emm-neutral-300` | Borders |
| `--emm-accent-50` / `--emm-accent-100` | Selected item background |
| `--emm-accent-700` | Active toolbar button |
| `--emm-danger-600` | Error text, delete button |

### Single-purpose colors

| Token | Default | Used for |
|-------|---------|----------|
| `--emm-surface` | `#fff` | Panels, cards, inputs, menus, modals |
| `--emm-inverse` | `#fff` | Text and icons on a dark or accent background (buttons, tooltips, drop zone) |
| `--emm-toolbar` | Tailwind `neutral-700` | Top toolbar background |
| `--emm-item` | Tailwind `neutral-50` | File and folder cards |

### Font

| Token | Default |
|-------|---------|
| `--emm-font` | `ui-sans-serif, system-ui, sans-serif` |

---

## Deriving a scale from one color

A scale has eleven shades, but you rarely need to set them all. With `color-mix()`, a whole
scale can follow one brand color. This is what the `accent`, `neutral` and `danger` keys of the
[`theme` option](#setting-a-theme-from-the-configuration) do, with these exact mixes:

```css
.easy-media {
  --brand: #4f46e5;
  --emm-accent-50: color-mix(in oklab, var(--brand) 8%, white);
  --emm-accent-100: color-mix(in oklab, var(--brand) 15%, white);
  --emm-accent-200: color-mix(in oklab, var(--brand) 30%, white);
  --emm-accent-300: color-mix(in oklab, var(--brand) 50%, white);
  --emm-accent-400: color-mix(in oklab, var(--brand) 75%, white);
  --emm-accent-500: var(--brand);
  --emm-accent-600: color-mix(in oklab, var(--brand) 90%, black);
  --emm-accent-700: color-mix(in oklab, var(--brand) 75%, black);
  --emm-accent-800: color-mix(in oklab, var(--brand) 60%, black);
  --emm-accent-900: color-mix(in oklab, var(--brand) 45%, black);
  --emm-accent-950: color-mix(in oklab, var(--brand) 30%, black);
}
```

The tokens can also point to the host design system, for example Tabler in a Sylius admin:

```css
.easy-media {
  --emm-accent-600: var(--tblr-primary);
  --emm-font: var(--tblr-font-sans-serif);
}
```

---

## Using the tokens in a plugin

A plugin's UI is rendered inside `.easy-media`, so it can read the same tokens and follow the
host theme. Always repeat the default as the fallback, since the tokens are usually not set:

```css
.my-plugin-panel {
  color: var(--emm-neutral-900, #0f172b);
  border-color: var(--emm-neutral-200, #e2e8f0);
}
```

---

## Living with the host page's CSS

### Why the host CSS can win

The library ships its CSS in two versions, with the same rules scoped under `.easy-media`:

| Stylesheet | ESM import | IIFE file |
|------------|------------|-----------|
| Layered (default) | `@agence-adeliom/easy-media-manager/style.css` | `dist/iife/easy-media.css` |
| Unlayered | `@agence-adeliom/easy-media-manager/style.unlayered.css` | `dist/iife/easy-media.unlayered.css` |

The default stylesheet is built with Tailwind CSS v4: all of its rules (`base`, `components`,
`utilities`) are inside [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer).
The cascade compares layers **before** specificity and source order: a rule outside any layer
always beats a layered rule, whatever its specificity. The CSS of most host pages (Bootstrap,
Tabler, a CMS admin theme) is not layered, so any of its rules that matches an element of the
manager overrides the library. A few examples:

| Host rule (not layered) | Library rule (layered) | Result |
|-------------------------|------------------------|--------|
| `.grid { grid-template-columns: … }` (Tabler) | `.easy-media .grid-cols-* { grid-template-columns: … }` | The file grid gets Tabler's 12-column layout |
| `p { margin-bottom: 1rem }` (Bootstrap reboot) | `.easy-media .mb-0 { margin-bottom: 0 }` | Paragraphs get an extra margin |

The theme tokens are not affected: they are custom properties read with a fallback, so they
work the same with both stylesheets.

### Choosing the stylesheet

- **Host CSS outside layers** (Bootstrap, Tabler, a CMS admin theme): use the **unlayered**
  stylesheet. It is the same CSS with the layer blocks removed, so the library rules compete on
  specificity again, and their `.easy-media` scope makes them win over the usual host rules:
  `.easy-media .grid` (0,2,0) beats `.grid` (0,1,0) and `p` (0,0,1). Overriding the manager from
  the host CSS then takes a selector at least as specific, scoped under `.easy-media`.

  ```typescript
  import '@agence-adeliom/easy-media-manager/style.unlayered.css';
  ```

- **Host CSS in layers** (Tailwind, or any layered stylesheet): keep the **default** stylesheet.
  The project keeps the upper hand from its own CSS, and can adjust the manager without fighting
  specificity.

### Overriding the manager from the host project

Target a stable hook rather than a Tailwind utility class (`.z-50`), which is not part of the
public contract. For example, to open the modals and the picker above a host navigation bar with
a high `z-index` (a plain stacking issue, with either stylesheet):

```css
.easy-media [data-easy-media-overlay="overlay"] {
  z-index: 2000;
}
```

With the default stylesheet, any host rule outside a layer beats the library, whatever the load
order. With the unlayered one, the override needs a specificity at least equal to the library
rule (`.easy-media [data-easy-media-overlay]` is 0,2,0, like `.easy-media .z-50`) and to be loaded
after it; repeat the scope (`.easy-media.easy-media …`) if the load order is not guaranteed.

### Moving from `revert-layer` workarounds

Before the unlayered stylesheet existed, the conflicts were patched in the host CSS with
`revert-layer`, which ignores the host rule and applies the layered library rule again:

```css
.easy-media .grid {
  gap: revert-layer;
  grid-template-columns: revert-layer;
  grid-template-rows: revert-layer;
}
```

Remove these rules when switching to the unlayered stylesheet: outside a layer, `revert-layer`
behaves like `revert` and falls back to the browser defaults, which breaks the grid.
