/**
 * Persistent cache backed by localStorage with TTL support.
 * Falls back to in-memory map if localStorage is unavailable.
 */

const STORAGE_PREFIX = 'np_cache_';
const useLocalStorage = (() => {
    try {
        const k = '__np_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    } catch {
        return false;
    }
})();

// In-memory fallback
const memoryCache = new Map();

function storageKey(key) {
    return STORAGE_PREFIX + key;
}

/**
 * Get cached value by key.
 * Returns null if not found or expired.
 * @param {string} key
 * @returns {any|null}
 */
export function cacheGet(key) {
    const now = Date.now();

    if (useLocalStorage) {
        try {
            const raw = localStorage.getItem(storageKey(key));
            if (!raw) return null;
            const { data, expires } = JSON.parse(raw);
            if (expires && now > expires) {
                localStorage.removeItem(storageKey(key));
                return null;
            }
            return data;
        } catch {
            return null;
        }
    }

    // Fallback
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expires && now > entry.expires) {
        memoryCache.delete(key);
        return null;
    }
    return entry.data;
}

/**
 * Store a value in the cache.
 * @param {string} key
 * @param {any} data
 * @param {number} ttlMs - Time to live in ms. 0 = no expiry.
 */
export function cacheSet(key, data, ttlMs = 5 * 60 * 1000) {
    const expires = ttlMs > 0 ? Date.now() + ttlMs : 0;

    if (useLocalStorage) {
        try {
            localStorage.setItem(storageKey(key), JSON.stringify({ data, expires }));
            return;
        } catch (e) {
            // localStorage might be full — evict old entries and retry
            evictOldEntries();
            try {
                localStorage.setItem(storageKey(key), JSON.stringify({ data, expires }));
                return;
            } catch {
                // Give up, fall through to memory
            }
        }
    }

    memoryCache.set(key, { data, expires });
}

/**
 * Remove a specific key from cache.
 * @param {string} key
 */
export function cacheDelete(key) {
    if (useLocalStorage) {
        localStorage.removeItem(storageKey(key));
    } else {
        memoryCache.delete(key);
    }
}

/**
 * Clear all nova poshta cache entries.
 */
export function cacheClear() {
    if (useLocalStorage) {
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(STORAGE_PREFIX)) toDelete.push(k);
        }
        toDelete.forEach(k => localStorage.removeItem(k));
    } else {
        memoryCache.clear();
    }
}

/**
 * Remove all expired entries from localStorage.
 */
function evictOldEntries() {
    if (!useLocalStorage) return;
    const now = Date.now();
    const toDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(STORAGE_PREFIX)) continue;
        try {
            const { expires } = JSON.parse(localStorage.getItem(k));
            if (expires && now > expires) toDelete.push(k);
        } catch {
            toDelete.push(k);
        }
    }
    toDelete.forEach(k => localStorage.removeItem(k));
}

/**
 * High-level wrapper: get from cache or compute and store.
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 * @param {number} ttlMs
 * @returns {Promise<any>}
 */
export async function withCache(key, fetcher, ttlMs = 5 * 60 * 1000) {
    const cached = cacheGet(key);
    if (cached !== null) {
        console.log(`[Cache] HIT → ${key}`);
        return cached;
    }

    const data = await fetcher();
    cacheSet(key, data, ttlMs);
    return data;
}
