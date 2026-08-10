import type { Lang } from './locales';

export interface NavItem {
    text: string;
    /** Language-neutral path; localeUrl() prefixes it at render time. */
    url: string;
}

export const navigation: Record<Lang, NavItem[]> = {
    en: [
        { text: 'Countries', url: '/countries/' },
        { text: 'Tools', url: '/tools/' },
        { text: 'About Us', url: '/about/' }
    ],
    // No Spanish pages have been written yet. The chrome falls back to the
    // English menu until entries land here.
    es: []
};
