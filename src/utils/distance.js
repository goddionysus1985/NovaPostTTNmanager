/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Find the nearest branches of a specific type.
 * @param {Object} sourceWarehouse - The reference warehouse
 * @param {Array} allWarehouses - List of all warehouses
 * @param {string} filterType - Type of warehouse (e.g. 'Cargo', 'Post')
 * @param {number} limit - Number of nearest branches to return
 * @returns {Array} Sorted list of nearest branches
 */
export function findNearestBranches(sourceWarehouse, allWarehouses, filterType = 'Cargo', limit = 3) {
    if (!sourceWarehouse || !sourceWarehouse.Latitude || !sourceWarehouse.Longitude) return [];

    const isCargo = (w) => {
        if (w.CategoryOfWarehouse === 'Cargo' || w.Description.toLowerCase().includes('вантажне')) return true;
        const maxWeight = parseInt(w.TotalMaxWeightAllowed);
        return !isNaN(maxWeight) && (maxWeight > 30 || maxWeight === 0);
    };

    // NP API uses 'CategoryOfWarehouse' to distinguish types.
    // E.g., 'Branch' (Поштове відділення), 'Postomat' (Поштомат), 'Cargo' (Вантажне відділення).

    const sLat = parseFloat(sourceWarehouse.Latitude);
    const sLon = parseFloat(sourceWarehouse.Longitude);

    const candidates = allWarehouses.filter(w => {
        if (w.Ref === sourceWarehouse.Ref) return false;
        if (!w.Latitude || !w.Longitude) return false;

        if (filterType === 'Cargo') {
            return isCargo(w);
        }
        if (filterType === 'Post') {
            return !isCargo(w) && w.CategoryOfWarehouse !== 'Postomat'; // optionally exclude postomats from 'post' search if needed, but let's just make sure it's not cargo
        }
        return true;
    });

    const withDistances = candidates.map(w => ({
        ...w,
        distance: calculateDistance(sLat, sLon, parseFloat(w.Latitude), parseFloat(w.Longitude))
    }));

    withDistances.sort((a, b) => a.distance - b.distance);

    return withDistances.slice(0, limit);
}
