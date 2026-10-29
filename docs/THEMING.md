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

The library's stylesheet is built with Tailwind CSS v4. All of its rules (`base`, `components`,
`utilities`) are inside [cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer),
and scoped under `.easy-media`.

The cascade compares layers **before** specificity and source order: a rule outside any layer
always beats a layered rule, whatever its specificity. The CSS of most host pages (Bootstrap,
Tabler, a CMS admin theme) is not layered, so any of its rules that matches an element of the
manager overrides the library. A few examples:

| Host rule (not layered) | Library rule (layered) | Result |
|-------------------------|------------------------|--------|
| `.grid { grid-template-columns: … }` (Tabler) | `.easy-media .grid-cols-* { grid-template-columns: … }` | The file grid gets Tabler's 12-column layout |
| `p { margin-bottom: 1rem }` (Bootstrap reboot) | `.easy-media .mb-0 { margin-bottom: 0 }` | Paragraphs get an extra margin |

The theme tokens are not affected: they are custom properties read with a fallback, so they
work the same whether the host CSS is layered or not.

### Workarounds in the host project

Until the library ships an unlayered build (see below), fix the conflicts from the host
stylesheet, scoped under `.easy-media`:

- **Give the library's value back** with `revert-layer`, which ignores the host rule and
  applies the layered library rule again:

  ```css
  .easy-media .grid {
    gap: revert-layer;
    grid-template-columns: revert-layer;
    grid-template-rows: revert-layer;
  }
  ```

- **Set a value** through a stable hook rather than a Tailwind utility class (`.z-50`), which is
  not part of the public contract. For example, to open the modals and the picker above a host
  navigation bar with a high `z-index` (this one is a plain stacking issue, not a layer one):

  ```css
  .easy-media [data-easy-media-overlay="overlay"] {
    z-index: 2000;
  }
  ```

Any host rule outside a layer beats the library, so these overrides work whatever the load
order. If the host stylesheet is itself layered, put the overrides outside any layer.

### Planned fix

The library will ship its CSS without cascade layers. Its rules being scoped under
`.easy-media`, a utility such as `.easy-media .grid` (specificity 0,2,0) then beats the usual
host rules: element selectors (`label`) and single classes (`.grid`, `.btn`). The workarounds
above will then have to be removed: outside a layer, `revert-layer` behaves like `revert` and
falls back to the browser defaults.
