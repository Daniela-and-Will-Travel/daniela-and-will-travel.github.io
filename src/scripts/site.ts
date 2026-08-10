/**
 * The site's entire client-side behaviour, replacing Alpine.js and the four
 * inline <script> blocks the Eleventy templates carried around.
 *
 * Every setup function is idempotent and re-runs after a view transition swap,
 * because the ClientRouter replaces <body> without re-running module scripts.
 */

type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

/** The reader's explicit choice, or null if they have never made one. */
function storedTheme(): Theme | null {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : null;
}

function systemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * The theme that *should* be showing.
 *
 * Deliberately derived from storage rather than from the DOM: after a view
 * transition the `data-theme` attribute is gone (see the astro:after-swap
 * handler below), so reading the document would report the wrong answer at
 * exactly the moment it matters.
 */
function resolveTheme(): Theme {
    return storedTheme() ?? systemTheme();
}

/** Put a theme on screen, without recording it as a choice. */
function paintTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;

    const dark = theme === 'dark';
    for (const toggle of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
        toggle.setAttribute('aria-checked', String(dark));
    }
    const checkbox = document.querySelector<HTMLInputElement>('#darkmode');
    if (checkbox) checkbox.checked = dark;
}

/** Record an explicit choice and show it. */
function chooseTheme(theme: Theme): void {
    localStorage.setItem(THEME_KEY, theme);
    paintTheme(theme);
}

function setupTheme(): void {
    paintTheme(resolveTheme());

    for (const toggle of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
        if (toggle.dataset.themeBound) continue;
        toggle.dataset.themeBound = 'true';

        const toggleTheme = (event: Event) => {
            event.preventDefault();
            chooseTheme(resolveTheme() === 'dark' ? 'light' : 'dark');
        };

        toggle.addEventListener('click', toggleTheme);
        toggle.addEventListener('keydown', (event) => {
            if (event.key === ' ' || event.key === 'Enter') toggleTheme(event);
        });
    }
}

/** Follow the OS setting until the reader makes an explicit choice. */
function setupSystemThemeWatch(): void {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', (event) => {
        // paintTheme, not chooseTheme: following the OS must not harden into a
        // stored preference, or the next OS change would be ignored.
        if (storedTheme() === null) paintTheme(event.matches ? 'dark' : 'light');
    });
}

/**
 * Repaint the theme after every soft navigation.
 *
 * Astro's ClientRouter calls swapRootAttributes(), which strips *every*
 * attribute off <html> and copies the incoming document's attributes over.
 * `data-theme` only exists at runtime — the inline head script sets it, and
 * that script is keyed by its text content and marked as already-executed, so
 * it never runs again. Without this the attribute is silently destroyed on
 * every navigation and the page reverts to the light palette.
 *
 * astro:after-swap fires after the swap but before the browser paints, so
 * restoring it here produces no flash.
 */
function setupThemePersistence(): void {
    document.addEventListener('astro:after-swap', () => paintTheme(resolveTheme()));
}

function setupNavigation(): void {
    const nav = document.querySelector<HTMLElement>('[data-navigation]');
    if (!nav || nav.dataset.navBound) return;
    nav.dataset.navBound = 'true';

    const toggle = nav.querySelector<HTMLButtonElement>('[data-navigation-toggle]');
    const panel = nav.querySelector<HTMLElement>('[data-navigation-panel]');
    const label = nav.querySelector<HTMLElement>('[data-navigation-label]');
    if (!toggle || !panel) return;

    const setOpen = (open: boolean) => {
        panel.dataset.open = String(open);
        toggle.setAttribute('aria-expanded', String(open));
        if (label) label.textContent = open ? label.dataset.close! : label.dataset.open!;
    };

    toggle.addEventListener('click', () => setOpen(panel.dataset.open !== 'true'));

    // Escape closes, and so does following a link — the panel is a drawer on
    // small screens and would otherwise stay open across a soft navigation.
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false);
    });
    for (const link of panel.querySelectorAll('a')) {
        link.addEventListener('click', () => setOpen(false));
    }
}

function setupBackToTop(): void {
    const button = document.querySelector<HTMLElement>('[data-back-to-top]');
    if (!button) return;

    const update = () => {
        button.style.display = window.scrollY > 400 ? 'flex' : 'none';
    };

    if (!button.dataset.backToTopBound) {
        button.dataset.backToTopBound = 'true';
        button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        window.addEventListener('scroll', update, { passive: true });
    }
    update();
}

/**
 * Send outbound links to a new tab.
 *
 * `rel` gains `noopener` for the usual reason and `noreferrer` so affiliate and
 * analytics destinations don't receive the referring URL.
 */
function setupExternalLinks(): void {
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
        'a[href^="https://"], a[href^="http://"]'
    )) {
        if (link.hostname === window.location.hostname) continue;
        link.target = '_blank';
        link.rel = link.rel ? `${link.rel} noopener noreferrer` : 'noopener noreferrer';
    }
}

function init(): void {
    setupTheme();
    setupNavigation();
    setupBackToTop();
    setupExternalLinks();
}

init();
// Registered once, at module scope — the module is not re-evaluated on swap.
setupSystemThemeWatch();
setupThemePersistence();

// ClientRouter swaps the document body on navigation; re-bind against the new DOM.
document.addEventListener('astro:page-load', init);
