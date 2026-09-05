// The sitemap carries <loc> and <lastmod> only.
//
// Google ignores <priority> and <changefreq>, and this site demonstrated why
// they are worth dropping rather than tuning: every page declared priority 1.0,
// including the privacy policy, which makes a relative signal say nothing at
// all. <lastmod> is the one hint that is actually read, so it is now emitted
// for every URL instead of only for posts and archives.
import type { APIRoute } from 'astro';

import { settings } from '@data/settings.js';
import { absoluteUrl } from '@lib/i18n';
import { toRfc3339 } from '@lib/format';
import { getPosts, getTagIndex, isThinTag, postUrl } from '@lib/posts';

interface PageMetaExport {
    /** ISO date this page's content last actually changed. */
    lastModified?: string;
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
            // Declared per page rather than derived. An .astro file has no
            // content date of its own, and the two automatic sources both lie:
            // the build time claims every page changed on every deploy, and
            // `actions/checkout` stamps the whole tree with the clone time.
            lastmod: meta?.lastModified
        });
    }

    // --- posts --------------------------------------------------------------
    for (const post of posts) {
        if (post.data.seo?.excludeFromSitemap || post.data.seo?.noIndex) continue;

        entries.push({
            loc: absoluteUrl(postUrl(post), settings.url),
            lastmod: toRfc3339(post.data.modified ?? post.data.date)
        });
    }

    // --- tag archives -------------------------------------------------------
    for (const entry of tagIndex) {
        // Thin archives are noindexed by the tag template; submitting a URL we
        // ask Google not to index is a contradiction it reports back as an
        // error, so they are left out here too.
        if (isThinTag(entry)) continue;

        const newest = entry.posts[0];
        entries.push({
            loc: absoluteUrl(`/${entry.lang}/tag/${entry.slug}/`, settings.url),
            // An archive is as fresh as the newest thing it lists.
            lastmod: newest ? toRfc3339(newest.data.modified ?? newest.data.date) : undefined
        });
    }

    const body = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
    .map(
        (entry) => `	<url>
		<loc>${entry.loc}</loc>${entry.lastmod ? `\n\t\t<lastmod>${entry.lastmod}</lastmod>` : ''}
	</url>`
    )
    .join('\n')}
</urlset>
`;

    return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
