# Daniela and Will Travel Blog

Welcome to the Daniela and Will Travel Blog repository! This project contains the
source code for our travel blog, where we share our travel experiences, tips, and
guides.

Built with [Astro](https://astro.build/) and deployed to GitHub Pages.

## Project Structure

```
public/                     Served verbatim at the site root
  assets/files/             Downloadable budget + planning spreadsheets
  assets/fonts/             Self-hosted webfonts
  assets/img/               App icons and the default Open Graph image
  favicon.ico
src/
  assets/img/               Photography — optimized at build time by astro:assets
  components/               Reusable markup (Figure, Card, Navigation, Footer, …)
    styleguide/             Story + Swatch, used only by /styleguide/
  content/posts/<lang>/     Blog posts as .mdx, organised by region
  data/                     Settings, locales, navigation, translations
  layouts/                  Base, Page, Post
  lib/                      Dates, reading time, tags, i18n, image resolution
  pages/                    Routes (see below)
  plugins/                  Markdown pipeline extensions
  scripts/                  The site's client-side JavaScript
  styles/                   The CSS design system
  content.config.ts         Content collection schemas
```

### Routing

| Route | Source |
| --- | --- |
| `/` | `src/pages/index.astro` |
| `/en/<page>/` | `src/pages/en/<page>.astro` |
| `/en/writing/<slug>/` | `src/content/posts/en/**/<slug>.mdx` via `src/pages/[...slug].astro` |
| `/<lang>/tag/<tag>/` | `src/pages/[lang]/tag/[tag].astro`, generated from post tags |
| `/<lang>/feed/feed.xml`, `.json`, `.xsl` | `src/pages/[lang]/feed/` |
| `/sitemap.xml`, `/robots.txt`, `/humans.txt` | `src/pages/*.ts` |

Directory nesting under a language (`asia/`, `europe/`, `tools/`) is
organisational only — it never appears in the URL.

## Getting Started

1. **Clone the repository**

    ```sh
    git clone https://github.com/daniela-and-will-travel/daniela-and-will-travel.github.io.git
    cd daniela-and-will-travel.github.io
    ```

2. **Install dependencies** — requires [Node.js](https://nodejs.org/) 22 or newer.

    ```sh
    npm install
    ```

3. **Run the development server** at <http://localhost:4321>.

    ```sh
    npm run dev
    ```

4. **Build the production site** into `dist/`.

    ```sh
    npm run build
    ```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. **Draft posts are visible here.** |
| `npm run build` | Production build. Drafts are excluded. |
| `npm run preview` | Serve the built `dist/` locally. |
| `npm run check` | Type-check components and validate every post against the schema. |
| `npm test` | Run the regression tests against `dist/`. Build first. |
| `npm run clean` | Remove `dist/` and the build caches. |

`npm test` runs against the built output rather than the source, because what it
guards only exists after a build. See `tests/theme-persistence.test.mjs`: Astro's
ClientRouter strips every attribute off `<html>` on a soft navigation, which
destroys the `data-theme` the theme script sets at runtime. The repaint that
fixes it lives in `src/scripts/site.ts` and is invisible to both the type check
and the build, so it needs a test.

The first build re-encodes every photograph and takes a few minutes. Later
builds reuse the cache in `node_modules/.astro` and take seconds; CI restores
that cache between runs.

## Writing Content

Posts are `.mdx` files under `src/content/posts/<lang>/`. Front matter is
validated by the schema in `src/content.config.ts`, so a missing or misspelled
key **fails the build** rather than quietly producing a broken card.

```mdx
---
title: One Week Japan Itinerary
date: 2025-03-10
modified: 2025-03-10
author: Daniela
tags:
 - asia
 - southeast-asia
 - japan
 - itinerary
 - planning
draft: false
byline: How to visit Japan on a bougie backpacker budget!
heroImage: /assets/img/posts/asia/IMG_0495.jpg
heroImageAlt: A street scene in Japan
seo:
  title: One Week Japan Itinerary
  description: How to visit Japan on a bougie backpacker budget!
  changeFrequency: monthly
---
```

`title`, `date`, `tags`, `byline`, `heroImage` and `heroImageAlt` are required —
the last three are what make a post look right in the card grids on the home
page, the countries page and the related-posts strip. `seo` is optional; set
`seo.slug` to override the URL slug, which otherwise comes from the filename.

Every tag becomes an archive page at `/<lang>/tag/<tag>/` automatically. Add a
display override to `TAG_LABEL_OVERRIDES` in `src/lib/format.ts` for any tag
that doesn't survive plain title casing (`vpn` → `VPN`).

### Images

Put photographs in `src/assets/img/` and reference them by their published path:

```mdx
import Figure from '@components/Figure.astro';

<Figure
    src="/assets/img/posts/asia/komodocover.jpg"
    alt="Aerial shot of islands surrounded by beaches and blue water"
    sizes="100vw"
    caption="Beautiful aerial shot of the Komodo Islands"
/>
```

`Figure` generates AVIF, WebP and original-format variants at several widths.
**Passing a `caption` also renders the Shutterstock photo credit chip** — it is
an affiliate placement, so don't skip the caption on our own photographs.

Files in `public/` are copied as-is and are *not* optimized; that folder is for
icons, fonts and downloads only.

### Callouts

Two blockquote markers become styled notice boxes:

```markdown
> ❕ Tip: Arrive at least one day before with enough time to get sorted.

> ⚠ Warning: The park entry fee is not always included in the tour price.
```

`Note` and `Tip` render as an info box, `Warning` as a warning box. The
transform lives in `src/plugins/notices.js`.

## Design system

The blog runs on a token-driven CSS design system — no framework, no utility
classes. Everything visual resolves back to a custom property, so dark mode and
future tweaks stay cheap.

- `src/styles/variables.css` — design tokens: brand palette, semantic colours,
  type scale, spacing, radii, shadows, motion. **Add new values here rather than
  hard-coding them in a component.**
- `src/styles/reset.css` — modern reset.
- `src/styles/styles.css` — element defaults, layout shells (`.shell`,
  `.section`, `.grid`) and shared utilities.
- `src/styles/components/*.css` — one file per component.
- `src/styles/main.css` — imports the above. New component files must be added
  here.

### Style guide

A living style guide is published at
**[`/styleguide/`](https://danielaandwilltravel.ca/styleguide/)**
(`src/pages/styleguide.astro`). Every example on that page is rendered with the
real stylesheet and shown next to the markup that produced it, so it never
drifts from the site.

Check it before building a new page, and add a story when you add a component:

```astro
const myMarkup = `
<a class="button" href="#">Browse destinations</a>
`;

<Story label="Label" markup={myMarkup} note="optional note" />
```

The same string is rendered live and printed as source.

## Localisation

The site is built bilingual (English and Spanish). Interface strings live in
`src/data/translations.ts` — never hard-code UI text in a component. A lookup
that misses throws during the build, so the two language trees can't silently
drift apart.

Spanish currently has no content. The machinery is in place: add
`src/pages/es/<page>.astro` or `src/content/posts/es/<slug>.mdx` and the
language switcher, `hreflang` tags, feeds and manifest pick it up automatically.

## Deployment

Pushing to `main` triggers `.github/workflows/static.yml`, which type-checks,
builds and deploys to GitHub Pages. Pull requests are built but not deployed.

## Contributing

We welcome contributions! If you find a bug or have a suggestion, please open an
issue or submit a pull request.

## License

The code in this project is licensed under the GNU General Public License v3.
See the `LICENSE` file for details. The copyright of the text on the blog is that
of the respective author.

## Contact

Questions or suggestions relating to development of the travel blog can be
brought up through an open issue. All other inquiries, including licensing and
partnership inquiries, should be handled through the contact form on the blog
itself.
