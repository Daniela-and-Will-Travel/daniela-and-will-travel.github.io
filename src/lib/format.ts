import { locales, type Lang } from '../data/locales';
import { t } from './i18n';

/**
 * Front matter dates are bare `YYYY-MM-DD`, which parse as UTC midnight.
 * Formatting those in the build machine's local zone shifts every post a day
 * earlier anywhere west of Greenwich, so format in UTC too.
 */
export function formatDate(
    date: Date,
    lang: Lang,
    format: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
): string {
    return date.toLocaleDateString(locales[lang].locale, { timeZone: 'UTC', ...format });
}

/** RFC 3339 timestamp for <time datetime>, feeds and the sitemap. */
export function toRfc3339(date: Date): string {
    return date.toISOString();
}

const WORDS_PER_MINUTE = 240;

/**
 * Reading time for a chunk of rendered HTML, to the nearest minute.
 * Based on https://www.bobmonsour.com/posts/calculating-reading-time/
 */
export function readingTime(html: string, lang: Lang): string {
    const plain = String(html)
        .replace(/(&lt;.*?&gt;)|(<[^>]+>)/gi, '')
        .replace(/\s+|'s/g, ' ')
        .trim();

    const count = plain ? plain.split(' ').length : 0;
    const minutes = Math.round(count / WORDS_PER_MINUTE);
    const translate = t(lang);

    if (minutes === 0) return translate('readingTime.underMinute');
    if (minutes === 1) return translate('readingTime.minute');
    return translate('readingTime.other', { minutes });
}

// Acronyms and other words that don't survive plain title casing.
const TAG_LABEL_OVERRIDES: Record<string, string> = {
    diy: 'DIY',
    rv: 'RV',
    seo: 'SEO',
    vpn: 'VPN'
};

/**
 * Turn a tag slug into the label shown on a pill or an archive heading.
 * tagLabel('southeast-asia') → 'Southeast Asia'
 */
export function tagLabel(tag: string): string {
    if (typeof tag !== 'string') return '';

    return tag
        .split('-')
        .map((word) => TAG_LABEL_OVERRIDES[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/** Slugify a tag for use in a URL. */
export function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Stop a heading or lede ending on a one-word orphan line.
 * Kept as a filter because `text-wrap: balance` still isn't safe to rely on
 * for the display sizes used in the heroes.
 */
export function widont(value: string): string {
    const words = value.split(' ');
    if (words.length < 2) return value;
    words[words.length - 2] += `\u00A0${words[words.length - 1]}`;
    words.pop();
    return words.join(' ');
}
