import type { EasyMediaTheme, EasyMediaThemeShade } from "@/types/config";

// How each shade of a scale is derived from its base color (shade 500): mixed with white for the
// lighter shades, with black for the darker ones. In dark mode the scale is reversed (`50` gets the
// mix of `950`), like the default dark palette in main.css.
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

/** The `--emm-*` custom properties of a theme, for the color scheme being rendered. */
export function themeProperties(theme: EasyMediaTheme | undefined, scheme: "light" | "dark"): Record<string, string> {
  const properties: Record<string, string> = {};
  if (!theme) {
    return properties;
  }

  for (const scale of ["neutral", "accent", "danger"] as const) {
    const base = theme[scale];
    if (!base) {
      continue;
    }

    SHADES.forEach(([shade], index) => {
      const [, mix, percent] = scheme === "dark" ? SHADES[SHADES.length - 1 - index] : SHADES[index];
      properties[`--emm-${scale}-${shade}`] = mix ? `color-mix(in oklab, ${base} ${percent}%, ${mix})` : base;
    });
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
