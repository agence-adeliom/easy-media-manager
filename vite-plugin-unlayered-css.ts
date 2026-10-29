import postcss, { type AtRule } from 'postcss';
import type { Plugin } from 'vite';

/**
 * Emits, next to every CSS asset, a copy without cascade layers: `style.css` → `style.unlayered.css`.
 *
 * Tailwind puts every rule in `@layer theme | base | components | utilities`. A host stylesheet
 * outside any layer (Bootstrap, Tabler…) then beats the library whatever its specificity. The
 * unlayered copy unwraps the layer blocks in place, keeping the same rules in the same order, so
 * the library rules compete on specificity again (`.easy-media .grid` beats `.grid`).
 */
export function unlayeredCss(): Plugin {
  return {
    name: 'easy-media:unlayered-css',
    enforce: 'post',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (asset.type !== 'asset' || !asset.fileName.endsWith('.css')) {
          continue;
        }

        this.emitFile({
          type: 'asset',
          fileName: asset.fileName.replace(/\.css$/, '.unlayered.css'),
          source: removeLayers(String(asset.source)),
        });
      }
    },
  };
}

export function removeLayers(css: string): string {
  const root = postcss.parse(css);
  let layer: AtRule | undefined;

  // Unwrap from the outermost layer inwards: the children moved up are visited again.
  while ((layer = findLayer(root))) {
    if (layer.nodes) {
      layer.replaceWith(layer.nodes);
    } else {
      // Order statement such as `@layer theme, base, components, utilities;`.
      layer.remove();
    }
  }

  return root.toString();
}

function findLayer(root: postcss.Root): AtRule | undefined {
  let found: AtRule | undefined;
  root.walkAtRules('layer', (atRule) => {
    found = atRule;
    return false;
  });

  return found;
}
