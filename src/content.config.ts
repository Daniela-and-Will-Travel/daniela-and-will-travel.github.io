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

/**
 * The at-a-glance facts an itinerary is actually searched for.
 *
 * These live in front matter rather than being parsed back out of the prose:
 * the numbers are already stated in the body, but a reader deciding whether to
 * read at all should not have to find them, and a search engine should not have
 * to infer them. Optional, because only itinerary posts have a shape like this.
 */
const trip = z
    .object({
        /** Human-readable, e.g. "9 days". Shown as-is. */
        duration: z.string(),
        bestSeason: z.string().optional(),
        /** What it cost us, phrased for a reader: "$170 CAD per day for two". */
        budget: z.string().optional(),
        /** The route, in order. Feeds both the facts block and ItemList schema. */
        stops: z
            .array(
                z.object({
                    /** e.g. "Days 1-3" — matches the section heading. */
                    days: z.string(),
                    place: z.string()
                })
            )
            .min(2)
            .optional()
    })
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
        /**
         * A whole-trip overview rather than a single destination — the post
         * that answers "what if I have longer than a week?". The related-posts
         * strip pins one of these to every destination post on the same
         * continent, because that is the question a one-week itinerary raises
         * and nothing else on the site answers it.
         */
        overview: z.boolean().default(false),
        trip,
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
