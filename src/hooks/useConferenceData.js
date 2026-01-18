import { useState, useEffect } from 'react';
import {
    saveUnitsData,
    loadUnitsData,
    subscribeToUnitsData,
    saveConfig,
    loadConfig,
    subscribeToConfig,
    saveLogo,
    deleteLogo,
    subscribeToLogos
} from '../services/firebaseService';
import { isFirebaseConfigured } from '../services/firebase';

const STORAGE_KEY = 'conference_units_data';
const CONFIG_KEY = 'conference_config';

// Default booths with colors (10 booths)
const getDefaultBooths = () => [
    { id: 'booth-1', name: 'דוכן 1', color: '#FF6B6B' },
    { id: 'booth-2', name: 'דוכן 2', color: '#4ECDC4' },
    { id: 'booth-3', name: 'דוכן 3', color: '#45B7D1' },
    { id: 'booth-4', name: 'דוכן 4', color: '#FFA07A' },
    { id: 'booth-5', name: 'דוכן 5', color: '#98D8C8' },
    { id: 'booth-6', name: 'דוכן 6', color: '#F7DC6F' },
    { id: 'booth-7', name: 'דוכן 7', color: '#BB8FCE' },
    { id: 'booth-8', name: 'דוכן 8', color: '#85C1E2' },
    { id: 'booth-9', name: 'דוכן 9', color: '#F8B739' },
    { id: 'booth-10', name: 'דוכן 10', color: '#52BE80' }
];

const getDefaultData = () => {
    // Initialize default 40 units with booths array
    return Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `Unit ${i + 1}`,
        booths: [], // Changed from score to booths array
        logo: null
    }));
};

// Migration function - convert old score format to new booths format
const migrateData = (data, availableBooths) => {
    return data.map(unit => {
        // If unit has old 'score' property, migrate it
        if (typeof unit.score === 'number' && !unit.booths) {
            const booths = [];
            // Convert score to booths by adding booths in order
            for (let i = 0; i < unit.score && i < availableBooths.length; i++) {
                booths.push(availableBooths[i].id);
            }
            return {
                ...unit,
                booths,
                score: undefined // Remove old score property
            };
        }
        // Ensure booths array exists
        return {
            ...unit,
            booths: unit.booths || []
        };
    });
};

const getInitialData = async (storageType = 'localStorage', availableBooths) => {
    let data = null;

    if (storageType === 'localStorage') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                data = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse storage", e);
            }
        }
    } else if (storageType === 'firebase') {
        try {
            const firebaseData = await loadUnitsData();
            if (firebaseData) {
                data = firebaseData;
            }
        } catch (error) {
            console.error('Error loading from Firebase:', error);
        }
    }

    // If no data, return default
    if (!data) {
        return getDefaultData();
    }

    // Migrate data if needed
    return migrateData(data, availableBooths || getDefaultBooths());
};

const getInitialConfig = () => {
    const stored = localStorage.getItem(CONFIG_KEY);
    const defaultConfig = {
        pageSize: 10,
        showZero: false,
        storageType: 'firebase',
        availableBooths: getDefaultBooths()
    };

    if (!stored) return defaultConfig;

    const parsed = JSON.parse(stored);
    // Ensure availableBooths exists
    if (!parsed.availableBooths) {
        parsed.availableBooths = getDefaultBooths();
    }
    return parsed;
};

