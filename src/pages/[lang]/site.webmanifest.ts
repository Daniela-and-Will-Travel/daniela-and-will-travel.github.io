import type { APIRoute, GetStaticPaths } from 'astro';

import { LANGS, locales, type Lang } from '@data/locales';
import { settings } from '@data/settings.js';
import { absoluteUrl, t } from '@lib/i18n';

export const getStaticPaths = (() =>
    LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
    const lang = params.lang as Lang;
    const translate = t(lang);

    const manifest = {
        lang: locales[lang].locale,
        dir: locales[lang].dir,
        short_name: translate('meta.title'),
        name: translate('meta.title'),
        description: translate('meta.description'),
        categories: settings.manifest.categories,
        orientation: settings.manifest.orientation,
        scope: `${settings.url}/`,
        id: '/',
        start_url: `${settings.url}/`,
        theme_color: settings.manifest.themeColor,
        background_color: settings.manifest.backgroundColor,
        display: settings.manifest.display,
        icons: [
            {
                src: absoluteUrl('/assets/img/icon.png', settings.url),
                type: 'image/png',
                sizes: 'any',
                purpose: 'any maskable'
            },
            {
                src: absoluteUrl('/assets/img/icon-192.png', settings.url),
                type: 'image/png',
                sizes: '192x192'
            },
            {
                src: absoluteUrl('/assets/img/icon-512.png', settings.url),
                type: 'image/png',
                sizes: '512x512',
                purpose: 'any maskable'
            }
        ]
    };

    return new Response(JSON.stringify(manifest, null, 2), {
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' }
    });
};
