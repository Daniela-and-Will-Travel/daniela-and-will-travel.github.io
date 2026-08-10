import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import mdxRenderer from '@astrojs/mdx/server.js';

import { settings } from '@data/settings.js';
import type { Post } from './posts';

/**
 * Render a post body to an HTML string for the feeds.
 *
 * The Atom and JSON feeds have always carried full post content. MDX compiles
 * to a component rather than an HTML string, so producing one means running it
 * through a container with the MDX renderer registered.
 */
let containerPromise: Promise<AstroContainer> | undefined;

function getContainer(): Promise<AstroContainer> {
    containerPromise ??= (async () => {
        const container = await AstroContainer.create();
        container.addServerRenderer({ name: '@astrojs/mdx', renderer: mdxRenderer });
        return container;
    })();
    return containerPromise;
}

/** Rewrite root-relative URLs so feed readers can resolve images and links. */
export function absolutize(html: string): string {
    return html
        .replace(/(href|src)="\/(?!\/)/g, `$1="${settings.url}/`)
        .replace(
            /srcset="([^"]*)"/g,
            (_match, value: string) => `srcset="${value.replace(/(^|,\s*)\//g, `$1${settings.url}/`)}"`
        );
}

export async function renderPostHtml(post: Post): Promise<string> {
    const { Content } = await render(post);
    const container = await getContainer();
    return absolutize(await container.renderToString(Content));
}

export function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const MIME_BY_EXTENSION: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif'
};

export function mimeType(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase() ?? '';
    return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}
