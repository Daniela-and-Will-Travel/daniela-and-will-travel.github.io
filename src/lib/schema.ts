// Shared Schema.org builders.
//
// The blog's strongest E-E-A-T signal is that two identifiable people went to
// these places, and until now that was asserted in prose and only half-asserted
// in markup: `author` was a bare `{ "@type": "Person", "name": "Daniela" }` with
// nothing to resolve it against. These helpers give every person and collection
// a stable `@id`, so the About page, each post's byline and the Organization all
// describe the same entities rather than repeating look-alike names.

import { authorsByName, people, settings } from '@data/settings.js';
import { absoluteUrl } from './i18n';

interface PersonSettings {
    id: string;
    name: string;
    jobTitle: string;
    path: string;
    sameAs: string[];
}

/** Canonical `@id` for a person, so every reference points at one node. */
export function personId(person: PersonSettings): string {
    return absoluteUrl(person.path, settings.url);
}

/** A full Person node, for the page that actually describes them. */
export function personSchema(person: PersonSettings) {
    return {
        '@type': 'Person',
        '@id': personId(person),
        name: person.name,
        jobTitle: person.jobTitle,
        url: absoluteUrl(person.path, settings.url),
        sameAs: person.sameAs
    };
}

/**
 * The `author` value for a post.
 *
 * Front matter carries a display name ("Daniela", "Will", "Daniela and Will");
 * a co-written post resolves to both people, which schema.org allows as an
 * array. An unrecognised name degrades to the old bare-Person shape rather than
 * failing the build, so adding a guest writer doesn't break the site before
 * anyone has added them to settings.
 */
export function authorSchema(author?: string) {
    const matched = author ? authorsByName[author as keyof typeof authorsByName] : undefined;

    if (!matched) {
        return { '@type': 'Person', name: author ?? settings.author.name };
    }

    const nodes = matched.map(personSchema);
    return nodes.length === 1 ? nodes[0] : nodes;
}

/** Both people, for the About page and the Organization's `founder`. */
export function allPeople() {
    return [people.daniela, people.will].map(personSchema);
}

export interface CollectionItem {
    url: string;
    name: string;
}

/**
 * A listing page — a tag archive, the countries hub — as a CollectionPage
 * wrapping an ItemList. Without it these read as ordinary pages that happen to
 * contain links, and the relationship between the hub and what it collects is
 * left for a crawler to infer.
 */
export function collectionPageSchema(options: {
    name: string;
    description?: string;
    url: string;
    lang: string;
    items: CollectionItem[];
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: options.name,
        description: options.description,
        url: options.url,
        inLanguage: options.lang,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Daniela and Will Travel',
            url: settings.url
        },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: options.items.length,
            itemListElement: options.items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: item.url,
                name: item.name
            }))
        }
    };
}
