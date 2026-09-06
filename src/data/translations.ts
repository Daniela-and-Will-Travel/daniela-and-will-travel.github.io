import type { Lang } from './locales';

// UI strings, one tree per language. Values may contain `{{ name }}`
// placeholders, filled in by the `t()` helper in src/lib/i18n.ts.
//
// A handful of these (`footer.builtWith`, every `notice.*`) contain markup and
// are rendered with set:html at the call site.

export const translations = {
    en: {
        meta: {
            title: 'Daniela and Will Travel',
            rssTitle: 'RSS Feed',
            jsonTitle: 'JSON Feed',
            description:
                "Daniela and Will's travel blog featuring travel guides and tips and tricks for a gap year throughout Europe.",
            opengraphDefaultAlt:
                'Daniela and Will Travel — travel guides from Europe and Southeast Asia.'
        },
        header: {
            skipLink: 'Skip to content',
            home: 'Home',
            menu: 'Menu',
            close: 'Close'
        },
        readingTime: {
            underMinute: 'Less than 1 minute to read',
            minute: '1 minute to read',
            other: '{{ minutes }} minutes to read'
        },
        feeds: {
            info: 'This is an RSS feed. Copy and paste the URL into your feed reader. Visit <a href="https://aboutfeeds.com">About Feeds</a> to learn more about RSS.',
            title: 'Recently Published'
        },
        footer: {
            tagline:
                "Travel guides, itineraries and honest advice from nine months across Europe and four months through Southeast Asia — so you don't make the same mistakes we did.",
            explore: 'Explore',
            smallPrint: 'The Small Print',
            affiliates: 'Affiliate Disclosure',
            privacy: 'Privacy Policy',
            terms: 'Terms of Use',
            doNotSell: 'Do Not Sell My Info',
            styleGuide: 'Style Guide',
            builtWith:
                'Built with <a href="https://astro.build/">Astro</a>. Icons by <a href="https://fontawesome.com/">Font Awesome</a>.'
        },
        post: {
            by: 'By {{ author }}',
            tripDuration: 'Trip length',
            tripSeason: 'Best time to go',
            tripBudget: 'What we spent',
            tripRoute: 'Route',
            affiliateNotice:
                'This post may contain affiliate links, which help support us at no cost to you! Learn&nbsp;more',
            affiliateLink: 'here',
            relatedEyebrow: 'Keep reading',
            relatedTitle: 'More travel guides',
            backToTop: 'Back to top'
        },
        tags: {
            eyebrow: 'Tag',
            metaDescription:
                'Every guide, itinerary and honest budget we have published about {{ tag }}, written from our own trips across Europe and Southeast Asia.',
            count: '{{ count }} guides tagged {{ tag }}.',
            countOne: '1 guide tagged {{ tag }}.',
            browseEyebrow: 'Browse',
            browseTitle: 'Every tag'
        },
        notFound: {
            eyebrow: 'Error 404',
            title: "This one's off the map",
            lede: 'Sorry, the page you were looking for could not be found. It may have moved, or the link may be out of date.',
            home: 'Back to the homepage',
            destinations: 'Browse destinations'
        },
        theme: {
            toggle: 'Toggle dark/light theme',
            dark: 'Dark',
            light: 'Light'
        }
    },

    es: {
        meta: {
            title: 'Daniela y Will Travel',
            rssTitle: 'RSS Feed',
            jsonTitle: 'JSON Feed',
            description:
                'El blog de viajes de Daniela y Will con guías de viaje y consejos para un año sabático por Europa.',
            opengraphDefaultAlt:
                'Daniela y Will Travel — guías de viaje de Europa y el Sudeste Asiático.'
        },
        header: {
            skipLink: 'Saltar al contenido',
            home: 'Inicio',
            menu: 'Menú',
            close: 'Cerrar'
        },
        readingTime: {
            underMinute: 'Menos de 1 minuto para leer',
            minute: '1 minuto para leer',
            other: '{{ minutes }} minutos para leer'
        },
        feeds: {
            info: 'Este es un feed RSS. Copia y pega la URL en tu lector de feeds. Visita <a href="https://aboutfeeds.com">About Feeds</a> para obtener más información sobre RSS.',
            title: 'Publicado Recientemente'
        },
        footer: {
            tagline:
                'Guías de viaje, itinerarios y consejos honestos de nueve meses por Europa y cuatro meses por el Sudeste Asiático — para que no cometas los mismos errores que nosotros.',
            explore: 'Explorar',
            smallPrint: 'La Letra Pequeña',
            affiliates: 'Divulgación de Afiliados',
            privacy: 'Política de Privacidad',
            terms: 'Términos de Uso',
            doNotSell: 'No Vendan Mi Información',
            styleGuide: 'Guía de Estilo',
            builtWith:
                'Hecho con <a href="https://astro.build/">Astro</a>. Iconos de <a href="https://fontawesome.com/">Font Awesome</a>.'
        },
        post: {
            by: 'Por {{ author }}',
            tripDuration: 'Duración del viaje',
            tripSeason: 'Mejor época para ir',
            tripBudget: 'Lo que gastamos',
            tripRoute: 'Ruta',
            affiliateNotice:
                'Esta publicación puede contener enlaces de afiliados, que nos ayudan sin ningún costo para ti. Más&nbsp;información',
            affiliateLink: 'aquí',
            relatedEyebrow: 'Sigue leyendo',
            relatedTitle: 'Más guías de viaje',
            backToTop: 'Volver arriba'
        },
        tags: {
            eyebrow: 'Etiqueta',
            metaDescription:
                'Todas las guías, itinerarios y presupuestos que hemos publicado sobre {{ tag }}, escritos desde nuestros propios viajes por Europa y Asia.',
            count: '{{ count }} guías etiquetadas {{ tag }}.',
            countOne: '1 guía etiquetada {{ tag }}.',
            browseEyebrow: 'Explorar',
            browseTitle: 'Todas las etiquetas'
        },
        notFound: {
            eyebrow: 'Error 404',
            title: 'Esta página está fuera del mapa',
            lede: 'Lo sentimos, no pudimos encontrar la página que buscabas. Puede que se haya movido o que el enlace esté desactualizado.',
            home: 'Volver al inicio',
            destinations: 'Ver destinos'
        },
        theme: {
            toggle: 'Cambiar entre tema claro y oscuro',
            dark: 'Oscuro',
            light: 'Claro'
        }
    }
} as const satisfies Record<Lang, unknown>;

export type Translations = (typeof translations)['en'];
