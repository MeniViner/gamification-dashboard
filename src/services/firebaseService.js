import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Collection and document names
const COLLECTION_NAME = 'conference_data';
const UNITS_DOC = 'units';
const CONFIG_DOC = 'config';

// Debounce timer for writes
let writeDebounceTimer = null;
let pendingUnitsData = null;
let lastSavedJson = null;

/**
 * Save units data to Firestore with debouncing
 * @param {Array} unitsData - Array of unit objects
 * @param {boolean} immediate - Skip debouncing and save immediately
 * @returns {Promise<boolean>} - Success status
 */
export async function saveUnitsData(unitsData, immediate = false) {
    if (!isFirebaseConfigured() || !db) {
        console.warn('Firebase not configured, skipping save to Firestore');
        return false;
    }

    // Sanitize first to ensure consistent comparison
    const sanitizedDataForComparison = sanitizeForFirestore(unitsData);
    const currentJson = JSON.stringify(sanitizedDataForComparison);

    // Optimization: Skip save if data hasn't changed effectively
    if (lastSavedJson === currentJson) {
        // console.log('ℹ️ Skipping save - data unchanged');
        return true;
    }

    // Store the latest data
    pendingUnitsData = unitsData;

    // Clear existing timer
    if (writeDebounceTimer) {
        clearTimeout(writeDebounceTimer);
    }

    // If immediate save requested, skip debouncing
    if (immediate) {
        return await performSave(unitsData);
    }

    // Debounce: wait 500ms before saving
    return new Promise((resolve) => {
        writeDebounceTimer = setTimeout(async () => {
            const result = await performSave(pendingUnitsData);
            resolve(result);
        }, 500);
    });
}

/**
 * Sanitize data for Firestore (remove undefined values)
 */
/**
 * Sanitize data for Firestore (remove undefined values)
 */
function sanitizeForFirestore(data) {
    if (data === undefined) {
        return null;
    }

    if (Array.isArray(data)) {
        return data
            .filter(item => item !== undefined)
            .map(item => sanitizeForFirestore(item));
    }

    if (data !== null && typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            // Skip undefined values - Firestore doesn't accept them
            if (value === undefined) {
                continue;
            }
            // Convert null to empty string for logo field specifically
            if (key === 'logo' && value === null) {
                sanitized[key] = '';
            } else {
                sanitized[key] = sanitizeForFirestore(value);
            }
        }
        return sanitized;
    }

    return data;
}

/**
 * Internal function to perform the actual save
 */
async function performSave(unitsData, retryCount = 0) {
    const MAX_RETRIES = 3;

    try {
        // Sanitize data before saving to Firebase
        const sanitizedData = sanitizeForFirestore(unitsData);

        const docRef = doc(db, COLLECTION_NAME, UNITS_DOC);
        await setDoc(docRef, {
            units: sanitizedData,
            lastUpdated: new Date().toISOString()
        });

        // Update the last saved state
        lastSavedJson = JSON.stringify(sanitizedData);
        // console.log('✅ Units data saved to Firebase');
        return true;
    } catch (error) {
        // Check if it's a network error (unavailable)
        // CRITICAL: Do NOT retry on 'resource-exhausted' to prevent loops
        if (error.code === 'unavailable' && retryCount < MAX_RETRIES) {
            console.warn(`⚠️ Firebase unavailable, retrying... (${retryCount + 1}/${MAX_RETRIES})`);

            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));

            return await performSave(unitsData, retryCount + 1);
        }

        if (error.code === 'resource-exhausted') {
            console.error('❌ Firebase Quota Exceeded (resource-exhausted). Stop saving temporarily.');
            // Do not retry.
        } else {
            console.error('❌ Error saving units to Firebase:', error.code || error.message);
            console.error('Data causing error (sanitized):', JSON.stringify(sanitizeForFirestore(unitsData)).substring(0, 500) + '...');
        }

        return false;
    }
}

/**
 * Load units data from Firestore
 * @returns {Promise<Array|null>} - Units array or null if not found/error
 */
export async function loadUnitsData() {
    if (!isFirebaseConfigured() || !db) {
        console.warn('Firebase not configured, cannot load from Firestore');
        return null;
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, UNITS_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // console.log('✅ Units data loaded from Firebase');
            return data.units || null;
        } else {
            console.log('ℹ️ No units data found in Firebase');
            return null;
        }
    } catch (error) {
        console.error('❌ Error loading units from Firebase:', error);
        return null;
    }
}

/**
 * Save config to Firestore
 * @param {Object} configData - Configuration object
 * @returns {Promise<boolean>} - Success status
 */
export async function saveConfig(configData) {
    if (!isFirebaseConfigured() || !db) {
        console.warn('Firebase not configured, skipping config save to Firestore');
        return false;
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC);
        await setDoc(docRef, {
            config: configData,
            lastUpdated: new Date().toISOString()
        });
        console.log('✅ Config saved to Firebase');
        return true;
    } catch (error) {
        console.error('❌ Error saving config to Firebase:', error);
        return false;
    }
}

/**
 * Load config from Firestore
 * @returns {Promise<Object|null>} - Config object or null if not found/error
 */
export async function loadConfig() {
    if (!isFirebaseConfigured() || !db) {
        console.warn('Firebase not configured, cannot load config from Firestore');
        return null;
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('✅ Config loaded from Firebase');
            return data.config || null;
        } else {
            console.log('ℹ️ No config found in Firebase');
            return null;
        }
    } catch (error) {
        console.error('❌ Error loading config from Firebase:', error);
        return null;
    }
}

/**
 * Subscribe to real-time updates for units data
 * @param {Function} callback - Function to call when data changes
 * @returns {Function|null} - Unsubscribe function or null if not configured
 */
export function subscribeToUnitsData(callback) {
    if (!isFirebaseConfigured() || !db) {
        console.warn('Firebase not configured, cannot subscribe to units data');
        return null;
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, UNITS_DOC);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // console.log('🔄 Units data updated from Firebase');
                callback(data.units || null);
            }
        }, (error) => {
            console.error('❌ Error in units subscription:', error);
        });

        return unsubscribe;
    } catch (error) {
        console.error('❌ Error subscribing to units:', error);
        return null;
    }
}

/**
 * Subscribe to real-time updates for config
 * @param {Function} callback - Function to call when config changes
 * @returns {Function|null} - Unsubscribe function or null if not configured
 */
export function subscribeToConfig(callback) {
    if (!isFirebaseConfigured() || !db) {
        console.warn('Firebase not configured, cannot subscribe to config');
        return null;
    }

    try {
        const docRef = doc(db, COLLECTION_NAME, CONFIG_DOC);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // console.log('🔄 Config updated from Firebase');
                callback(data.config || null);
            }
        }, (error) => {
            console.error('❌ Error in config subscription:', error);
        });

        return unsubscribe;
    } catch (error) {
        console.error('❌ Error subscribing to config:', error);
        return null;
    }
}
