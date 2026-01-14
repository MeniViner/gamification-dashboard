import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Collection and document names
const COLLECTION_NAME = 'conference_data';
const UNITS_DOC = 'units';
const CONFIG_DOC = 'config';

// Debounce timer for writes
let writeDebounceTimer = null;
let pendingUnitsData = null;

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
 * Internal function to perform the actual save
 */
async function performSave(unitsData, retryCount = 0) {
    const MAX_RETRIES = 3;

    try {
        const docRef = doc(db, COLLECTION_NAME, UNITS_DOC);
        await setDoc(docRef, {
            units: unitsData,
            lastUpdated: new Date().toISOString()
        });
        // console.log('✅ Units data saved to Firebase');
        return true;
    } catch (error) {
        // Check if it's a network or rate limit error
        if ((error.code === 'resource-exhausted' || error.code === 'unavailable') && retryCount < MAX_RETRIES) {
            console.warn(`⚠️ Firebase write failed (${error.code}), retrying... (${retryCount + 1}/${MAX_RETRIES})`);

            // Exponential backoff: wait longer before each retry
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));

            return await performSave(unitsData, retryCount + 1);
        }

        console.error('❌ Error saving units to Firebase:', error.code || error.message);
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
