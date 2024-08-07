<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
	<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title><xsl:value-of select="/atom:feed/atom:title"/></title>
			<link rel="stylesheet" href="/assets/css/bundle.css"/>
		</head>
		<body class="rss-xslt">
			<main id="content">
				<div class="entry-content">
					<p class="notice">Este es un feed RSS. Copia y pega la URL en tu lector de feeds. Visita <a href="https://aboutfeeds.com">About Feeds</a> para obtener más información sobre RSS.</p>
					<h1>Publicado Recientemente</h1>
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