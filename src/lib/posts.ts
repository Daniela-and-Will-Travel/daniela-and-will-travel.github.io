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

/** Up to `count` other posts in the same language, newest first. */
export async function getRelatedPosts(post: Post, count = 3): Promise<Post[]> {
    const posts = await getPosts(langOf(post));
    return posts.filter((candidate) => candidate.id !== post.id).slice(0, count);
}
