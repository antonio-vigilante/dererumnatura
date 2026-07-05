// @ts-check
import { defineConfig } from 'astro/config';

const base = '/dererumnatura/';

/**
 * I link interni scritti nel markdown (es. `[Giancotti 1950](/bibliografia#giancotti1950)`)
 * sono radice-relativi e ignorano il base path del sito su GitHub Pages: questo plugin
 * li corregge a livello di build senza dover riscrivere ogni link a mano.
 */
function correggiLinkBase() {
  return (tree) => {
    function visita(nodo) {
      if (nodo.type === 'element' && nodo.tagName === 'a' && typeof nodo.properties?.href === 'string') {
        const href = nodo.properties.href;
        if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith(base)) {
          nodo.properties.href = base + href.slice(1);
        }
      }
      nodo.children?.forEach(visita);
    }
    visita(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://antonio-vigilante.github.io',
  base,
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
    rehypePlugins: [correggiLinkBase],
  },
});
