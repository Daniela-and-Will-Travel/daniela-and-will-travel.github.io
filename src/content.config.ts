import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// `z` re-exported from astro:content is deprecated; astro/zod is the supported
// entry point and is the one that carries usable type-level helpers.
import { z } from 'astro/zod';

/**
 * The card grids on the home page, the countries page and the related-posts
 * strip all read `byline`, `heroImage` and `heroImageAlt`. The README has always
 * said not to ship a post without them; making them required here turns that
 * from a convention into a build failure.
 */
const seo = z
    .object({
        title: z.string().optional(),
        description: z.string().optional(),
        /** Overrides the filename when building the URL. */
        slug: z.string().optional(),
        excludeFromSitemap: z.boolean().default(false),
        noIndex: z.boolean().default(false)
    })
    // Optional as a whole: a post with no `seo:` block is fine, and every read
    // site-side goes through `post.data.seo?.…`.
    .optional();

const posts = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/posts'
    }),
    schema: z.object({
        title: z.string(),
        date: z.date(),
        modified: z.date().optional(),
        author: z.string().optional(),
        tags: z.array(z.string()).min(1),
        draft: z.boolean().default(false),
        byline: z.string(),
        heroImage: z.string(),
        heroImageAlt: z.string(),
        /** Overrides heroImage for social cards. */
        thumbnail: z.string().optional(),
        thumbnailDescription: z.string().optional(),
        seo
    })
        // `modified` is an editorial claim that the post was revised, and it is
        // the only thing feeding JSON-LD `dateModified` and sitemap `lastmod`.
        // Deriving it from the filesystem instead was considered and rejected:
        // `actions/checkout` stamps every file with the clone time, and a git
        // last-commit date moves for build-only commits too — both would report
        // a refresh that never happened. Omit it until the content really changes.
        .refine((data) => !data.modified || data.modified >= data.date, {
            message: 'modified is earlier than date — a post cannot be revised before it was published',
            path: ['modified']
        })
});

// Editorial pages (about, tools, the legal set) are .astro files under
// src/pages rather than collection entries. Each exports a `meta` object that
// src/pages/sitemap.xml.ts reads back via import.meta.glob.

export const collections = { posts };
