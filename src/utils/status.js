/**
 * Status utilities — shared across Dashboard, Documents, Tracking pages.
 * Single source of truth for TTN status color mapping.
 */

/**
 * Map a StateName string (Ukrainian NP status) to a CSS class.
 * @param {string|undefined} stateName
 * @returns {'delivered'|'in-transit'|'new'|'problem'|''}
 */
export function getStatusClass(stateName) {
    if (!stateName) return '';
    if (stateName.includes('Отримана') || stateName.includes('Виконано')) return 'delivered';
    if (stateName.includes('дорозі') || stateName.includes('Прямує')) return 'in-transit';
    if (stateName.includes('Прибув')) return 'in-transit';
    if (stateName.includes('Нова') || stateName.includes('Створена')) return 'new';
    if (stateName.includes('Проблем') || stateName.includes('Відмова')) return 'problem';
    return 'new';
}

/**
 * Map a numeric NP StatusCode to a CSS class (used by Tracking page).
 * @param {string|number} code
 * @returns {'delivered'|'in-transit'|'new'|'problem'|''}
 */
export function getStatusClassByCode(code) {
    const c = parseInt(code);
    if (c === 9 || c === 10 || c === 11) return 'delivered';
    if (c >= 4 && c <= 8) return 'in-transit';
    if (c >= 1 && c <= 3) return 'new';
    if (c >= 100) return 'problem';
    return 'new';
}
