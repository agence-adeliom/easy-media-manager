import type { EasyMediaTheme, EasyMediaThemeShade } from "@/types/config";

// How each shade of a scale is derived from its base color (shade 500): mixed with white for the
// lighter shades, with black for the darker ones.
const SHADES: [EasyMediaThemeShade, "white" | "black" | null, number][] = [
  [50, "white", 8],
  [100, "white", 15],
  [200, "white", 30],
  [300, "white", 50],
  [400, "white", 75],
  [500, null, 100],
  [600, "black", 90],
  [700, "black", 75],
  [800, "black", 60],
  [900, "black", 45],
  [950, "black", 30],
];

/** The `--emm-*` custom properties of a theme. */
export function themeProperties(theme: EasyMediaTheme | undefined): Record<string, string> {
  const properties: Record<string, string> = {};
  if (!theme) {
    return properties;
  }

  for (const scale of ["neutral", "accent", "danger"] as const) {
    const base = theme[scale];
    if (!base) {
      continue;
    }

    for (const [shade, mix, percent] of SHADES) {
      properties[`--emm-${scale}-${shade}`] = mix ? `color-mix(in oklab, ${base} ${percent}%, ${mix})` : base;
    }
  }

  if (theme.font) {
    properties["--emm-font"] = theme.font;
  }

  for (const [token, value] of Object.entries(theme.tokens ?? {})) {
    if (value) {
      properties[`--emm-${token}`] = value;
    }
  }

  return properties;
}

/** Sets the theme on the root of the manager, where every part of it (portals included) inherits it. */
export function applyTheme(element: HTMLElement, theme: EasyMediaTheme | undefined): void {
  for (const [property, value] of Object.entries(themeProperties(theme))) {
    element.style.setProperty(property, value);
  }
}
