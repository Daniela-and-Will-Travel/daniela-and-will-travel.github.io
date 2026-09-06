// Regression tests for the SEO fixes that only exist in the built output.
//
// These assert against dist/ rather than the source, because every one of them
// is a property of the emitted HTML: whether the LCP image is discoverable,
// which posts the related strip actually links to, and what a thin tag archive
// tells robots. Run `npm run build` first.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

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

/**
 * Every built post page, as [slug, html].
 *
 * A renamed post leaves a redirect stub behind at its old URL, which lives in
 * this directory and is emphatically not a post: no hero, no schema, no H1.
 */
const isRedirectStub = (html) => /<meta http-equiv="refresh"/i.test(html);

const postDir = 'dist/en/writing';
const posts = fs
    .readdirSync(postDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, fs.readFileSync(path.join(postDir, entry.name, 'index.html'), 'utf8')])
    .filter(([, html]) => !isRedirectStub(html));

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

/** Every ld+json node on a page. */
function schemaOf(html) {
    return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) =>
        JSON.parse(m[1])
    );
}

// --- M1: the H1 must not drift from the title by accident ------------------
//
// The Iceland post was titled "Five Day Iceland Itinerary" but headed "Five
// Days in Reykjavik" — a narrower place than the body actually covers, and a
// different search intent. Divergence is legitimate when it is *deliberate*: a
// post may set `seo.title` to bid for a phrase the H1 doesn't need to carry.
// So the rule is that the two agree unless the post opted out in front matter,
// which makes the exception visible in review rather than silent drift.
const declaresSeoTitle = new Set(
    fs
        .readdirSync('src/content/posts/en', { recursive: true })
        .filter((file) => String(file).endsWith('.mdx'))
        .filter((file) => {
            const source = fs.readFileSync(path.join('src/content/posts/en', String(file)), 'utf8');
            const frontMatter = source.split('---')[1] ?? '';
            return /^\s+title:/m.test(frontMatter.split('seo:')[1] ?? '');
        })
        .map((file) => path.basename(String(file), '.mdx'))
);

for (const [slug, html] of posts) {
    const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1].replace(/<[^>]+>/g, '').trim();
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1].trim();

    check(`${slug}: has an H1`, Boolean(h1));
    if (declaresSeoTitle.has(slug)) continue;

    check(
        `${slug}: H1 matches the title`,
        Boolean(h1 && title && title.startsWith(h1)),
        `${title} vs ${h1}`
    );
}

// --- M2: fonts ship as woff2 ------------------------------------------------
const css = fs
    .readdirSync('dist/_astro')
    .filter((file) => file.endsWith('.css'))
    .map((file) => fs.readFileSync(path.join('dist/_astro', file), 'utf8'))
    .join('');

check('no truetype @font-face left', !/truetype|\.ttf/.test(css));
check(
    'no TTF shipped',
    !fs.readdirSync('dist/assets/fonts', { recursive: true }).some((f) => String(f).endsWith('.ttf'))
);

const home = fs.readFileSync('dist/index.html', 'utf8');
const preload = home.match(/<link rel="preload"[^>]*>/);
check(
    'preload points at a woff2 font',
    Boolean(preload && /\.woff2/.test(preload[0]) && /type="font\/woff2"/.test(preload[0])),
    preload?.[0] ?? 'no preload'
);
// Preloading both faces would have them compete for the same bandwidth.
check('only one font is preloaded', (home.match(/rel="preload"[^>]*as="font"/g) ?? []).length === 1);

// --- M3: entities resolve rather than repeating names ----------------------
for (const [slug, html] of posts) {
    const blog = schemaOf(html).find((entry) => entry['@type'] === 'BlogPosting');
    const authors = [blog.author].flat();

    check(
        `${slug}: every author has an @id and sameAs`,
        authors.every((a) => a['@id'] && Array.isArray(a.sameAs) && a.sameAs.length > 0),
        JSON.stringify(authors.map((a) => a.name))
    );
}

const aboutPeople = schemaOf(fs.readFileSync('dist/en/about/index.html', 'utf8')).filter(
    (entry) => entry['@type'] === 'Person'
);
check('about page marks up both people', aboutPeople.length === 2, `saw ${aboutPeople.length}`);

// The @id is a fragment on the about page, so the anchor has to be real.
const aboutHtml = fs.readFileSync('dist/en/about/index.html', 'utf8');
for (const person of aboutPeople) {
    check(
        `${person.name}: standalone Person has a schema context`,
        person['@context'] === 'https://schema.org'
    );
    const anchor = person['@id'].split('#')[1];
    check(`about page has an #${anchor} anchor`, aboutHtml.includes(`id="${anchor}"`));
}

