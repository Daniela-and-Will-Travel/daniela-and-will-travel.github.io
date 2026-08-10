/**
 * The site's entire client-side behaviour, replacing Alpine.js and the four
 * inline <script> blocks the Eleventy templates carried around.
 *
 * Every setup function is idempotent and re-runs after a view transition swap,
 * because the ClientRouter replaces <body> without re-running module scripts.
 */

type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

function currentTheme(): Theme {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    syncToggles();
}

function syncToggles(): void {
    const dark = currentTheme() === 'dark';
    for (const toggle of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
        toggle.setAttribute('aria-checked', String(dark));
    }
    const checkbox = document.querySelector<HTMLInputElement>('#darkmode');
    if (checkbox) checkbox.checked = dark;
}

function setupTheme(): void {
    syncToggles();

    for (const toggle of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
        if (toggle.dataset.themeBound) continue;
        toggle.dataset.themeBound = 'true';

        const toggleTheme = (event: Event) => {
            event.preventDefault();
            applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
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
        if (localStorage.getItem(THEME_KEY) !== null) return;
        document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
        syncToggles();
    });
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
setupSystemThemeWatch();

// ClientRouter swaps the document body on navigation; re-bind against the new DOM.
document.addEventListener('astro:page-load', init);
