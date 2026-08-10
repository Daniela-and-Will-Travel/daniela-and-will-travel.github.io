import type { APIRoute } from 'astro';
import { settings } from '@data/settings.js';

export const GET: APIRoute = () => {
    const body = `Sitemap: ${settings.url}/sitemap.xml

User-agent: *
Disallow: /404.html
`;

    return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
