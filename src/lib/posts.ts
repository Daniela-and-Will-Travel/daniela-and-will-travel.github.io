import { getCollection, type CollectionEntry } from 'astro:content';

import { DEFAULT_LANG, isLang, locales, type Lang } from '@data/locales';
import { slugify, tagLabel } from './format';

export type Post = CollectionEntry<'posts'>;

/**
 * Tags Eleventy used for structure rather than subject matter. They were mixed
 * into the same `tags` array as the editorial ones, so anything rendering a tag
 * pill or building an archive has to filter them out.
 */
const STRUCTURAL_TAGS = new Set(['posts', 'page', 'home', 'all']);

/** Entry ids look like `en/asia/one-week-japan-itinerary`. */
function langOf(post: Post): Lang {
    const [first] = post.id.split('/');
    return isLang(first) ? first : DEFAULT_LANG;
}

/**
 * The URL slug: the filename, unless the front matter overrides it. Directory
 * nesting under the language (asia/, europe/, tools/) is organisational and
 * never appears in the URL — same as the old permalink function.
 */
function slugOf(post: Post): string {
    if (post.data.seo?.slug) return slugify(post.data.seo.slug);
    const segments = post.id.split('/');
    return slugify(segments[segments.length - 1]);
}

export function postUrl(post: Post): string {
    const lang = langOf(post);
    return `/${lang}/${locales[lang].postSegment}/${slugOf(post)}/`;
}

export function postLang(post: Post): Lang {
    return langOf(post);
}

export function editorialTags(post: Post): string[] {
    return (post.data.tags ?? []).filter((tag) => !STRUCTURAL_TAGS.has(tag));
}

/**
 * Every published post in a language, newest first.
 *
 * Drafts are included by `astro dev` and excluded from `astro build`, matching
 * the behaviour of the old drafts plugin.
 */
export async function getPosts(lang?: Lang): Promise<Post[]> {
    const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);

    return posts
        .filter((post) => (lang ? langOf(post) === lang : true))
        .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Posts carrying a given tag, newest first. */
export async function getPostsByTag(tag: string, lang: Lang): Promise<Post[]> {
    const posts = await getPosts(lang);
    return posts.filter((post) => editorialTags(post).includes(tag));
}

export interface TagEntry {
    tag: string;
    label: string;
    slug: string;
    lang: Lang;
    posts: Post[];
}

/**
 * One entry per (language, editorial tag) pair, newest post first.
 *
 * This drives the archives at /<lang>/tag/<tag>/ that every post's tag pills
 * link to. The equivalent Eleventy collection was lost in a bad merge, which
 * left those links 404ing on the live site.
 */
export async function getTagIndex(lang?: Lang): Promise<TagEntry[]> {
    const posts = await getPosts(lang);
    const entries = new Map<string, TagEntry>();

    for (const post of posts) {
        const postLanguage = langOf(post);
        for (const tag of editorialTags(post)) {
            const key = `${postLanguage}::${tag}`;
            if (!entries.has(key)) {
                entries.set(key, {
                    tag,
                    label: tagLabel(tag),
                    slug: slugify(tag),
                    lang: postLanguage,
                    posts: []
                });
            }
            entries.get(key)!.posts.push(post);
        }
    }

    return [...entries.values()].sort(
        (a, b) => a.lang.localeCompare(b.lang) || a.tag.localeCompare(b.tag)
    );
}

/**
 * A tag archive earns its place in the index by collecting posts. Below this
 * many it is a near-duplicate of the one post it lists, and the two compete
 * with each other for the same query.
 */
export const MIN_INDEXABLE_TAG_POSTS = 3;

/** Whether a tag archive is too thin to be worth indexing on its own. */
export function isThinTag(entry: TagEntry): boolean {
    return entry.posts.length < MIN_INDEXABLE_TAG_POSTS;
}

/**
 * The related-posts strip for every post in a language, keyed by post id.
 *
 * Built in one pass for the whole language rather than per page, because the
 * two things it has to balance pull against each other and only the second is
 * visible from a single post:
 *
 *  1. Relevance. Candidates are ranked by how many editorial tags they share
 *     with the post being rendered.
 *  2. Coverage. This module is the site's main source of internal links, and
 *     internal links are its own vote for what each page is about. It used to
 *     recommend "the newest three posts that aren't this one", so the three most
 *     recent articles collected every link on the site and the rest were
 *     reachable only from the country index. Ranking by tags alone fixes the
 *     topic mismatch but still strands whichever posts sit on unpopular tags.
 *
 * So among candidates tied on shared tags, the one recommended least often so
 * far wins. `getPosts` is newest-first and `Array.prototype.sort` is stable, so
 * recency remains the final tie-break.
 */
export async function getRelatedIndex(lang: Lang, count = 3): Promise<Map<string, Post[]>> {
    const posts = await getPosts(lang);
    const tagsOf = new Map(posts.map((post) => [post.id, new Set(editorialTags(post))]));
    const timesRecommended = new Map(posts.map((post) => [post.id, 0]));
    const index = new Map<string, Post[]>();

    for (const post of posts) {
        const mine = tagsOf.get(post.id)!;
        const candidates = posts
            .filter((candidate) => candidate.id !== post.id)
            .map((candidate) => ({
                post: candidate,
                shared: [...tagsOf.get(candidate.id)!].filter((tag) => mine.has(tag)).length
            }));

        const picks: Post[] = [];
        const taken = new Set<string>();

        while (picks.length < count && taken.size < candidates.length) {
            const [best] = candidates
                .filter((candidate) => !taken.has(candidate.post.id))
                .sort(
                    (a, b) =>
                        b.shared - a.shared ||
                        timesRecommended.get(a.post.id)! - timesRecommended.get(b.post.id)!
                );

            if (!best) break;

            picks.push(best.post);
            taken.add(best.post.id);
            timesRecommended.set(best.post.id, timesRecommended.get(best.post.id)! + 1);
        }

        index.set(post.id, picks);
    }

    return index;
}
