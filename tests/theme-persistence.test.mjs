// Regression test for dark mode being lost on soft navigation.
//
// Runs the real built artefacts — the inline head script and the bundled client
// JS from dist/ — inside jsdom, and reproduces exactly what Astro's ClientRouter
// does to <html> on a swap.
//
// Run `npm run build` first — this reads dist/, deliberately, so it tests what
// actually ships rather than a re-implementation of it.
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const SITE = 'https://daniela-and-will-travel.github.io/';

if (!fs.existsSync('dist/index.html')) {
    console.error('No build found. Run `npm run build` before `npm test`.');
    process.exit(1);
}

const homeHtml = fs.readFileSync('dist/index.html', 'utf8');
const aboutHtml = fs.readFileSync('dist/en/about/index.html', 'utf8');

// The inline theme script, lifted straight out of the built page.
const inlineTheme = (() => {
    for (const m of homeHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
        if (m[1].includes("dataset.theme")) return m[1];
    }
    throw new Error('inline theme script not found in dist/index.html');
})();

// The bundled site script.
const bundlePath = fs
    .readdirSync('dist/_astro')
    .find((f) => f.startsWith('Base.astro_astro_type_script') && f.endsWith('.js'));
if (!bundlePath) throw new Error('client bundle not found');
const bundle = fs.readFileSync(`dist/_astro/${bundlePath}`, 'utf8');

function makeWindow({ stored, systemDark }) {
    const dom = new JSDOM(homeHtml, { url: SITE, runScripts: 'outside-only' });
    const { window } = dom;

    window.matchMedia = (query) => ({
        matches: query.includes('dark') ? systemDark : false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {}
    });

    window.localStorage.clear();
    if (stored !== null) window.localStorage.setItem('theme', stored);

    return window;
}

/**
 * Astro's swapRootAttributes: strip every attribute from the live <html>, then
 * copy the incoming document's attributes over.
 * (node_modules/astro/dist/transitions/swap-functions.js)
 */
function swapRootAttributes(window, incomingHtml) {
    const incoming = new JSDOM(incomingHtml, { url: SITE }).window.document.documentElement;
    const root = window.document.documentElement;
    for (const { name } of [...root.attributes]) root.removeAttribute(name);
    for (const { name, value } of [...incoming.attributes]) root.setAttribute(name, value);
}

const results = [];
const check = (label, actual, expected) => {
    const ok = actual === expected;
    results.push({ ok, label, actual, expected });
};

// ---------------------------------------------------------------------------
// 1. Initial load honours a stored preference.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: 'dark', systemDark: false });
    window.eval(inlineTheme);
    check('initial load, stored=dark', window.document.documentElement.dataset.theme, 'dark');
}

// ---------------------------------------------------------------------------
// 2. Initial load with no preference follows the OS.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: null, systemDark: true });
    window.eval(inlineTheme);
    check('initial load, no choice, OS dark', window.document.documentElement.dataset.theme, 'dark');
}

// ---------------------------------------------------------------------------
// 3. THE BUG: the swap wipes data-theme. Without a repaint it is gone.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: 'dark', systemDark: false });
    window.eval(inlineTheme);
    swapRootAttributes(window, aboutHtml);
    check(
        'control: swap alone destroys the attribute',
        window.document.documentElement.dataset.theme,
        undefined
    );
}

// ---------------------------------------------------------------------------
// 4. THE FIX: with the bundle loaded, astro:after-swap repaints it.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: 'dark', systemDark: false });
    window.eval(inlineTheme);
    window.eval(bundle);

    swapRootAttributes(window, aboutHtml);
    window.document.dispatchEvent(new window.Event('astro:after-swap'));

    check(
        'after swap, stored=dark survives',
        window.document.documentElement.dataset.theme,
        'dark'
    );

    // And it keeps surviving repeated navigations.
    for (let i = 0; i < 3; i++) {
        swapRootAttributes(window, aboutHtml);
        window.document.dispatchEvent(new window.Event('astro:after-swap'));
    }
    check(
        'after four swaps, still dark',
        window.document.documentElement.dataset.theme,
        'dark'
    );
}

// ---------------------------------------------------------------------------
// 5. Light preference survives too, against a dark OS.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: 'light', systemDark: true });
    window.eval(inlineTheme);
    window.eval(bundle);
    swapRootAttributes(window, aboutHtml);
    window.document.dispatchEvent(new window.Event('astro:after-swap'));
    check('after swap, stored=light beats dark OS', window.document.documentElement.dataset.theme, 'light');
}

// ---------------------------------------------------------------------------
// 6. No stored choice: the OS preference survives the swap, and following the
//    OS must not harden into a stored preference.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: null, systemDark: true });
    window.eval(inlineTheme);
    window.eval(bundle);
    swapRootAttributes(window, aboutHtml);
    window.document.dispatchEvent(new window.Event('astro:after-swap'));
    check('after swap, OS dark survives', window.document.documentElement.dataset.theme, 'dark');
    check('following the OS stores nothing', window.localStorage.getItem('theme'), null);
}

// ---------------------------------------------------------------------------
// 7. The toggle's aria-checked tracks the repainted theme.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: 'dark', systemDark: false });
    window.eval(inlineTheme);
    window.eval(bundle);
    swapRootAttributes(window, aboutHtml);
    window.document.dispatchEvent(new window.Event('astro:after-swap'));

    const toggle = window.document.querySelector('[data-theme-toggle]');
    check('toggle present in built page', Boolean(toggle), true);
    check('toggle aria-checked after swap', toggle?.getAttribute('aria-checked'), 'true');
}

// ---------------------------------------------------------------------------
// 8. Clicking the toggle records a choice that then survives a swap.
// ---------------------------------------------------------------------------
{
    const window = makeWindow({ stored: null, systemDark: false });
    window.eval(inlineTheme);
    window.eval(bundle);

    const toggle = window.document.querySelector('[data-theme-toggle]');
    toggle.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));

    check('click switches to dark', window.document.documentElement.dataset.theme, 'dark');
    check('click stores the choice', window.localStorage.getItem('theme'), 'dark');

    swapRootAttributes(window, aboutHtml);
    window.document.dispatchEvent(new window.Event('astro:after-swap'));
    check('chosen theme survives the swap', window.document.documentElement.dataset.theme, 'dark');
}

// ---------------------------------------------------------------------------
let failed = 0;
for (const r of results) {
    if (!r.ok) failed++;
    console.log(
        `${r.ok ? 'PASS' : 'FAIL'}  ${r.label}` +
            (r.ok ? '' : `\n        expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`)
    );
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
