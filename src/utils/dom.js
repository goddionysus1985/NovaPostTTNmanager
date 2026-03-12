/**
 * DOM Utilities for security and sanitization
 */

/**
 * Escapes characters that are special to HTML.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') {
        if (str === null || str === undefined) return '';
        str = String(str);
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * A template literal tag to automatically escape values
 */
export function html(strings, ...values) {
    return strings.reduce((acc, str, i) => {
        const value = values[i];
        const sanitized = Array.isArray(value)
            ? value.join('')
            : (value !== undefined && value !== null ? escapeHTML(value) : '');
        return acc + str + sanitized;
    }, '');
}
