import type { APIRoute, GetStaticPaths } from 'astro';

import { LANGS, type Lang } from '@data/locales';
import { settings } from '@data/settings.js';
import { absoluteUrl, t } from '@lib/i18n';
import { getPosts, postUrl } from '@lib/posts';
import { toRfc3339 } from '@lib/format';
import { escapeXml, mimeType, renderPostHtml } from '@lib/feed';

export const getStaticPaths = (() =>
    LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
    const lang = params.lang as Lang;
    const translate = t(lang);
    const posts = await getPosts(lang);

    const entries = await Promise.all(
        posts.map(async (post) => {
            const html = await renderPostHtml(post);
            const url = absoluteUrl(postUrl(post), settings.url);
            const image = absoluteUrl(
                post.data.thumbnail ?? post.data.heroImage ?? settings.meta.opengraphDefaultImage,
                settings.url
            );

            return `	<entry>
		<title>${escapeXml(post.data.title)}</title>
		<link href="${url}" />
		<updated>${toRfc3339(post.data.modified ?? post.data.date)}</updated>
		<published>${toRfc3339(post.data.date)}</published>
		<id>${url}</id>
		<summary>${escapeXml(post.data.byline)}</summary>
		<content xml:lang="${lang}" type="html">${escapeXml(html)}</content>
		<enclosure url="${image}" length="0" type="${mimeType(image)}" />
	</entry>`;
        })
    );

    const updated = posts.length ? toRfc3339(posts[0].data.date) : toRfc3339(new Date());
    const title = `${translate('meta.rssTitle')} ${settings.meta.separator} ${translate('meta.title')}`;

    const body = `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet href="/${lang}/feed/feed.xsl" type="text/xsl"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xml:base="${settings.url}/">
	<title>${escapeXml(title)}</title>
	<subtitle>${escapeXml(translate('meta.description'))}</subtitle>
	<icon>${absoluteUrl('/assets/img/icon-512.png', settings.url)}</icon>
	<link href="${absoluteUrl(`/${lang}/feed/feed.xml`, settings.url)}" rel="self" />
	<link href="${settings.url}/" />
	<updated>${updated}</updated>
	<id>${settings.url}/</id>
	<author>
		<name>${escapeXml(settings.author.name)}</name>
		<email>${escapeXml(settings.author.email)}</email>
	</author>
${entries.join('\n')}
</feed>
`;

    return new Response(body, {
        headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' }
    });
};
