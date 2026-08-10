// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';

import { noticesPlugin } from './src/plugins/notices.js';
import { SITE_URL } from './src/data/settings.js';

export default defineConfig({
    site: SITE_URL,

    // Every URL on this site has always ended in a slash. Keeping that explicit
    // means internal links, feeds and the sitemap all agree with what the old
    // Eleventy build published, so nothing 301s or duplicates after the switch.
    trailingSlash: 'always',
    build: { format: 'directory' },

    // Astro 7 defaults to 'jsx', which strips whitespace between inline elements
    // using JSX rules — that eats the space in prose like `<em>x</em> <strong>y</strong>`.
    // `true` is the HTML-aware collapse, matching what html-minifier-terser did before.
    compressHTML: true,

    // `/en/` and `/es/` were hand-written meta-refresh stubs; Astro emits the same
    // kind of redirect page but adds the canonical link and keeps them out of the
    // route list we generate the sitemap from.
    redirects: {
        '/en/': '/',
        '/es/': '/'
    },

    markdown: {
        // Sätteri is Astro 7's default pipeline. `smartPunctuation` replaces
        // markdown-it's `typographer` and GFM autolink literals replace `linkify`,
        // so posts keep the punctuation and bare-URL behaviour they were written for.
        processor: satteri({
            features: {
                gfm: true,
                smartPunctuation: true
            },
            hastPlugins: [noticesPlugin]
        }),
        syntaxHighlight: 'shiki',
        shikiConfig: {
            themes: { light: 'github-light', dark: 'nord' },
            wrap: true
        }
    },

    image: {
        // Matches the widths the eleventy-img shortcode generated.
        responsiveStyles: true
    },

    integrations: [mdx()],

    vite: {
        build: {
            // The countries page carries a very large inline SVG map; leave asset
            // inlining off so it can't get folded into a JS chunk.
            assetsInlineLimit: 0
        }
    }
});
