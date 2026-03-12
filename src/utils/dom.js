/**
 * DOM Utilities
 */

/**
 * Escapes characters that are special to HTML.
 * Use this explicitly when inserting user-provided data into HTML.
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
 * A simple template literal tag for HTML.
 * Values are inserted as-is. Use escapeHTML() explicitly for user data.
 */
export function html(strings, ...values) {
    return strings.reduce((acc, str, i) => {
        const value = values[i];
        const resolved = Array.isArray(value)
            ? value.join('')
            : (value !== undefined && value !== null ? String(value) : '');
        return acc + str + resolved;
    }, '');
}
