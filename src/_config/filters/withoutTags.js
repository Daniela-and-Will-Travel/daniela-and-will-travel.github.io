// strip the structural tags Eleventy adds so only editorial tags are shown
// {% set postTags = tags | withoutTags %}
const STRUCTURAL = ['posts', 'page', 'home', 'all'];

module.exports = function (tags, extra = []) {
    if (!tags) return [];
    const list = Array.isArray(tags) ? tags : [tags];
    const removed = STRUCTURAL.concat(extra);
    return list.filter((tag) => !removed.includes(tag));
};
