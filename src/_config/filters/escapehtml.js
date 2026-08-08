// escape a chunk of markup so it can be shown as source in the style guide
// {{ markup | escapeHtml | safe }}
const ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

module.exports = function (value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/[&<>"']/g, (char) => ENTITIES[char])
        .trim();
};
