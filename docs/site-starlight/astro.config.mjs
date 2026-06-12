import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [
    starlight({
      title: 'go-udap',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/yo61/go-udap' },
      ],
      sidebar: [
        // Populated in Task 2. For now the sidebar is empty.
      ],
    }),
    mdx(),
  ],
});
