# Astro Starlight preview for the docs site

**Date:** 2026-06-12
**Status:** Draft — awaiting implementation plan

## Summary

Stand up a side-by-side preview of the documentation site rendered
with [Astro Starlight][starlight] in a new directory
`docs/site-starlight/`, leaving the existing Fumadocs site at
`docs/site/` and its deploy workflow (`.github/workflows/docs.yaml`)
completely untouched. The preview is local-only: it runs via
`pnpm dev` and `pnpm build && pnpm preview` on the developer's
machine and is never deployed.

The goal is a low-stakes aesthetic and feel comparison, not a
feature-parity migration. If the preview wins the comparison, a
follow-up design will plan the full cutover (custom routes, OG
images, GitHub Pages base path, workflow swap). If it does not, the
preview is removed with a single `trash docs/site-starlight/`.

## Motivation

- **Aesthetic curiosity.** The current Fumadocs site works; this is
  not a remediation. The maintainer wants to see whether Starlight's
  native look and feel suits the project better.
- **Reversibility is cheap.** A sibling-directory experiment costs
  one folder and zero risk to the live site, so the bar to try it is
  very low.
- **Different defaults to evaluate.** Starlight assumes vanilla CSS
  (no Tailwind requirement), ships [Pagefind][pagefind] as built-in
  static search, and configures sidebars from filesystem structure +
  explicit ordering. These differ enough from Fumadocs that a
  hands-on comparison is more useful than reading docs.

## References

- [Astro Starlight][starlight] — the framework under evaluation.
- [Pagefind][pagefind] — Starlight's bundled static-site search.
- `docs/superpowers/specs/2026-05-13-docs-site-design.md` — the
  prior spec that introduced the Fumadocs site this preview is
  compared against.
- `docs/site/` — the live Fumadocs site (Next.js 16, React 19,
  Tailwind v4) targeted at GitHub Pages on `/go-udap/`.

[starlight]: https://starlight.astro.build
[pagefind]: https://pagefind.app

## Goals

- A working `docs/site-starlight/` Astro project rendering all 41
  current MDX pages with Starlight's default theme.
- Diataxis-ordered sidebar (Tutorials → How-to guides → Concepts →
  Reference → Contributing).
- Pagefind search working in `pnpm build && pnpm preview` output.
- Zero impact to the live Fumadocs site, its CI workflow, or any
  shared file under `docs/site/`.

## Non-goals

This spec deliberately excludes everything that would only matter if
the preview were promoted to the canonical site. Each item below is
out of scope and will be designed separately if and when the
maintainer chooses to keep Starlight.

- Porting the custom OG image generation
  (`docs/site/app/og/docs/[...slug]/route.tsx`).
- Porting the `llms.txt`, `llms-full.txt`, and per-page `llms.mdx`
  routes.
- `basePath=/go-udap` handling for GitHub Pages.
- Switching `.github/workflows/docs.yaml` to build `site-starlight`.
- Deleting `docs/site/` or merging the two projects.
- Tailwind integration in the Starlight project.
- Public deployment of the preview anywhere (GitHub Pages, branch
  preview, local-only build is the deliverable).
- Feature parity with Fumadocs UI components beyond what is needed
  to render existing content.

## Design

### Architecture and layout

A new sibling project lives at `docs/site-starlight/`:

```
docs/
├── site/                    # existing Fumadocs — unchanged
└── site-starlight/          # new, isolated
    ├── package.json         # astro + @astrojs/starlight + @astrojs/mdx
    ├── astro.config.mjs     # Starlight integration + sidebar config
    ├── tsconfig.json        # extends astro/tsconfigs/strict
    ├── pnpm-lock.yaml
    ├── public/
    │   └── examples/        # copy of docs/site/public/examples/
    └── src/
        ├── content.config.ts    # declares the docs collection
        └── content/
            └── docs/            # copy of docs/site/content/docs/*.mdx
```

The directory is invisible to CI because
`.github/workflows/docs.yaml` is hard-pinned to
`working-directory: docs/site`. The directory is also invisible to
the existing Fumadocs build because the two projects share no files,
no dependencies, and no configuration. Package manager is pnpm to
match the rest of the repo.

### Content and component handling

The MDX content is **copied** from `docs/site/content/docs/` into
`docs/site-starlight/src/content/docs/` once, then three small
edits make the copy render under Starlight:

**1. `index.mdx` — swap Fumadocs components for Starlight equivalents.**
The file imports `Callout`, `Cards`, and `Card` from
`fumadocs-ui/components/...`. Starlight equivalents come from
`@astrojs/starlight/components`:

| Fumadocs                             | Starlight                                 |
|--------------------------------------|-------------------------------------------|
| `<Callout type="info">…</Callout>`   | `<Aside type="note">…</Aside>`            |
| `<Cards>…</Cards>`                   | `<CardGrid>…</CardGrid>`                  |
| `<Card href title description />`    | `<LinkCard href title description />`     |

**2. How-to pages — drop the `<HowTo>` custom component.**
Five how-to pages use a custom `<HowTo>` React component that takes
`goal`, `prerequisites`, `steps`, `verification`, and `exampleFile`
as props (often with JSX children): `configure-for-dhcp.mdx`,
`configure-for-static-ip.mdx`, `configure-wifi-wpa2.mdx`,
`discover-on-multi-nic-laptop.mdx`, and
`recover-stuck-in-init-mode.mdx`. Each is rewritten to plain
markdown with the structure expressed as headings:

