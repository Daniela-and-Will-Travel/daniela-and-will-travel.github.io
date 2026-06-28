const INFO_SVG = `<svg class="notice-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM288 224C288 206.3 302.3 192 320 192C337.7 192 352 206.3 352 224C352 241.7 337.7 256 320 256C302.3 256 288 241.7 288 224zM280 288L328 288C341.3 288 352 298.7 352 312L352 400L360 400C373.3 400 384 410.7 384 424C384 437.3 373.3 448 360 448L280 448C266.7 448 256 437.3 256 424C256 410.7 266.7 400 280 400L304 400L304 336L280 336C266.7 336 256 325.3 256 312C256 298.7 266.7 288 280 288z"/></svg>`;

const WARNING_SVG = `<svg class="notice-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true"><path d="M320 64C334.7 64 348.2 72.1 355.2 85L571.2 485C577.9 497.4 577.6 512.4 570.4 524.5C563.2 536.6 550.1 544 536 544L104 544C89.9 544 76.8 536.6 69.6 524.5C62.4 512.4 62.1 497.4 68.8 485L284.8 85C291.8 72.1 305.3 64 320 64zM320 416C302.3 416 288 430.3 288 448C288 465.7 302.3 480 320 480C337.7 480 352 465.7 352 448C352 430.3 337.7 416 320 416zM320 224C301.8 224 287.3 239.5 288.6 257.7L296 361.7C296.9 374.2 307.4 384 319.9 384C332.5 384 342.9 374.3 343.8 361.7L351.2 257.7C352.5 239.5 338.1 224 319.8 224z"/></svg>`;

module.exports = eleventyConfig => {
    eleventyConfig.addTransform('notices', (content, path) => {
        if (!path || !path.endsWith('.html')) return content;

        return content.replace(
            /<blockquote>\s*<p>(⚠|❕)\s*(Note|Warning|Tip):\s*([\s\S]*?)<\/p>\s*<\/blockquote>/g,
            (_match, _emoji, label, text) => {
                const isWarning = label === 'Warning';
                const cls = isWarning ? 'notice notice-warning' : 'notice';
                const svg = isWarning ? WARNING_SVG : INFO_SVG;
                return `<blockquote class="${cls}">\n<p>${svg}<span>${label}: ${text.trim()}</span></p>\n</blockquote>`;
            }
        );
    });
};
