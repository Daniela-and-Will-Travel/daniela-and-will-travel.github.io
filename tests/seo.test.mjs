// Regression tests for the SEO fixes that only exist in the built output.
//
// These assert against dist/ rather than the source, because every one of them
// is a property of the emitted HTML: whether the LCP image is discoverable,
// which posts the related strip actually links to, and what a thin tag archive
// tells robots. Run `npm run build` first.
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
    if (condition) {
        passed++;
        console.log(`PASS  ${name}`);
    } else {
        failed++;
        console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

if (!fs.existsSync('dist/index.html')) {
    console.error('No build found. Run `npm run build` before `npm test`.');
    process.exit(1);
}

/** Every built post page, as [slug, html]. */
const postDir = 'dist/en/writing';
const posts = fs
    .readdirSync(postDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, fs.readFileSync(path.join(postDir, entry.name, 'index.html'), 'utf8')]);

check('found the built post pages', posts.length >= 12, `saw ${posts.length}`);

// --- H1: the LCP image must be discoverable ---------------------------------
//
// The hero is the first <img> in document order on a post page. Lazy defers its
// discovery until layout runs, which is exactly what made it the slow LCP.
for (const [slug, html] of posts) {
    const firstImg = html.match(/<img\b[^>]*>/);
    check(
        `${slug}: hero image is eager`,
        firstImg && /loading="eager"/.test(firstImg[0]) && /fetchpriority="high"/.test(firstImg[0]),
        firstImg ? firstImg[0].slice(0, 120) : 'no <img> found'
    );

    // Exactly one: several high-priority images compete and none of them wins.
    const eager = html.match(/<img\b[^>]*loading="eager"[^>]*>/g) ?? [];
    check(`${slug}: exactly one eager image`, eager.length === 1, `saw ${eager.length}`);
}

const homeFirstImg = fs.readFileSync('dist/index.html', 'utf8').match(/<img\b[^>]*>/);
check(
    'home page hero is still eager',
    homeFirstImg && /loading="eager"/.test(homeFirstImg[0]) && /fetchpriority="high"/.test(homeFirstImg[0]),
    homeFirstImg ? homeFirstImg[0].slice(0, 120) : 'no <img> found'
);

// --- H2: related posts must not be the same three everywhere ----------------
//
// The related strip is the last section of the article; count how often each
// post is recommended across the whole site.
const recommended = new Map();
for (const [slug, html] of posts) {
    const section = html.split('section--tinted')[1] ?? '';
    const links = new Set([...section.matchAll(/href="(\/en\/writing\/[^"]+)"/g)].map((m) => m[1]));

    check(`${slug}: recommends 3 posts`, links.size === 3, `saw ${links.size}`);
    check(`${slug}: does not recommend itself`, !links.has(`/en/writing/${slug}/`));

    for (const link of links) recommended.set(link, (recommended.get(link) ?? 0) + 1);
}

// The property the selection actually guarantees: no post is left without an
// inbound link from the strip, and none of them absorbs a disproportionate
// share. The old static widget gave three posts 12 each and everything else 0.
// The exact spread moves with the tag graph, so assert the shape, not figures.
const orphans = posts.map(([slug]) => slug).filter((slug) => !recommended.has(`/en/writing/${slug}/`));
check('every post is recommended somewhere', orphans.length === 0, orphans.join(', '));

const worst = Math.max(...recommended.values());
check(
    'no post absorbs more than half the related links',
    worst <= Math.ceil(posts.length / 2),
    `worst = ${worst}`
);

// The concrete regression from the audit: an Iceland post recommending three
// Indonesian islands.
const iceland = posts.find(([slug]) => slug === 'five-day-iceland-itinerary');
if (iceland) {
    const section = iceland[1].split('section--tinted')[1] ?? '';
    const indonesian = ['nias-island', 'diy-lombok-loop', 'komodo-island-tour'].filter((slug) =>
        section.includes(`/en/writing/${slug}/`)
    );
    check(
        'iceland post is not recommending the full Indonesia set',
        indonesian.length < 3,
        `matched ${indonesian.join(', ')}`
    );
}

// --- H3: thin tag archives are noindex,follow and out of the sitemap --------
const tagDir = 'dist/en/tag';
const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');

for (const entry of fs.readdirSync(tagDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const html = fs.readFileSync(path.join(tagDir, entry.name, 'index.html'), 'utf8');
    // The archive lists one card per post; the tag cloud below reports the same
    // number, which is the value the template actually branched on.
    const cards = (html.match(/class="[^"]*\bcard\b[^"]*"/g) ?? []).length;
    const robots = html.match(/<meta name="robots" content="([^"]+)"/);
    const inSitemap = sitemap.includes(`/en/tag/${entry.name}/<`);

    if (cards < 3) {
        check(`tag/${entry.name} (${cards} posts): noindex, follow`, robots?.[1] === 'noindex, follow', robots?.[1] ?? 'no robots meta');
        check(`tag/${entry.name} (${cards} posts): absent from sitemap`, !inSitemap);
    } else {
        check(`tag/${entry.name} (${cards} posts): indexable`, !robots, robots?.[1] ?? '');
        check(`tag/${entry.name} (${cards} posts): present in sitemap`, inSitemap);
    }
}

// --- H4: dateModified is honest --------------------------------------------
//
// Compare against the editorial dates, not the wall clock: publishing or
// genuinely revising a post on the day it is built is valid.
const postDates = new Map(
    fs.readdirSync('src/content/posts/en', { recursive: true })
        .filter((file) => /\.mdx?$/.test(String(file)))
        .map((file) => {
            const source = fs.readFileSync(path.join('src/content/posts/en', String(file)), 'utf8');
            const frontMatter = source.split('---')[1] ?? '';
            // Posts declare YAML date scalars, e.g. date: 2025-03-10.
            const date = frontMatter.match(/^date:[ \t]*(\S+)/m)?.[1];
            const modified = frontMatter.match(/^modified:[ \t]*(\S+)/m)?.[1];
            return [path.basename(String(file)).replace(/\.mdx?$/, ''), {
                published: new Date(date).valueOf(),
                modified: new Date(modified ?? date).valueOf()
            }];
        })
);
for (const [slug, html] of posts) {
    const blog = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
        .map((m) => JSON.parse(m[1]))
        .find((entry) => entry['@type'] === 'BlogPosting');

    check(`${slug}: has BlogPosting`, Boolean(blog));
    if (!blog) continue;

    check(
        `${slug}: dateModified >= datePublished`,
        new Date(blog.dateModified) >= new Date(blog.datePublished),
        `${blog.dateModified} < ${blog.datePublished}`
    );
    check(
        `${slug}: datePublished matches front matter`,
        new Date(blog.datePublished).valueOf() === postDates.get(slug)?.published,
        blog.datePublished
    );
    check(
        `${slug}: dateModified matches front matter`,
        new Date(blog.dateModified).valueOf() === postDates.get(slug)?.modified,
        blog.dateModified
    );
}

console.log(`\n${passed}/${passed + failed} passed`);
process.exit(failed ? 1 : 0);
