import { useState, useEffect } from 'react';

const STORAGE_KEY = 'conference_units_data';
const CONFIG_KEY = 'conference_config';

const getInitialData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse storage", e);
        }
    }
    // Initialize default 40 units
    return Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `Unit ${i + 1}`,
        score: 0,
        logo: null
    }));
};

const getInitialConfig = () => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : { pageSize: 10, maxScore: 10, showZero: false }; // Default maxScore 10, showZero true
};

export function useConferenceData() {
    const [units, setUnits] = useState(getInitialData);
    const [config, setConfig] = useState(getInitialConfig);

    // Sync state when localStorage changes in another tab
    useEffect(() => {
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
    }, []);

    const saveUnits = (newData) => {
        setUnits(newData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    };

    const saveConfig = (newConfig) => {
        setConfig(newConfig);
        localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    };

    // Actions
    const updateScore = (id, increment) => {
        const maxScore = config.maxScore || 10;
        const newUnits = units.map(u => {
            if (u.id === id) {
                const newScore = u.score + increment;
                if (newScore < 0 || newScore > maxScore && increment > 0) return u; // Allow decrement even if above max (rare edge case), but strictly prevent checking limits on increment
                // Actually, let's keep it simple: strict bounds.
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
        if (!confirm("Are you sure?")) return;
        saveUnits(units.filter(u => u.id !== id));
    };

    const updateConfig = (updates) => {
        saveConfig({ ...config, ...updates });
    };

    const resetData = () => {
        if (!confirm("לחיצה על אישור ימחק את כללל נתוני היחידות!! בטוח?")) return;
        const initial = Array.from({ length: 40 }, (_, i) => ({
            id: i + 1,
            name: `Unit ${i + 1}`,
            score: 0,
            logo: null
        }));
        saveUnits(initial);
    };

    return {
        units,
        config,
        updateScore,
        updateUnit,
        addUnit,
        removeUnit,
        updateConfig,
        resetData
    };
}
