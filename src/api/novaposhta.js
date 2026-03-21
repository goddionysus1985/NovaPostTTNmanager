/**
 * Nova Poshta API v2 Wrapper
 * Endpoint: https://api.novaposhta.ua/v2.0/json/
 * Uses Vite proxy (/api) on localhost, direct URL in production (GitHub Pages)
 */

import { withCache, cacheClear } from '../utils/cache.js';

const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? '/api' : 'https://api.novaposhta.ua/v2.0/json/';

/** Clear all cached API responses (useful after API key change) */
export function clearApiCache() {
    cacheClear();
}

function getApiKey() {
    return localStorage.getItem('np_api_key') || '';
}

export function setApiKey(key) {
    localStorage.setItem('np_api_key', key);
}

export function hasApiKey() {
    return !!getApiKey();
}

async function apiCall(modelName, calledMethod, methodProperties = {}) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API ключ не встановлено. Перейдіть до Налаштувань.');

    const body = {
        apiKey,
        modelName,
        calledMethod,
        methodProperties,
    };

    const maskedBody = { ...body, apiKey: apiKey.substring(0, 4) + '****************' };
    console.log(`[NP API] → ${modelName}.${calledMethod}`, maskedBody);

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    // Try to read body even on error responses
    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    console.log(`[NP API] ← ${modelName}.${calledMethod} [${res.status}]`, data);

    if (!res.ok) {
        // Try to extract error message from response body
        const bodyErrors = data?.errors?.join('; ') || data?.warnings?.join('; ') || '';
        const msg = bodyErrors || `HTTP ${res.status}: ${res.statusText}`;
        if (res.status === 401) {
            throw new Error(`Невірний API ключ або доступ заборонено. Перевірте ключ в Налаштуваннях. (${msg})`);
        }
        throw new Error(msg);
    }

    if (!data?.success) {
        const errors = data?.errors?.join('; ') || data?.warnings?.join('; ') || 'Невідома помилка';
        throw new Error(errors);
    }

    return data;
}

/**
 * Wrapper for API calls with persistent localStorage caching.
 * @param {string} modelName 
 * @param {string} calledMethod 
 * @param {object} methodProperties 
 * @param {number} ttlMs Time to live in milliseconds (default 5 minutes)
 * @returns {Promise<any>}
 */
async function cachedApiCall(modelName, calledMethod, methodProperties = {}, ttlMs = 5 * 60 * 1000) {
    const cacheKey = `np_${modelName}_${calledMethod}_${JSON.stringify(methodProperties)}`;
    return withCache(cacheKey, () => apiCall(modelName, calledMethod, methodProperties), ttlMs);
}

/* ========================================
   Address Methods
   ======================================== */

/**
 * Search settlements (cities) by query
 */
export async function searchSettlements(query, limit = 20) {
    const data = await cachedApiCall('Address', 'searchSettlements', {
        CityName: query,
        Limit: String(limit),
        Page: '1',
    });
    return data.data?.[0]?.Addresses || [];
}

/**
 * Get warehouses (departments, postomats) by city
 */
export async function getWarehouses(cityRef, searchQuery = '', typeOfWarehouseRef = '', page = 1) {
    const props = { CityRef: cityRef };
    if (searchQuery) props.FindByString = searchQuery;
    if (typeOfWarehouseRef) props.TypeOfWarehouseRef = typeOfWarehouseRef;
    props.Limit = '200';
    props.Page = String(page);
    // Use shorter TTL when a search query is active (more dynamic results)
    const ttl = searchQuery ? 2 * 60 * 1000 : 10 * 60 * 1000;
    const data = await cachedApiCall('Address', 'getWarehouses', props, ttl);
    return data.data || [];
}

/**
 * Get streets by city
 */
export async function getStreet(cityRef, query) {
    const data = await cachedApiCall('Address', 'getStreet', {
        CityRef: cityRef,
        FindByString: query,
        Limit: '20',
        Page: '1',
    });
    return data.data || [];
}

/**
 * Save counterparty address
 * @param {object} params CounterpartyRef, StreetRef, BuildingNumber, Flat
 */
