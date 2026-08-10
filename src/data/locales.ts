// The languages the site is built in.
//
// `postSegment` is the path component posts live under for that language. It
// used to be hard-coded per locale in an 11tydata file (and the Spanish one was
// still the Swedish `skrift` inherited from the starter theme); keeping it here
// means adding a language is a single entry.

export interface Locale {
    /** Writing direction for the <html dir> attribute. */
    dir: 'ltr' | 'rtl';
    /** English name of the language, used in switcher labels. */
    label: string;
    /** Two-letter badge shown in the language switcher. */
    shorthand: string;
    /** BCP 47 tag for <html lang> and Intl date formatting. */
    locale: string;
    /** URL segment posts sit under: /<lang>/<postSegment>/<slug>/ */
    postSegment: string;
}

export const locales = {
    en: {
        dir: 'ltr',
        label: 'English',
        shorthand: 'EN',
        locale: 'en-gb',
        postSegment: 'writing'
    },
    es: {
        dir: 'ltr',
        label: 'Spanish',
        shorthand: 'ES',
        locale: 'es-mx',
        postSegment: 'escritos'
    }
} as const satisfies Record<string, Locale>;

export type Lang = keyof typeof locales;

export const DEFAULT_LANG: Lang = 'en';

export const LANGS = Object.keys(locales) as Lang[];

export function isLang(value: string): value is Lang {
    return Object.hasOwn(locales, value);
}
