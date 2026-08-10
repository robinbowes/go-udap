# site

This is a Next.js application generated with
[Create Fumadocs](https://github.com/fuma-nama/fumadocs).

It is a Next.js app with [Static Export](https://nextjs.org/docs/app/guides/static-exports) configured.

Run development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## Type checking

```bash
pnpm types:check
```

The step order in that script matters and is not cosmetic. `next typegen`
loads `next.config.mjs`, which applies `createMDX()`, and the plugin
truncates `.source/*.ts` before rewriting them — asynchronously, so the
files can still be empty when the process exits. Anything that reads them
afterwards then fails with `File '.source/server.ts' is not a module`,
intermittently. Running `fumadocs-mdx` *after* `next typegen` regenerates
them, so `tsc` always sees complete files. Do not reorder these.

`next build` is unaffected: it drives the same plugin in-process and waits
for generation, which is why CI stayed green while `pnpm types:check` did
not.

## Explore

In the project, you can see:

- `lib/source.ts`: Code for content source adapter, [`loader()`](https://fumadocs.dev/docs/headless/source-api) provides the interface to access your content.
- `lib/layout.shared.tsx`: Shared options for layouts, optional but preferred to keep.

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | The route group for your landing page and other pages. |
| `app/docs`                | The documentation layout and pages.                    |
| `app/api/search/route.ts` | The Route Handler for search.                          |

### Fumadocs MDX

A `source.config.ts` config file has been included, you can customise different options like frontmatter schema.

Read the [Introduction](https://fumadocs.dev/docs/mdx) for further details.

## Learn More

To learn more about Next.js and Fumadocs, take a look at the following
resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Fumadocs](https://fumadocs.dev) - learn about Fumadocs