const org = schemaOf(home).find((entry) => entry['@type'] === 'Organization');
const brandProfiles = new Set(org?.sameAs ?? []);
const personNodes = [
    ...aboutPeople,
    ...(org?.founder ?? []),
    ...posts.flatMap(([, html]) => schemaOf(html)
        .filter((entry) => entry['@type'] === 'BlogPosting')
        .flatMap((entry) => [entry.author].flat()))
];
check(
    'people do not claim the organization profiles as their identities',
    personNodes.every((person) => person.sameAs.every((url) => !brandProfiles.has(url)))
);
check(
    'organization retains the shared Instagram profile',
    brandProfiles.has('https://www.instagram.com/danielaandwill')
);
check('organization names its founders', org?.founder?.length === 2);
check(
    'founder @ids resolve to the about page',
    Boolean(org?.founder?.every((f) => aboutPeople.some((p) => p['@id'] === f['@id'])))
);

for (const entry of fs.readdirSync(tagDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const html = fs.readFileSync(path.join(tagDir, entry.name, 'index.html'), 'utf8');
    const collection = schemaOf(html).find((node) => node['@type'] === 'CollectionPage');
    const cards = (html.match(/class="[^"]*\bcard\b[^"]*"/g) ?? []).length;

    check(`tag/${entry.name}: has CollectionPage`, Boolean(collection));
    check(
        `tag/${entry.name}: ItemList matches the cards shown`,
        collection?.mainEntity?.numberOfItems === cards,
        `${collection?.mainEntity?.numberOfItems} vs ${cards}`
    );
}

const countries = fs.readFileSync('dist/en/countries/index.html', 'utf8');
check(
    'countries page has a CollectionPage',
    schemaOf(countries).some((node) => node['@type'] === 'CollectionPage')
);
const countryList = schemaOf(countries).find((node) => node['@type'] === 'CollectionPage')?.mainEntity;
const countryDocument = new JSDOM(countries, { url: 'https://danielaandwilltravel.ca/en/countries/' }).window.document;
const countryCards = [...countryDocument.querySelectorAll('.card__title a')].map((link, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: link.href,
    name: link.textContent.trim()
}));
check(
    'countries ItemList matches visible card URLs, titles and order',
    countryList?.numberOfItems === countryCards.length &&
        JSON.stringify(countryList?.itemListElement) === JSON.stringify(countryCards)
);

// --- M4: no empty section on an indexed hub --------------------------------
check('countries page has no empty continent block', !/Coming soon/.test(countries));
check(
    'a continent with no guides is greyed out on the map',
    /class="svg-map-disabled" href="#NorthAmerica"/.test(countries)
);

// --- hreflang: complete, or absent -----------------------------------------
//
// A set naming only the page it sits on is self-referential and says nothing a
// crawler can't read off the canonical. A partial set — alternates without
// x-default — is ignored wholesale. So the only two valid states are "no
// hreflang at all" and "every language plus x-default".
const allPages = [
    ['home', fs.readFileSync('dist/index.html', 'utf8')],
    ['about', fs.readFileSync('dist/en/about/index.html', 'utf8')],
    ...posts
];

for (const [name, html] of allPages) {
    const tags = html.match(/<link rel="alternate" hreflang="[^"]*"[^>]*>/g) ?? [];
    check(
        `${name}: hreflang set is complete or absent`,
        tags.length === 0 || tags.some((tag) => tag.includes('hreflang="x-default"')),
        `${tags.length} alternates, no x-default`
    );
}