export async function saveAddress(params) {
    const data = await apiCall('Address', 'save', params);
    return data.data?.[0] || null;
}

/**
 * Get all areas (oblasts)
 */
export async function getAreas() {
    const data = await apiCall('Address', 'getAreas', {});
    return data.data || [];
}

/* ========================================
   Counterparty Methods
   ======================================== */

/**
 * Get sender counterparties
 */
export async function getSenderCounterparties() {
    const data = await cachedApiCall('Counterparty', 'getCounterparties', {
        CounterpartyProperty: 'Sender',
        Page: '1',
    });
    return data.data || [];
}

/**
 * Get contact persons for a counterparty
 */
export async function getCounterpartyContactPersons(counterpartyRef) {
    const data = await cachedApiCall('Counterparty', 'getCounterpartyContactPersons', {
        Ref: counterpartyRef,
        Page: '1',
    });
    return data.data || [];
}

/**
 * Get counterparty addresses (sender addresses)
 */
export async function getCounterpartyAddresses(counterpartyRef, counterpartyProperty = 'Sender') {
    const data = await cachedApiCall('Counterparty', 'getCounterpartyAddresses', {
        Ref: counterpartyRef,
        CounterpartyProperty: counterpartyProperty,
    });
    return data.data || [];
}

/**
 * Create a new counterparty (recipient)
 * For PrivatePerson: FirstName, MiddleName, LastName, Phone, CounterpartyType, CounterpartyProperty
 * For Organization (FOP): CounterpartyType: 'Organization', EDRPOU, OwnershipForm
 */
export async function createCounterparty(params) {
    const data = await apiCall('Counterparty', 'save', {
        ...params,
        CounterpartyProperty: params.CounterpartyProperty || 'Recipient',
    });
    return data.data?.[0] || null;
}

/**
 * Create a contact person for a counterparty
 */
export async function createContactPerson(params) {
    const data = await apiCall('ContactPerson', 'save', params);
    return data.data?.[0] || null;
}

/**
 * Find counterparty by EDRPOU code
 */
export async function getCounterpartyByEDRPOU(edrpou) {
    const data = await apiCall('Counterparty', 'getCounterpartyByEDRPOU', {
        EDRPOU: edrpou,
    });
    return data.data || [];
}

/* ========================================
   InternetDocument (TTN) Methods
   ======================================== */

/**
 * Create TTN (save internet document)
 */
export async function createTTN(params) {
    const data = await apiCall('InternetDocument', 'save', params);
    if (data.success) cacheClear(); // clear cache so new TTN shows up
    return data.data?.[0] || null;
}

/**
 * Get list of created TTNs
 */
export async function getDocumentList(dateFrom = '', dateTo = '', page = 1) {
    const props = { Page: String(page), GetFullList: '0' };
    if (dateFrom) props.DateTimeFrom = dateFrom;
    if (dateTo) props.DateTimeTo = dateTo;
    
    // Cache for 30s to prevent 'Too Many Requests' during rapid navigation
    const data = await cachedApiCall('InternetDocument', 'getDocumentList', props, 30000);
    return { documents: data.data || [], info: data.info || {} };
}

/**
 * Delete a TTN
 */
export async function deleteTTN(docRef) {
    const data = await apiCall('InternetDocument', 'delete', {
        DocumentRefs: docRef,
    });
    if (data.success) cacheClear(); // clear cache so deleted TTN is removed from list
    return data.data || [];
}

/**
 * Get estimated delivery cost
 */
export async function getDocumentPrice(params) {
    const data = await apiCall('InternetDocument', 'getDocumentPrice', params);
    return data.data?.[0] || null;
}

/**
 * Get estimated delivery date
 */
export async function getDocumentDeliveryDate(citySender, cityRecipient, serviceType, dateTime) {
    const data = await apiCall('InternetDocument', 'getDocumentDeliveryDate', {
        CitySender: citySender,
        CityRecipient: cityRecipient,
        ServiceType: serviceType,
        DateTime: dateTime,
    });
    return data.data?.[0] || null;
}

