// Site-wide settings. Imported by astro.config.mjs as well as by components,
// so this file stays plain JS with no Astro-only imports.

export const SITE_URL =
    process.env.URL || process.env.CF_PAGES_URL || 'https://danielaandwilltravel.ca';

// danielaandwilltravel.ca is this site's production domain — the github.io host
// only 301s to it — so every canonical, og:url, hreflang and sitemap <loc> must
// name the .ca apex. Preview builds on pages.dev are the only staging case.
export const isStaging = Boolean(process.env.CF_PAGES_URL?.includes('pages.dev'));

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
    social: {
        instagram: 'https://www.instagram.com/danielaandwill',
        youtube: 'https://www.youtube.com/channel/UC5ccB45YDsFrsZ305iKi7HQ',
        unsplash: 'https://unsplash.com/@william_vdg',
        shutterstockDaniela: 'https://www.shutterstock.com/g/danielaasada',
        shutterstockWill: 'https://www.shutterstock.com/g/willtheorangeguy'
    },
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
