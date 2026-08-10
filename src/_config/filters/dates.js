// Front matter dates are bare `YYYY-MM-DD`, which Eleventy reads as UTC
// midnight. Formatting those in the build machine's local zone shifts every
// post a day earlier anywhere west of Greenwich, so format in UTC too.
const formatDate = function (date, format = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) {
    const d = new Date(date);
    const locale = this.ctx.locales[this.page.lang || this.ctx.lang].locale;
    return d.toLocaleDateString(locale, { timeZone: 'UTC', ...format });
}

module.exports = {
    formatDate
};