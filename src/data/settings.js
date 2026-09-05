// Site-wide settings. Imported by astro.config.mjs as well as by components,
// so this file stays plain JS with no Astro-only imports.

export const SITE_URL =
    process.env.URL || process.env.CF_PAGES_URL || 'https://danielaandwilltravel.ca';

// danielaandwilltravel.ca is this site's production domain — the github.io host
// only 301s to it — so every canonical, og:url, hreflang and sitemap <loc> must
// name the .ca apex. Preview builds on pages.dev are the only staging case.
export const isStaging = Boolean(process.env.CF_PAGES_URL?.includes('pages.dev'));

// Hoisted so `people` below can reference them; the same values are exposed as
// `settings.social`.
const social = {
    instagram: 'https://www.instagram.com/danielaandwill',
    youtube: 'https://www.youtube.com/channel/UC5ccB45YDsFrsZ305iKi7HQ',
    unsplash: 'https://unsplash.com/@william_vdg',
    shutterstockDaniela: 'https://www.shutterstock.com/g/danielaasada',
    shutterstockWill: 'https://www.shutterstock.com/g/willtheorangeguy'
};

/**
 * The two people behind the blog, keyed by the name posts use in `author:`.
 *
 * On a two-person travel blog the authors *are* the expertise signal, so each
 * one needs to resolve to a stable entity rather than a bare name string:
 * `url` points at their section of the About page, and `sameAs` lists the
 * profiles that corroborate it. `sameAs` must describe the same entity, so
 * personal profiles live here rather than being folded into the Organization.
 */
export const people = {
    daniela: {
        id: 'daniela',
        name: 'Daniela Sada',
        jobTitle: 'Travel writer',
        path: '/en/about/#daniela',
        sameAs: [social.shutterstockDaniela]
    },
    will: {
        id: 'will',
        name: 'William Vandergraaf',
        jobTitle: 'Travel writer and web developer',
        path: '/en/about/#will',
        sameAs: [
            social.shutterstockWill,
            social.unsplash,
            'https://williamvdg.me',
            'https://github.com/willtheorangeguy',
            'https://youtube.com/c/willtheorangeguy'
        ]
    }
};

/** Maps the `author:` front matter string onto one or both of the above. */
export const authorsByName = {
    Daniela: [people.daniela],
    Will: [people.will],
    'Daniela and Will': [people.daniela, people.will]
};

export const settings = {
    url: SITE_URL,
    isStaging,
    themeColorLight: '#eceff4',
    themeColorDark: '#2e3440',
    author: {
        name: 'Daniela Sada and William Vandergraaf',
        email: 'danielaandwilltravel@gmail.com',
        url: 'https://danielaandwilltravel.ca/',
        location: 'Vancouver, Canada'
    },
    meta: {
        separator: '•',
        opengraphDefaultImage: '/assets/img/opengraph-default.png',
        googleSiteVerification: 'psmCoxaIXJaVMDwyrHNjYp_iQOYMFTchrtIciPl2EQ4'
    },
    social,
    people,
    // The Organization's own profiles. Deliberately shorter than the list on
    // the About page: Unsplash, GitHub and the Shutterstock portfolios belong to
    // Daniela and Will personally, and `sameAs` is an identity claim — pointing
    // the Organization at a person's profile asserts they are the same entity.
    // Those live on the Person entries instead, with `founder` tying them here.
    organizationSameAs: [social.instagram, social.youtube],
    seo: {
        defaultChangeFrequency: 'monthly',
        defaultPriority: '0.7'
    },
    manifest: {
        themeColor: '#eceff4',
        backgroundColor: '#eceff4',
        display: 'minimal-ui',
        orientation: 'portrait-primary',
        categories: ['travel', 'blog']
    }
};

export default settings;
