// Resolve the `/assets/img/...` paths used throughout the content back to real
// image modules, so astro:assets can optimize them.
//
// Two wrinkles this has to absorb, both inherited from the Eleventy site:
//
//  1. Posts reference images by their published URL (`/assets/img/foo.jpg`),
//     not by a relative import. A glob index keeps that authoring style working.
//  2. Case drifted years ago — a lot of files on disk are `.JPG`/`.JPEG` while
//     the markdown asks for `.jpg`/`.jpeg`. The old shortcode papered over this
//     with a case-insensitive directory scan; the index below is keyed on the
//     lowercased path for the same reason.
//
// The glob is deliberately lazy: only images actually rendered get pulled into
// the build, so the 60-odd source photos don't all get re-encoded every time.

type ImageLoader = () => Promise<{ default: ImageMetadata }>;

const modules = import.meta.glob<{ default: ImageMetadata }>(
    '/src/assets/img/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}'
);

const index = new Map<string, ImageLoader>();
for (const [path, loader] of Object.entries(modules)) {
    index.set(path.toLowerCase(), loader as ImageLoader);
}

/** '/assets/img/posts/asia/cover.jpg' → '/src/assets/img/posts/asia/cover.jpg' */
function toModulePath(src: string): string {
    if (src.startsWith('/src/assets/')) return src;
    if (src.startsWith('/assets/')) return `/src/assets${src.slice('/assets'.length)}`;
    return src;
}

export async function resolveImage(src: string): Promise<ImageMetadata> {
    const loader = index.get(toModulePath(src).toLowerCase());

    if (!loader) {
        throw new Error(
            `Image not found: "${src}". Expected a file under src/assets/img matching ${toModulePath(src)} (case-insensitive).`
        );
    }

    return (await loader()).default;
}

/**
 * The candidate widths for a srcset, clamped to the source image — Astro will
 * not upscale, so asking for 2400px from a 1200px original is an error. The
 * intrinsic width is always included so the largest srcset entry is the
 * sharpest the original can actually deliver.
 *
 * The 300/600/1200/2400 ladder came over from the Eleventy shortcode and was
 * too sparse for the current layout: a card renders around 362 CSS px, so on a
 * 2x screen the browser wants ~700px, finds nothing between 600 and 1200, and
 * takes the 1200 — roughly twice the bytes it needs. The 400/640/800 rungs
 * exist to be picked at those sizes.
 */
export function responsiveWidths(
    image: ImageMetadata,
    widths = [300, 400, 640, 800, 1200, 2400]
): number[] {
    const usable = widths.filter((width) => width < image.width);
    return [...new Set([...usable, image.width])].sort((a, b) => a - b);
}