export function useConferenceData() {
    const [config, setConfig] = useState(getInitialConfig);

    // Auto-detect: Use Firebase if configured, otherwise use config setting
    const storageType = isFirebaseConfigured() ? 'firebase' : (config.storageType || 'localStorage');
    // console.log('📊 Storage mode:', storageType, '| Firebase configured:', isFirebaseConfigured());

    const [units, setUnits] = useState(getDefaultData);
    const [logos, setLogos] = useState([]); // Logo library
    const [isLoading, setIsLoading] = useState(false);

    // Load initial data and config when storage type changes
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load config from Firebase if in Firebase mode
                if (storageType === 'firebase') {
                    const firebaseConfig = await loadConfig();
                    if (firebaseConfig && isMounted) {
                        // Merge ALL Firebase config properties (including showZero, pageSize, etc.)
                        setConfig(prev => ({
                            ...prev,
                            ...firebaseConfig // Merge all properties from Firebase
                        }));
                    }
                }

                const data = await getInitialData(storageType, config.availableBooths);
                if (isMounted) {
                    setUnits(data);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
                if (isMounted) {
                    setUnits(getDefaultData());
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [storageType]);

    // Real-time sync for Firebase
    useEffect(() => {
        if (storageType !== 'firebase') return;

        console.log('🔥 Firebase real-time listener activated');
        let unsubscribeUnits = null;
        let unsubscribeConfig = null;

        // Subscribe to units changes
        unsubscribeUnits = subscribeToUnitsData((updatedUnits) => {
            if (updatedUnits) {
                console.log('🔄 Received Firebase update, units count:', updatedUnits.length);
                setUnits(updatedUnits);
            } else {
                console.warn('⚠️ Received null/empty update from Firebase');
            }
        });

        // Subscribe to config changes (for booth definitions and all other settings)
        unsubscribeConfig = subscribeToConfig((updatedConfig) => {
            if (updatedConfig) {
                console.log('🔄 Received Firebase config update, booths count:', updatedConfig.availableBooths?.length);
                // Merge ALL config properties from Firebase, not just availableBooths
                setConfig(prev => ({
                    ...prev,
                    ...updatedConfig // This will include showZero, pageSize, storageType, etc.
                }));
            }
        });

        // Subscribe to logos
        const unsubscribeLogos = subscribeToLogos((updatedLogos) => {
            if (updatedLogos) {
                console.log('🔄 Received logos update:', updatedLogos.length);
                setLogos(updatedLogos);
            }
        });

        // Cleanup subscriptions
        return () => {
            console.log('🛑 Unsubscribing from Firebase listeners');
            if (unsubscribeUnits) unsubscribeUnits();
            if (unsubscribeConfig) unsubscribeConfig();
            if (unsubscribeLogos) unsubscribeLogos();
        };
    }, [storageType]);

    // Sync localStorage across tabs (only for localStorage mode)
    useEffect(() => {
        if (storageType !== 'localStorage') return;

        const handleStorageChange = (e) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    setUnits(JSON.parse(e.newValue));
                } catch (err) { }
            }
            if (e.key === CONFIG_KEY && e.newValue) {
                try {
                    setConfig(JSON.parse(e.newValue));
                } catch (err) { }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [storageType]);

    const saveUnits = async (newData) => {
        setUnits(newData);

        if (storageType === 'localStorage') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            console.log('✅ Data saved to localStorage successfully');
        } else if (storageType === 'firebase') {
            try {
                const success = await saveUnitsData(newData);

                if (success) {
                    console.log('✅ Data saved to Firebase successfully');
                } else {
                    // Firebase failed, fallback to localStorage
                    console.warn('⚠️ Firebase save failed, using localStorage as fallback');
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                }
            } catch (error) {
                console.error('❌ Firebase save error:', error);
                // Always fallback to localStorage on error
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            }
        }
    };

    const saveConfigData = async (newConfig) => {
        setConfig(newConfig);

        // Always save to localStorage as fallback
        localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));

        // Also save to Firebase if in Firebase mode
        if (storageType === 'firebase') {
            try {
                const success = await saveConfig(newConfig);
                if (success) {
                    console.log('✅ Config saved to Firebase successfully');
                } else {
                    console.warn('⚠️ Firebase config save failed, using localStorage fallback');
                }
            } catch (error) {
                console.error('❌ Firebase config save error:', error);
            }
        }
    };

    // Booth Management Actions
    const addBooth = (name, color) => {
        const newId = `booth-${Date.now()}`;
        const newBooth = { id: newId, name, color };
        const updatedBooths = [...(config.availableBooths || []), newBooth];
        console.log(`✅ Booth added: ${name} (${color})`);
        updateConfig({ availableBooths: updatedBooths });
        return newId;
    };

    const updateBooth = (id, updates) => {
        const updatedBooths = (config.availableBooths || []).map(b =>
            b.id === id ? { ...b, ...updates } : b
        );
        console.log(`✅ Booth updated: ${id}`, updates);
        updateConfig({ availableBooths: updatedBooths });
    };

    const removeBooth = (id) => {
        const booth = config.availableBooths?.find(b => b.id === id);
        const updatedBooths = (config.availableBooths || []).filter(b => b.id !== id);

        // Also remove this booth from all units
        const newUnits = units.map(unit => ({
            ...unit,
            booths: (unit.booths || []).filter(boothId => boothId !== id)
        }));

        console.log(`✅ Booth removed: ${booth?.name} (removed from all units)`);
        updateConfig({ availableBooths: updatedBooths });
        saveUnits(newUnits);
    };

    const addBoothToUnit = (unitId, boothId) => {
        const unit = units.find(u => u.id === unitId);
        const booth = config.availableBooths?.find(b => b.id === boothId);

        const newUnits = units.map(u => {
            if (u.id === unitId && !(u.booths || []).includes(boothId)) {
                return { ...u, booths: [...(u.booths || []), boothId] };
            }
            return u;
        });

        console.log(`✅ Booth added to unit: ${booth?.name} → ${unit?.name}`);
        saveUnits(newUnits);
    };

    const removeBoothFromUnit = (unitId, boothId) => {
        const unit = units.find(u => u.id === unitId);
        const booth = config.availableBooths?.find(b => b.id === boothId);

        const newUnits = units.map(u => {
            if (u.id === unitId) {
                return { ...u, booths: (u.booths || []).filter(id => id !== boothId) };
            }
            return u;
        });

        console.log(`✅ Booth removed from unit: ${booth?.name} ← ${unit?.name}`);
        saveUnits(newUnits);
    };

    // Legacy: Keep for backward compatibility (can be removed later)
    const updateScore = (id, increment) => {
        console.warn('⚠️ updateScore is deprecated, use addBoothToUnit/removeBoothFromUnit instead');
        // For now, do nothing or implement basic booth add/remove
    };

    const updateUnit = (id, updates) => {
        const unit = units.find(u => u.id === id);
        const newUnits = units.map(u =>
            u.id === id ? { ...u, ...updates } : u
        );
        console.log(`✅ Unit updated: ${unit?.name} → ${updates.name || unit?.name}`, updates);
        saveUnits(newUnits);
    };

    const addUnit = (name) => {
        const maxId = units.reduce((max, u) => Math.max(max, u.id), 0);
        const newUnit = {
            id: maxId + 1,
            name,
            booths: [],
            logo: null
        };
        console.log(`✅ Unit added: ${name} (ID: ${newUnit.id})`);
        saveUnits([...units, newUnit]);
    };

    const removeUnit = (id) => {
        const unit = units.find(u => u.id === id);
        console.log(`✅ Unit removed: ${unit?.name} (ID: ${id})`);
        saveUnits(units.filter(u => u.id !== id));
    };

    const updateConfig = (updates) => {
        console.log('✅ Config updated:', updates);
        saveConfigData({ ...config, ...updates });
    };

    const resetData = () => {
        const resetUnits = units.map(unit => ({
            ...unit,
            booths: [] // Clear all booths instead of resetting score
        }));
        console.log(`✅ All booths cleared (${units.length} units)`);
        saveUnits(resetUnits);
    };

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const data = await getInitialData(storageType, config.availableBooths);
            setUnits(data);
            console.log('✅ Data refreshed successfully');
            return true;
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const syncLocalStorageToFirebase = async () => {
        if (storageType !== 'firebase') {
            console.warn('⚠️ Cannot sync - not in Firebase mode');
            return false;
        }

        try {
            // Read config from localStorage
            const stored = localStorage.getItem(CONFIG_KEY);
            if (!stored) {
                console.warn('⚠️ No config found in localStorage');
                return false;
            }

            const localConfig = JSON.parse(stored);
            console.log('📤 Uploading config from localStorage to Firebase...');

            // Save to Firebase
            const success = await saveConfig(localConfig);
            if (success) {
                console.log('✅ Successfully synced localStorage config to Firebase!');
                // Update local state to match
                setConfig(localConfig);
                return true;
            } else {
                console.error('❌ Failed to sync to Firebase');
                return false;
            }
        } catch (error) {
            console.error('❌ Error syncing to Firebase:', error);
            return false;
        }
    };

    // --- Logo Management ---

    const addNewLogo = async (name, base64Data) => {
        const newId = `logo-${Date.now()}`;
        const newLogo = { id: newId, name, data: base64Data };
        if (storageType === 'firebase') {
            await saveLogo(newLogo);
        } else {
            // Local mock for logos (optional, mostly for testing)
            setLogos(prev => [...prev, newLogo]);
        }
        return newId;
    };

    const removeLogoArg = async (logoId) => {
        if (storageType === 'firebase') {
            await deleteLogo(logoId);
        } else {
            setLogos(prev => prev.filter(l => l.id !== logoId));
        }

        // Optional: Remove usage from units? Or keep broken link?
        // Let's keep it simple for now.
    };

    // Helper to resolve unit logo
    const getUnitLogo = (unit) => {
        // Priority 1: generic logoId reference
        if (unit.logoId) {
            const logoObj = logos.find(l => l.id === unit.logoId);
            if (logoObj) return logoObj.data;
        }
        // Priority 2: embedded legacy logo (fallback)
        if (unit.logo) return unit.logo;

        return null;
    };

    // Dangerous: Clear all legacy embedded logos
    const clearAllEmbeddedLogos = () => {
        const cleanedUnits = units.map(u => ({
            ...u,
            logo: null // Clear direct embedded base64
        }));
        console.log('🧹 Cleared all embedded logos from units');
        saveUnits(cleanedUnits);
    };

    return {
        units,
        config,
        // Legacy
        updateScore,
        // Unit management
        updateUnit,
        addUnit,
        removeUnit,
        // Booth management
        addBooth,
        updateBooth,
        removeBooth,
        addBoothToUnit,
        removeBoothFromUnit,
        // Config
        updateConfig,
        resetData,
        refreshData,
        syncLocalStorageToFirebase,
        isLoading,
        // Logos
        logos,
        addNewLogo,
        removeLogoArg,
        getUnitLogo,
        clearAllEmbeddedLogos
    };
}
