import type { APIRoute } from 'astro';
import { settings } from '@data/settings.js';

/**
 * Crawlers that take the content but can never send a reader back.
 *
 * The distinction is attribution, not AI: GPTBot, ClaudeBot, PerplexityBot and
 * Google-Extended all feed products that cite a source and link out, which on a
 * blog funded by affiliate links is worth the crawl. CCBot and anthropic-ai
 * feed pretraining corpora with no surface a citation could appear on, so the
 * guides go out and nothing comes back.
 *
 * Applebot-Extended is deliberately absent: it governs Apple Intelligence
 * training, but blocking it is a judgement call we have not made, and plain
 * Applebot (Safari and Spotlight indexing) is a different agent either way.
 */
const trainingOnlyCrawlers = ['CCBot', 'anthropic-ai'];

export const GET: APIRoute = () => {
    // The wildcard group goes last. A robots.txt parser matches the most
    // specific group only, but a malformed or misplaced group is the classic
    // way to accidentally disallow everyone.
    const body = `Sitemap: ${settings.url}/sitemap.xml

${trainingOnlyCrawlers.map((agent) => `User-agent: ${agent}\nDisallow: /\n`).join('\n')}
User-agent: *
Disallow: /404.html
`;

    return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
