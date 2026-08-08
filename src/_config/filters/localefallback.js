// Guarantee a URL carries a language prefix.
//
// EleventyI18nPlugin's `locale_url` only rewrites a URL when a version of that
// page exists in the current language — otherwise it hands the URL straight
// back. For pages that only exist in one language (the legal pages, for
// example) that produces an unprefixed, 404-ing link on every other locale.
//
// Chaining this filter after `locale_url` keeps the localized URL when there is
// one and falls back to the default language when there is not:
//
//   {{ "/affiliates/" | locale_url | localeFallback }}
//
// The day a Spanish version is added, `locale_url` resolves it and this filter
// leaves the result alone.
const locales = require('../../_data/locales');

const LANGUAGE_CODES = Object.keys(locales);

module.exports = function (url, fallback = 'en') {
    if (typeof url !== 'string' || !url.startsWith('/')) return url;

    const [firstSegment] = url.slice(1).split('/');
    if (LANGUAGE_CODES.includes(firstSegment)) return url;

    return `/${fallback}${url}`;
};
