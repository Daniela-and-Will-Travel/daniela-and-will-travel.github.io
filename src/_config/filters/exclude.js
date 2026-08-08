// remove the current page from a collection
// {% set related = collections.posts | exclude(page.url) %}
module.exports = function (collection, url) {
    if (!Array.isArray(collection)) return [];
    return collection.filter((item) => item.url !== url);
};
