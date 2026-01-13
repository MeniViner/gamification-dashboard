import { useState, useEffect } from 'react';
import {
    saveUnitsData,
    loadUnitsData,
    subscribeToUnitsData
} from '../services/firebaseService';
import { isFirebaseConfigured } from '../services/firebase';

const STORAGE_KEY = 'conference_units_data';
const CONFIG_KEY = 'conference_config';

const getDefaultData = () => {
    // Initialize default 40 units
    return Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `Unit ${i + 1}`,
        score: 0,
        logo: null
    }));
};

const getInitialData = async (storageType = 'localStorage') => {
    if (storageType === 'localStorage') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse storage", e);
            }
        }
    } else if (storageType === 'firebase') {
        try {
            const firebaseData = await loadUnitsData();
            if (firebaseData) {
                // console.log('✅ Loaded data from Firebase');
                return firebaseData;
            }
        } catch (error) {
            console.error('Error loading from Firebase:', error);
        }
    }

    return getDefaultData();
};

const getInitialConfig = () => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : { pageSize: 10, maxScore: 10, showZero: false, storageType: 'localStorage' };
};

export function useConferenceData() {
    const [config, setConfig] = useState(getInitialConfig);

    // Auto-detect: Use Firebase if configured, otherwise use config setting
    const storageType = isFirebaseConfigured() ? 'firebase' : (config.storageType || 'localStorage');
    // console.log('📊 Storage mode:', storageType, '| Firebase configured:', isFirebaseConfigured());

    const [units, setUnits] = useState(getDefaultData); // Start with default, will load async
    const [isLoading, setIsLoading] = useState(false);

    // Load initial data when storage type changes
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await getInitialData(storageType);
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

        // console.log('🔥 Firebase real-time listener activated');
        let unsubscribeUnits = null;

        // Subscribe to units changes only
        // Note: Config is NOT synced via Firebase to avoid conflicts
        // Each device/browser chooses its own storage type
        unsubscribeUnits = subscribeToUnitsData((updatedUnits) => {
            if (updatedUnits) {
                // console.log('🔄 Received Firebase update, units count:', updatedUnits.length);
                setUnits(updatedUnits);
            }
        });

        // Cleanup subscriptions
        return () => {
            if (unsubscribeUnits) unsubscribeUnits();
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
        } else if (storageType === 'firebase') {
            try {
                await saveUnitsData(newData);
            } catch (error) {
                console.error('Firebase save error:', error);
                // Fallback to localStorage on error
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            }
        }
    };

    const saveConfigData = (newConfig) => {
        setConfig(newConfig);
        // Config is always saved to localStorage only
        // This prevents conflicts when switching storage modes
        localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));

    };

    // Actions
    const updateScore = (id, increment) => {
        const maxScore = config.maxScore || 10;
        const newUnits = units.map(u => {
            if (u.id === id) {
                const newScore = u.score + increment;
                const clamped = Math.max(0, Math.min(newScore, maxScore));
                return { ...u, score: clamped };
            }
            return u;
        });
        saveUnits(newUnits);
    };

    const updateUnit = (id, updates) => {
        const newUnits = units.map(u =>
            u.id === id ? { ...u, ...updates } : u
        );
        saveUnits(newUnits);
    };

    const addUnit = (name) => {
        const maxId = units.reduce((max, u) => Math.max(max, u.id), 0);
        const newUnit = {
            id: maxId + 1,
            name,
            score: 0,
            logo: null
        };
        saveUnits([...units, newUnit]);
    };

    const removeUnit = (id) => {
        saveUnits(units.filter(u => u.id !== id));
    };

    const updateConfig = (updates) => {
        saveConfigData({ ...config, ...updates });
    };

    const resetData = () => {
        const resetUnits = units.map(unit => ({
            ...unit,
            score: 0
        }));
        saveUnits(resetUnits);
    };

    return {
        units,
        config,
        updateScore,
        updateUnit,
        addUnit,
        removeUnit,
        updateConfig,
        resetData,
        isLoading
    };
}
