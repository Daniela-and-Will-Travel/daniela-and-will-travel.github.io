import type { APIRoute } from 'astro';
import { settings } from '@data/settings.js';

export const GET: APIRoute = () => {
    const body = `/* TEAM */
Designer / Developer: ${settings.author.name}
Contact: ${settings.author.email}
Site: ${settings.author.url}
From: ${settings.author.location}

/* SITE */
Last update: ${new Date().toISOString().split('T')[0]}
Standards: HTML5, CSS3
Software: Astro
`;

    return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
