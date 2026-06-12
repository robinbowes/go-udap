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
        { label: 'Tutorials',     items: [{ autogenerate: { directory: 'tutorials' } }] },
        { label: 'How-to guides', items: [{ autogenerate: { directory: 'how-to' } }] },
        { label: 'Concepts',      items: [{ autogenerate: { directory: 'concepts' } }] },
        { label: 'Reference',     items: [{ autogenerate: { directory: 'reference' } }] },
        { label: 'Contributing',  items: [{ autogenerate: { directory: 'contributing' } }] },
      ],
    }),
    mdx(),
  ],
});
