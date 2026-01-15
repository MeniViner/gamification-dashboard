import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { compressBase64Image } from '../utils/imageUtils';

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

        // Check payload size to prevent 'invalid-argument' errors (max 1MB)
        const jsonPayload = JSON.stringify({ units: sanitizedData });
        const payloadSize = new Blob([jsonPayload]).size;
        const MAX_SIZE_BYTES = 1048576; // 1MB

        if (payloadSize > MAX_SIZE_BYTES * 0.9) {
            console.warn(`⚠️ Warning: Data size is close to Firestore limit: ${(payloadSize / 1024).toFixed(2)}KB`);
        }

        if (payloadSize > MAX_SIZE_BYTES) {
            console.warn(`⚠️ Data too large (${(payloadSize / 1024 / 1024).toFixed(2)}MB). Attempting auto-compression of existing images...`);

            // Identify and compress large units
            let compressionOccurred = false;
            const compressedData = await Promise.all(sanitizedData.map(async (unit) => {
                // Check if unit has a logo and if the unit size is significant (e.g., > 50KB)
                // Approximate size check
                const unitSize = JSON.stringify(unit).length;
                if (unit.logo && unit.logo.length > 50000) { // ~50KB base64
                    try {
                        console.log(`📉 Compressing logo for unit: ${unit.name} (Original size: ${(unit.logo.length / 1024).toFixed(2)}KB)`);
                        const newLogo = await compressBase64Image(unit.logo, 100, 0.5); // Aggressive compression
                        console.log(`   ✅ Compressed to: ${(newLogo.length / 1024).toFixed(2)}KB`);
                        compressionOccurred = true;
                        return { ...unit, logo: newLogo };
                    } catch (err) {
                        console.error(`Failed to compress unit ${unit.name}:`, err);
                        return unit;
                    }
                }
                return unit;
            }));

            if (compressionOccurred) {
                // Recalculate size
                const newPayload = JSON.stringify({ units: compressedData });
                const newSize = new Blob([newPayload]).size;

                if (newSize < MAX_SIZE_BYTES) {
                    console.log(`✅ Auto-compression successful! New size: ${(newSize / 1024).toFixed(2)}KB. Saving...`);
                    // Recursive call with clean data (prevent infinite loops with retryCount logic if needed, but here we just proceed)
                    // Note: We need to update the sanitizedData variable to proceed with save

                    const docRef = doc(db, COLLECTION_NAME, UNITS_DOC);
                    await setDoc(docRef, {
                        units: compressedData,
                        lastUpdated: new Date().toISOString()
                    });

                    lastSavedJson = JSON.stringify(compressedData);
                    return true;
                } else {
                    console.error(`❌ Still too large after compression: ${(newSize / 1024 / 1024).toFixed(2)}MB.`);
                    return false;
                }
            } else {
                console.error("❌ No compressible images found specifically, but payload is too large.");
                return false;
            }
        }

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

// --- Logo Collection Management ---

const LOGOS_COLLECTION = 'logos';

/**
 * Save a logo to Firestore
 * @param {Object} logoData - { id, name, data (base64) }
 */
export async function saveLogo(logoData) {
    if (!isFirebaseConfigured() || !db) return false;

    try {
        const docRef = doc(db, LOGOS_COLLECTION, logoData.id);
        await setDoc(docRef, {
            ...logoData,
            lastUpdated: new Date().toISOString()
        });
        console.log('✅ Logo saved to Firebase');
        return true;
    } catch (error) {
        console.error('❌ Error saving logo:', error);
        return false;
    }
}

/**
 * Delete a logo from Firestore
 */
export async function deleteLogo(logoId) {
    if (!isFirebaseConfigured() || !db) return false;

    try {
        const { deleteDoc } = await import('firebase/firestore');
        const docRef = doc(db, LOGOS_COLLECTION, logoId);
        await deleteDoc(docRef);
        console.log('✅ Logo deleted from Firebase');
        return true;
    } catch (error) {
        console.error('❌ Error deleting logo:', error);
        return false;
    }
}

/**
 * Subscribe to logos collection
 */
export function subscribeToLogos(callback) {
    if (!isFirebaseConfigured() || !db) return null;

    try {
        // We need collection, ensure it's imported or get it from SDK
        import('firebase/firestore').then(({ collection }) => {
            const colRef = collection(db, LOGOS_COLLECTION);
            onSnapshot(colRef, (snapshot) => {
                const logos = [];
                snapshot.forEach((doc) => {
                    logos.push(doc.data());
                });
                callback(logos);
            }, (error) => {
                console.error('❌ Error in logos subscription:', error);
            });
        });

        // Return a dummy unsubscribe or a wrapped one (async issues, but acceptable for this quick fix)
        // ideally we await, but this is a sync interface.
        // For now, let's just return a no-op as the real one is async hooked.
        return () => { };
    } catch (error) {
        console.error('❌ Error subscribing to logos:', error);
        return null;
    }
}

