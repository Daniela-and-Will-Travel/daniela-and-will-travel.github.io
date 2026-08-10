import type { APIRoute, GetStaticPaths } from 'astro';

import { LANGS, type Lang } from '@data/locales';
import { settings } from '@data/settings.js';
import { absoluteUrl, t } from '@lib/i18n';
import { getPosts, postUrl } from '@lib/posts';
import { toRfc3339 } from '@lib/format';
import { renderPostHtml } from '@lib/feed';

export const getStaticPaths = (() =>
    LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
    const lang = params.lang as Lang;
    const translate = t(lang);
    const posts = await getPosts(lang);

    const items = await Promise.all(
        posts.map(async (post) => {
            const url = absoluteUrl(postUrl(post), settings.url);
            return {
                id: url,
                url,
                title: post.data.title,
                summary: post.data.byline,
                image: absoluteUrl(
                    post.data.thumbnail ?? post.data.heroImage ?? settings.meta.opengraphDefaultImage,
                    settings.url
                ),
                content_html: await renderPostHtml(post),
                date_published: toRfc3339(post.data.date),
                date_modified: toRfc3339(post.data.modified ?? post.data.date),
                tags: post.data.tags,
                language: lang
            };
        })
    );

    const feed = {
        version: 'https://jsonfeed.org/version/1.1',
        title: `${translate('meta.jsonTitle')} ${settings.meta.separator} ${translate('meta.title')}`,
        description: translate('meta.description'),
        language: lang,
        home_page_url: `${settings.url}/`,
        feed_url: absoluteUrl(`/${lang}/feed/feed.json`, settings.url),
        icon: absoluteUrl('/assets/img/icon-512.png', settings.url),
        favicon: absoluteUrl('/assets/img/icon-180.png', settings.url),
        authors: [{ name: settings.author.name, url: settings.author.url }],
        items
    };

    return new Response(JSON.stringify(feed, null, 2), {
        headers: { 'Content-Type': 'application/feed+json; charset=utf-8' }
    });
};
