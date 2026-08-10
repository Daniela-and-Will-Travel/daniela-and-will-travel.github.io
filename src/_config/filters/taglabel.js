// Turn a tag slug into the label shown on a pill or an archive heading.
// {{ 'southeast-asia' | tagLabel }} → 'Southeast Asia'
//
// Acronyms and other words that don't survive plain title casing go in the
// overrides map, keyed by the slug.
const OVERRIDES = {
    diy: 'DIY',
    rv: 'RV',
    seo: 'SEO',
    vpn: 'VPN'
};

module.exports = function (tag) {
    if (typeof tag !== 'string') return '';

    return tag
        .split('-')
        .map((word) => OVERRIDES[word] || word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