```mdx
## Goal
…

## Prerequisites
- …

## Steps
1. …

## Verification
…

## Example config
[file.conf](/examples/file.conf)
```

This is a mechanical one-time pass on five files. No structural
information is lost; if anything the raw form becomes easier to
read and grep.

**3. HTML-in-JSX in how-to props becomes plain markdown.**
`<a href="/examples/...">` and `<code>` inside the existing JSX
collapse to `[…](/…)` and backticks as a side effect of (2).

Frontmatter (`title`, `description`) is identical between the two
frameworks; no edits there. Assets resolve identically because
Starlight serves `public/` at site root just like Next does.

### Sidebar and navigation

Starlight defaults to alphabetical sidebar order, which would
produce `concepts → contributing → how-to → reference → tutorials`
— not useful. The sidebar is configured explicitly in
`astro.config.mjs` to match the Diataxis ordering already baked
into the content:

```js
sidebar: [
  { label: 'Tutorials',     items: [{ autogenerate: { directory: 'tutorials' } }] },
  { label: 'How-to guides', items: [{ autogenerate: { directory: 'how-to' } }] },
  { label: 'Concepts',      items: [{ autogenerate: { directory: 'concepts' } }] },
  { label: 'Reference',     items: [{ autogenerate: { directory: 'reference' } }] },
  { label: 'Contributing',  items: [{ autogenerate: { directory: 'contributing' } }] },
],
```

Per-section page ordering uses Starlight's `sidebar.order: <number>`
frontmatter — needed only on the pages that should pin to the top
(each section's `index.mdx`).

The `reference/commands/` subdirectory (per-subcommand pages such as
`discover`, `get`, `set`) is rendered as a nested group inside the
Reference section; Starlight's `autogenerate` recurses into
subdirectories by default, so no extra configuration is required.

Site title is `go-udap`; the header includes a GitHub icon link to
`https://github.com/yo61/go-udap`. No edit-page links, no version
selector, no i18n.

### Search

Starlight bundles [Pagefind][pagefind] as built-in static search.
No code or configuration is required: it indexes the rendered HTML
at build time and exposes a `Cmd+K` / `Ctrl+K` overlay in the header.

This replaces, conceptually, the ~60 lines of Orama glue in
`docs/site/app/api/search/route.ts` and
`docs/site/components/search.tsx` that the Fumadocs site uses today.
We do not modify or port that code — we simply don't need it in the
Starlight project.

**Pagefind indexes at build, not at dev.** In `pnpm dev` the search
box renders but returns no results. To evaluate search, run
`pnpm build && pnpm preview`. This is documented in the run-and-
verify section below so the maintainer does not mistake the dev-mode
behaviour for a bug.

### Build, run, and verification

Package scripts in `docs/site-starlight/package.json`:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check"
}
```

Two-stage verification runs as part of the implementation, before
handing the preview to the maintainer:

1. **`pnpm dev`** — confirm pages render, sidebar order matches
   the Diataxis sequence above, internal links resolve, and the
   browser console shows no errors on the home page plus one page
   per section.
2. **`pnpm build && pnpm preview`** — confirm a clean production
   build, Pagefind index ships, and the search box returns results
   for representative terms (e.g. `discover`, `static IP`,
   `broadcast`). **This is the form the maintainer evaluates**, and
   the implementation is not considered complete until this stage
   has been run and observed working.

If either stage fails, the implementation is iterated until both
pass; failure is not handed back to the maintainer.

### Revert path

If the maintainer decides against Starlight:

```
trash docs/site-starlight/
```

Nothing else in the repo references the directory.
`.github/workflows/docs.yaml` is pinned to `docs/site`; the
Fumadocs source MDX has not moved; there are no shared
dependencies. One command, no residue.

If the maintainer decides to keep Starlight, a follow-up spec will
cover the full cutover (OG images, `llms.*` routes, base path, CI
workflow swap, removal of `docs/site/`). That work is explicitly
out of scope for this spec.

## Success criteria

The experiment is considered to have "run" when all of the
following hold:

- All 41 MDX pages render without errors in `pnpm dev` and
  `pnpm preview`.
- The sidebar shows the five Diataxis sections in the order
  defined above.
- Pagefind search returns results for `discover`, `static IP`, and
  `broadcast` in `pnpm preview`.
- `docs/site/` is unchanged; `pnpm build` there still succeeds.
- No files have been added, modified, or removed outside
  `docs/site-starlight/`.

## Risks and mitigations

- **`<HowTo>` rewrite is repetitive and error-prone.** Mitigated by
  treating it as a mechanical pass and verifying each rewritten
  page renders before moving on. There are only five pages.
- **Pagefind dev-mode confusion.** Mitigated by the explicit
  verification step that requires `pnpm build && pnpm preview` and
  the note in this spec.
- **Drift between the copied content and the live site during
  evaluation.** Mitigated by the experiment being short-lived. If
  the maintainer takes a long time to evaluate, a content edit on
  `docs/site/` would not propagate to the preview. This is accepted
  rather than mitigated; the alternative (symlinking) was rejected
  earlier because the `<HowTo>` rewrite would otherwise break the
  live site.

## Open questions

None at design time. All decisions made during brainstorming:

- Layout: sibling directory `docs/site-starlight/` (not a branch).
- Content: copy, not symlink.
- Styling: no Tailwind.
- Deployment: local only.
- How-to component: inline as markdown headings.
- Other Fumadocs custom routes: deferred to follow-up.