// --- locale: .ca domain, authors in Vancouver ------------------------------
for (const [name, html] of allPages) {
    check(`${name}: html lang is en-ca`, /<html lang="en-ca"/.test(html));
    check(`${name}: og:locale is en_ca`, /og:locale" content="en_ca"/.test(html));
}

// --- meta descriptions: long enough to be worth showing --------------------
//
// Google rewrites a description it considers unhelpful, and a 25-character
// stub ("Learn about our policies.") is the shape it rewrites most readily —
// three of those were identical across the legal pages. 160 is roughly where
// desktop truncation starts, so the useful band is 120-160.
const indexablePages = fs
    .readdirSync('dist', { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name === 'index.html')
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name))
    .map((file) => [
        `/${path.relative('dist', file).replace(/\\/g, '/').replace(/index\.html$/, '')}`,
        fs.readFileSync(file, 'utf8')
    ])
    .filter(([, html]) => !/<meta name="robots" content="noindex/.test(html));

check('found the indexable pages', indexablePages.length >= 24, `saw ${indexablePages.length}`);

const seenDescriptions = new Map();
for (const [url, html] of indexablePages) {
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    check(`${url}: has a meta description`, Boolean(description));
    if (!description) continue;

    // Entities are one character to a reader, so measure the decoded string.
    const length = description.replace(/&[a-z]+;|&#\d+;/g, 'x').length;
    check(
        `${url}: meta description is 120-160 characters`,
        length >= 120 && length <= 160,
        `${length} chars`
    );

    seenDescriptions.set(description, [...(seenDescriptions.get(description) ?? []), url]);
}

for (const [, urls] of seenDescriptions) {
    check(`${urls[0]}: meta description is not reused`, urls.length === 1, urls.join(', '));
}

// --- lastModified is declared by hand, so check it against git --------------
//
// sitemap.xml.ts trusts a date the page declares about itself, which is the
// right design — a build stamp claims every page changed on every deploy. The
// cost is that the field goes stale silently: countries.astro declared
// 2026-09-04 through a commit that rewrote half of it the next day.
const gitDate = (file) => {
    const stamp = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
        encoding: 'utf8'
    }).trim();
    return stamp ? new Date(stamp) : undefined;
};

// A tree with uncommitted edits would report the last commit, not the working
// state, so this only means anything on a clean checkout of the file.
const staticPages = fs
    .readdirSync('src/pages/en')
    .filter((name) => name.endsWith('.astro'))
    .map((name) => `src/pages/en/${name}`)
    .concat('src/pages/index.astro');

const declaredDates = new Map();
for (const file of staticPages) {
    const source = fs.readFileSync(file, 'utf8');
    const declared = source.match(/lastModified:\s*['"]([^'"]+)['"]/)?.[1];
    check(`${file}: declares lastModified`, Boolean(declared));
    if (!declared) continue;

    const dirty = execFileSync('git', ['status', '--porcelain', '--', file], { encoding: 'utf8' });
    if (!dirty.trim()) {
        const committed = gitDate(file);
        // Same-day edits are fine; the failure this catches is a declared date
        // that sits *behind* a commit which changed the file.
        const declaredDay = new Date(`${declared}T23:59:59Z`);
        check(
            `${file}: lastModified is not behind its last commit`,
            !committed || committed <= declaredDay,
            `declared ${declared}, last commit ${committed?.toISOString().slice(0, 10)}`
        );
    }

    declaredDates.set(declared, [...(declaredDates.get(declared) ?? []), file]);
}

// Five unrelated documents do not change on the same day. This is a warning
// rather than a failure: a genuine site-wide edit can legitimately share one.
for (const [date, files] of declaredDates) {
    if (files.length >= 3) {
        console.warn(`WARN  ${files.length} pages share lastModified ${date} — ${files.join(', ')}`);
    }
}

// --- sitemap: lastmod on everything, nothing Google ignores ----------------
check('sitemap declares no priority', !sitemap.includes('<priority>'));
check('sitemap declares no changefreq', !sitemap.includes('<changefreq>'));

const locs = (sitemap.match(/<loc>/g) ?? []).length;
const lastmods = (sitemap.match(/<lastmod>/g) ?? []).length;
check('every sitemap URL carries lastmod', locs === lastmods, `${lastmods} of ${locs}`);
for (const [, entry] of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const url = new URL(entry.match(/<loc>(.*?)<\/loc>/)[1]);
    const lastmod = entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1];
    check(`${url.pathname}: lastmod is a valid date`, Number.isFinite(Date.parse(lastmod)));

    // Archive dates are derived from their posts; static pages and articles
    // must match their declared editorial dates, even when that date is today.
    if (url.pathname.includes('/tag/')) continue;
    let expected;
    if (url.pathname.startsWith('/en/writing/')) {
        expected = postDates.get(url.pathname.split('/').at(-2))?.modified;
    } else {
        const file = url.pathname === '/' ? 'index' : url.pathname.slice(1, -1);
        const source = fs.readFileSync(`src/pages/${file}.astro`, 'utf8');
        expected = Date.parse(source.match(/lastModified:\s*['"]([^'"]+)['"]/)?.[1]);
    }
    check(
        `${url.pathname}: lastmod matches the declared content date`,
        Date.parse(lastmod) === expected,
        lastmod
    );
}

// --- the one security header a static host can still set -------------------
check(
    'referrer policy is declared',
    /<meta name="referrer" content="strict-origin-when-cross-origin"/.test(home)
);

console.log(`\n${passed}/${passed + failed} passed`);
process.exit(failed ? 1 : 0);
