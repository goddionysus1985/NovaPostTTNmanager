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
 * A wrapper class to mark strings as safe HTML that shouldn't be escaped.
 */
export class SafeHTML {
    constructor(str) {
        this.value = str;
    }
    toString() {
        return this.value;
    }
}

/**
 * Marks a string as safe HTML.
 */
export function rawHtml(str) {
    return new SafeHTML(str);
}

/**
 * A template literal tag to automatically escape values
 */
export function html(strings, ...values) {
    return strings.reduce((acc, str, i) => {
        const value = values[i];
        
        let processedValue = '';
        if (value instanceof SafeHTML) {
            processedValue = value.toString();
        } else if (Array.isArray(value)) {
            processedValue = value.map(v => v instanceof SafeHTML ? v.toString() : escapeHTML(v)).join('');
        } else if (value !== undefined && value !== null) {
            processedValue = escapeHTML(value);
        }

        return acc + str + processedValue;
    }, '');
}
