import type { APIRoute } from 'astro';

import { settings } from '@data/settings.js';
import { absoluteUrl } from '@lib/i18n';
import { toRfc3339 } from '@lib/format';
import { getPosts, getTagIndex, postUrl } from '@lib/posts';

interface PageMetaExport {
    changeFrequency?: string;
    sitemapPriority?: string;
    excludeFromSitemap?: boolean;
}

/**
 * Page-level sitemap hints, read back from the `meta` export each page file
 * declares. Globbing the real page files means a new page is picked up
 * automatically instead of needing a second list kept in sync by hand.
 */
// Note: the whole module is imported rather than just the `meta` export —
// `{ import: 'meta' }` would generate a named import for every match, and the
// dynamic route files legitimately have no `meta` to export.
const pageModules = import.meta.glob<Record<string, unknown>>('/src/pages/**/*.astro', {
    eager: true
});

interface UrlEntry {
    loc: string;
    lastmod?: string;
    changefreq: string;
    priority: string;
}

/** '/src/pages/en/about.astro' → '/en/about/' */
function routeOf(filePath: string): string {
    const route = filePath.replace('/src/pages', '').replace(/\.astro$/, '');
    if (route === '/index') return '/';
    return `${route.replace(/\/index$/, '')}/`;
}

export const GET: APIRoute = async () => {
    const [posts, tagIndex] = await Promise.all([getPosts(), getTagIndex()]);

    const entries: UrlEntry[] = [];

    // --- static pages, including the home page -----------------------------
    for (const [filePath, module] of Object.entries(pageModules)) {
        // Dynamic routes are enumerated from their own data below.
        if (filePath.includes('[')) continue;

        const meta = module.meta as PageMetaExport | undefined;
        if (meta?.excludeFromSitemap) continue;

        entries.push({
            loc: absoluteUrl(routeOf(filePath), settings.url),
            // No lastmod: an .astro page has no meaningful content date, and
            // emitting the build time would claim every page changed on every
            // deploy.
            changefreq: meta?.changeFrequency ?? settings.seo.defaultChangeFrequency,
            priority: meta?.sitemapPriority ?? settings.seo.defaultPriority
        });
    }

    // --- posts --------------------------------------------------------------
    for (const post of posts) {
        if (post.data.seo?.excludeFromSitemap || post.data.seo?.noIndex) continue;

        entries.push({
            loc: absoluteUrl(postUrl(post), settings.url),
            lastmod: toRfc3339(post.data.modified ?? post.data.date),
            changefreq: post.data.seo?.changeFrequency ?? settings.seo.defaultChangeFrequency,
            priority: post.data.seo?.sitemapPriority ?? settings.seo.defaultPriority
        });
    }

    // --- tag archives -------------------------------------------------------
    for (const entry of tagIndex) {
        const newest = entry.posts[0];
        entries.push({
            loc: absoluteUrl(`/${entry.lang}/tag/${entry.slug}/`, settings.url),
            lastmod: newest ? toRfc3339(newest.data.modified ?? newest.data.date) : undefined,
            changefreq: 'weekly',
            priority: '0.5'
        });
    }

    const body = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (entry) => `	<url>
		<loc>${entry.loc}</loc>${entry.lastmod ? `\n\t\t<lastmod>${entry.lastmod}</lastmod>` : ''}
		<changefreq>${entry.changefreq}</changefreq>
		<priority>${entry.priority}</priority>
	</url>`
    )
    .join('\n')}
</urlset>
`;

    return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
