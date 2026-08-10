import type { APIRoute, GetStaticPaths } from 'astro';

import { LANGS, type Lang } from '@data/locales';
import { t } from '@lib/i18n';

export const getStaticPaths = (() =>
    LANGS.map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

/**
 * Stylesheet that makes the Atom feed readable when opened in a browser.
 *
 * It links the built site stylesheet by a well-known path rather than the
 * hashed bundle name, because an XSL document is served straight to the browser
 * and never goes through Astro's asset rewriting. See public/assets/css/feed.css.
 */
export const GET: APIRoute = ({ params }) => {
    const lang = params.lang as Lang;
    const translate = t(lang);

    const body = `<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
	<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}">
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title><xsl:value-of select="/atom:feed/atom:title"/></title>
			<link rel="stylesheet" href="/assets/css/feed.css"/>
		</head>
		<body class="rss-xslt">
			<main id="content">
				<div class="entry-content">
					<p class="notice">${translate('feeds.info')}</p>
					<h1>${translate('feeds.title')}</h1>
					<ul class="posts">
						<xsl:for-each select="/atom:feed/atom:entry">
							<li>
								<a>
									<xsl:attribute name="href">
									<xsl:value-of select="atom:link/@href"/>
									</xsl:attribute>
									<xsl:value-of select="atom:title"/>
								</a>
								<span><xsl:value-of select="substring(atom:updated, 0, 11)" /></span>
							</li>
						</xsl:for-each>
					</ul>
				</div>
			</main>
		</body>
	</html>
	</xsl:template>
</xsl:stylesheet>
`;

    return new Response(body, { headers: { 'Content-Type': 'text/xsl; charset=utf-8' } });
};