/* ========================================
   Tracking Methods
   ======================================== */

/**
 * Track document(s) by TTN number(s)
 */
export async function trackDocument(documentNumber, phone = '') {
    const data = await apiCall('TrackingDocument', 'getStatusDocuments', {
        Documents: [
            { DocumentNumber: documentNumber, Phone: phone },
        ],
    });
    return data.data?.[0] || null;
}

/* ========================================
   Common / Reference Methods
   ======================================== */

/**
 * Get list of cargo descriptions
 */
export async function getCargoDescriptionList(query = '') {
    const props = { Page: '1' };
    if (query) props.FindByString = query;
    const data = await cachedApiCall('Common', 'getCargoDescriptionList', props);
    return data.data || [];
}

/**
 * Get ownership forms list (for FOP)
 */
export async function getOwnershipFormsList() {
    const data = await apiCall('Common', 'getOwnershipFormsList', {});
    return data.data || [];
}

/**
 * Get service types
 */
export async function getServiceTypes() {
    const data = await apiCall('Common', 'getServiceTypes', {});
    return data.data || [];
}

/**
 * Get types of payers
 */
export async function getTypesOfPayers() {
    const data = await apiCall('Common', 'getTypesOfPayers', {});
    return data.data || [];
}

/**
 * Get payment forms
 */
export async function getPaymentForms() {
    const data = await apiCall('Common', 'getPaymentForms', {});
    return data.data || [];
}

/**
 * Get cargo types
 */
export async function getCargoTypes() {
    const data = await apiCall('Common', 'getCargoTypes', {});
    return data.data || [];
}

/**
 * Get pallet list
 */
export async function getPalletsList() {
    const data = await apiCall('Common', 'getPalletsList', {});
    return data.data || [];
}

/**
 * Get backward delivery cargo types
 */
export async function getBackwardDeliveryCargoTypes() {
    const data = await apiCall('Common', 'getBackwardDeliveryCargoTypes', {});
    return data.data || [];
}

/**
 * Get time intervals for address delivery
 */
export async function getTimeIntervals(cityRef, dateTime) {
    const data = await apiCall('Common', 'getTimeIntervals', {
        RecipientCityRef: cityRef,
        DateTime: dateTime,
    });
    return data.data || [];
}

/**
 * Generate print link for TTN (A4 PDF or Marking 100x100)
 * @param {string} docNumber - The TTN number (IntDocNumber), e.g. 20450000012345
 * @param {string} type - 'pdf' for A4, 'pdf8' for 85x85, 'html' for HTML
 */
export function getPrintUrl(docNumber, type = 'pdf') {
    const apiKey = getApiKey();
    // Use a proxy or server-side redirect if possible, but at least avoid logging this URL
    return `https://my.novaposhta.ua/orders/printDocument/orders/${docNumber}/type/${type}/apiKey/${apiKey}`;
}

/**
 * Generate print link for multiple TTNs
 * @param {string[]} docNumbers - Array of TTN numbers
 * @param {string} type - 'pdf' for A4, 'pdf8' for 85x85
 */
export function getPrintUrlBatch(docNumbers, type = 'pdf') {
    const apiKey = getApiKey();
    const numbers = docNumbers.join(',');
    return `https://my.novaposhta.ua/orders/printDocument/orders/${numbers}/type/${type}/apiKey/${apiKey}`;
}

/**
 * Generate marking (sticker) print link for TTN
 * @param {string} docNumber - The TTN number
 */
export function getPrintMarkingUrl(docNumber) {
    const apiKey = getApiKey();
    return `https://my.novaposhta.ua/orders/printMarkings/orders/${docNumber}/type/pdf/apiKey/${apiKey}`;
}

/**
 * Batch marking print
 */
export function getPrintMarkingUrlBatch(docNumbers) {
    const apiKey = getApiKey();
    const numbers = docNumbers.join(',');
    return `https://my.novaposhta.ua/orders/printMarkings/orders/${numbers}/type/pdf/apiKey/${apiKey}`;
}
