import { defineHastPlugin } from 'satteri';

/**
 * Turn marker blockquotes into styled callouts.
 *
 *   > ❕ Tip: Arrive at least one day before.
 *   > ⚠ Warning: The port is a long way outside town.
 *
 * becomes
 *
 *   <blockquote class="notice">
 *     <p><svg class="notice-icon">…</svg><span>Tip: Arrive at least one day before.</span></p>
 *   </blockquote>
 *
 * This replaces the Eleventy `notices` transform, which ran a regex over the
 * rendered HTML. Working on the tree instead means inline markup inside a
 * callout (links, emphasis) survives untouched — the old regex only worked
 * because it happened to capture the inner HTML as an opaque string, and it
 * silently skipped any callout whose text spanned two paragraphs.
 *
 * Authoring syntax is unchanged, so no post needed editing.
 */

const ICONS = {
    info: 'M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z',
    warning:
        'M320 64C334.7 64 348.2 72.1 355.2 85L571.2 485C577.9 497.4 577.6 512.4 570.4 524.5C563.2 536.6 550.1 544 536 544L104 544C89.9 544 76.8 536.6 69.6 524.5C62.4 512.4 62.1 497.4 68.8 485L284.8 85C291.8 72.1 305.3 64 320 64zM320 416C302.3 416 288 430.3 288 448C288 465.7 302.3 480 320 480C337.7 480 352 465.7 352 448C352 430.3 337.7 416 320 416zM320 224C301.8 224 287.3 239.5 288.6 257.7L296 361.7C296.9 374.2 307.4 384 319.9 384C332.5 384 342.9 374.3 343.8 361.7L351.2 257.7C352.5 239.5 338.1 224 319.8 224z'
};

// `⚠ Warning:` / `❕ Tip:` / `❕ Note:` at the very start of the quote.
const MARKER = /^\s*(?:⚠|❕)\s*(Note|Warning|Tip):\s*/;

function icon(kind) {
    return {
        type: 'element',
        tagName: 'svg',
        properties: {
            className: ['notice-icon'],
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 640 640',
            ariaHidden: 'true'
        },
        children: [
            { type: 'element', tagName: 'path', properties: { d: ICONS[kind] }, children: [] }
        ]
    };
}

/**
 * Copy a visited node into plain objects.
 *
 * Children arrive as lazy stubs bound to the Rust arena, and the resolver seals
 * once the pass ends — so they have to be read out here, while the plugin still
 * owns the tree, rather than handed straight to replaceNode().
 */
function toPlain(node) {
    if (!node || typeof node !== 'object') return node;

    if (node.type === 'element') {
        return {
            type: 'element',
            tagName: node.tagName,
            properties: { ...(node.properties ?? {}) },
            children: (node.children ?? []).map(toPlain)
        };
    }

    if (node.type === 'text' || node.type === 'raw' || node.type === 'comment') {
        return { type: node.type, value: node.value ?? '' };
    }

    // MDX expressions and anything else: shallow copy, recursing into children.
    const copy = { ...node };
    if (Array.isArray(node.children)) copy.children = node.children.map(toPlain);
    return copy;
}

export const noticesPlugin = defineHastPlugin({
    name: 'daniela-and-will/notices',

    element: {
        filter: ['blockquote'],

        visit(node, ctx) {
            const children = (node.children ?? []).map(toPlain);

            // The paragraph carrying the marker — skipping whitespace-only text
            // nodes the parser leaves between block children.
            const paragraph = children.find(
                (child) => child.type === 'element' && child.tagName === 'p'
            );
            if (!paragraph) return;

            const [firstChild] = paragraph.children ?? [];
            if (!firstChild || firstChild.type !== 'text') return;

            const match = MARKER.exec(firstChild.value);
            if (!match) return;

            const label = match[1];
            const kind = label === 'Warning' ? 'warning' : 'info';

            // Re-label in place: "❕ Tip: Arrive early" → "Tip: Arrive early".
            const body = paragraph.children.slice();
            body[0] = { type: 'text', value: `${label}: ${firstChild.value.slice(match[0].length)}` };

            // Anything after the marker paragraph (a second paragraph, a list)
            // stays inside the callout, after the labelled line.
            const rest = children.filter(
                (child) => child !== paragraph && !(child.type === 'text' && !child.value.trim())
            );

            ctx.replaceNode(node, {
                type: 'element',
                tagName: 'blockquote',
                properties: {
                    className: kind === 'warning' ? ['notice', 'notice-warning'] : ['notice']
                },
                children: [
                    {
                        type: 'element',
                        tagName: 'p',
                        properties: {},
                        children: [
                            icon(kind),
                            { type: 'element', tagName: 'span', properties: {}, children: body }
                        ]
                    },
                    ...rest
                ]
            });
        }
    }
});

export default noticesPlugin;
