// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://antonio-vigilante.github.io',
  base: '/dererumnatura/',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
