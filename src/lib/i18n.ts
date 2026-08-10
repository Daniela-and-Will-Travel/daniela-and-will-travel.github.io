import { DEFAULT_LANG, LANGS, isLang, locales, type Lang } from '../data/locales';
import { translations } from '../data/translations';

/* ---- string lookup ------------------------------------------------------ */

/**
 * Look a UI string up by dot path and fill in any `{{ placeholders }}`.
 *
 *   t('en')('post.by', { author: 'Daniela' })  →  'By Daniela'
 *
 * Replaces the Nunjucks `translate` filter. Missing keys throw at build time
 * rather than rendering an empty string, so a typo can't ship silently.
 */
export function t(lang: Lang) {
    return (path: string, data: Record<string, string | number> = {}): string => {
        const value = path
            .split('.')
            .reduce<unknown>(
                (node, key) =>
                    node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined,
                translations[lang]
            );

        if (typeof value !== 'string') {
            throw new Error(`Missing translation "${path}" for language "${lang}".`);
        }

        return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) =>
            Object.hasOwn(data, key) ? String(data[key]) : ''
        );
    };
}

/* ---- route inventory ---------------------------------------------------- */

// The real list of localized page files, read straight from the filesystem so
// it can never drift from what actually builds. Keys look like
// '/src/pages/en/about.astro'.
const pageModules = import.meta.glob('/src/pages/*/**/*.{astro,md,mdx}');

/**
 * Language-neutral page keys → the languages that page exists in.
 * '/about/' → Set { 'en' }
 */
const pageIndex: Map<string, Set<Lang>> = (() => {
    const index = new Map<string, Set<Lang>>();

    for (const filePath of Object.keys(pageModules)) {
        const relative = filePath.replace('/src/pages/', '').replace(/\.(astro|md|mdx)$/, '');
        const [lang, ...rest] = relative.split('/');
        if (!isLang(lang) || rest.length === 0) continue;

        // `about/index` and `about` describe the same route.
        const key = `/${rest.join('/').replace(/\/?index$/, '')}/`.replace('//', '/');
        if (!index.has(key)) index.set(key, new Set());
        index.get(key)!.add(lang);
    }

    return index;
})();

/* ---- url helpers -------------------------------------------------------- */

/** Strip a leading language segment: '/en/about/' → '/about/' */
export function stripLang(url: string): string {
    const [, first, ...rest] = url.split('/');
    return isLang(first) ? `/${rest.join('/')}` : url;
}

/**
 * Prefix a language-neutral path with a language.
 * localeUrl('/countries/', 'en') → '/en/countries/'
 */
export function localeUrl(path: string, lang: Lang = DEFAULT_LANG): string {
    if (!path.startsWith('/')) return path;
    const bare = stripLang(path);
    return `/${lang}${bare}`;
}

/**
 * Like localeUrl, but falls back to the default language when the page has not
 * been translated yet.
 *
 * The legal pages only exist in English; without this the Spanish chrome would
 * link every one of them at a URL that 404s.
 */
export function localeFallbackUrl(path: string, lang: Lang = DEFAULT_LANG): string {
    if (!path.startsWith('/')) return path;
    const bare = stripLang(path);
    const available = pageIndex.get(bare);
    const resolved = available?.has(lang) ? lang : DEFAULT_LANG;
    return `/${resolved}${bare}`;
}

/**
 * Translations of the current URL, for <link rel="alternate" hreflang> and the
 * language switcher. Excludes the language passed in.
 */
export function localeLinks(url: string, lang: Lang): Array<{ lang: Lang; url: string }> {
    const bare = stripLang(url);
    const available = pageIndex.get(bare);
    if (!available) return [];

    return LANGS.filter((candidate) => candidate !== lang && available.has(candidate)).map(
        (candidate) => ({ lang: candidate, url: `/${candidate}${bare}` })
    );
}

/** BCP 47 tag for <html lang>, e.g. 'en-gb'. */
export function htmlLang(lang: Lang): string {
    return locales[lang].locale;
}

/** Absolute URL for canonicals, feeds and structured data. */
export function absoluteUrl(path: string, site: string): string {
    return new URL(path, site).href;
}
