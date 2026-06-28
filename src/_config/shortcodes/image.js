const Image = require('@11ty/eleventy-img');
const fs = require('node:fs');
const path = require('node:path');

function resolveImageSource(src) {
    const sourcePath = path.join('.', 'src', src);
    if (fs.existsSync(sourcePath)) {
        return sourcePath;
    }

    const directory = path.dirname(sourcePath);
    const filename = path.basename(sourcePath);
    if (!fs.existsSync(directory)) {
        return sourcePath;
    }

    const caseInsensitiveMatch = fs
        .readdirSync(directory)
        .find((entry) => entry.toLowerCase() === filename.toLowerCase());

    return caseInsensitiveMatch ? path.join(directory, caseInsensitiveMatch) : sourcePath;
}

module.exports = async function(src, alt, sizes, caption = '', classes = '', loading = 'lazy', fetch = 'auto', decoding = 'async') {
    const settings = this.ctx.settings;
    const imageSource = resolveImageSource(src);
    let meta = {};
    let metadata = {
        // set your required image sizes here
        widths: [300, 600, 1200, 2400, 'auto'],
        urlPath: '/assets/img/',
        outputDir: './dist/assets/img/',
        sharpWebpOptions: {
            options: {
                quality: 70,
            },
        }
    };

    if (( settings.isProduction || settings.isStaging ) && settings.cdn ) {
        meta = await Image(imageSource, {
                ...metadata,
                formats: ['webp', 'auto'],
                urlFormat: function({width}) {
                    return `//i0.wp.com/${settings.url.replace(/^https?:\/\//, '')}${src}?w=${width}&quality=70&strip=info`;
                }
            }
        );
    } else {
        meta = await Image(imageSource, {
            ...metadata,
            formats: ['avif', 'webp', 'auto']
        });
    }

    let imageAttributes = {
        class: classes,
        alt,
        sizes,
        loading,
        fetch,
        decoding
    };
    
    const generated = Image.generateHTML(meta, imageAttributes);
    const affiliateText = '<div class="bottom-left-text">Like our photos? Find them on <a href="https://www.shutterstock.com/g/danielaasada" target="_blank">Shutter</a><a href="https://www.shutterstock.com/g/willtheorangeguy" target="_blank">stock</a>.</div>';
    if (caption) {
        return `<figure>${generated}<figcaption>${caption}</figcaption>${affiliateText}</figure>`;
    }
    return `<figure>${generated}</figure>`;
};