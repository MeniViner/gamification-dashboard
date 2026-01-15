import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useConferenceData } from '../hooks/useConferenceData';
import { Plus, Trash2, Pen, Save, X, ArrowRight, Upload } from 'lucide-react';

export default function BoothsManagementPage() {
    const navigate = useNavigate();
    const { config, addBooth, updateBooth, removeBooth, syncLocalStorageToFirebase } = useConferenceData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#FF6B6B' });
    const [isSyncing, setIsSyncing] = useState(false);

    const availableBooths = config.availableBooths || [];

    const handleSyncToFirebase = async () => {
        if (window.confirm('האם להעלות את הגדרות הדוכנים מ-localStorage ל-Firebase?\n\nפעולה זו תשכתב את ההגדרות הקיימות ב-Firebase.')) {
            setIsSyncing(true);
            const success = await syncLocalStorageToFirebase();
            setIsSyncing(false);

            if (success) {
                alert('✅ הדוכנים הועלו בהצלחה ל-Firebase!');
            } else {
                alert('❌ שגיאה בהעלאה ל-Firebase. בדוק את הקונסול למידע נוסף.');
            }
        }
    };

    const handleAdd = () => {
        if (formData.name.trim()) {
            addBooth(formData.name.trim(), formData.color);
            setFormData({ name: '', color: '#FF6B6B' });
            setIsAdding(false);
        }
    };

    const handleEdit = (booth) => {
        setEditingId(booth.id);
        setFormData({ name: booth.name, color: booth.color });
    };

    const handleSaveEdit = () => {
        if (formData.name.trim()) {
            updateBooth(editingId, { name: formData.name.trim(), color: formData.color });
            setEditingId(null);
            setFormData({ name: '', color: '#FF6B6B' });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', color: '#FF6B6B' });
    };

    const handleDelete = (boothId, boothName) => {
        if (window.confirm(`האם אתה בטוח שברצונך למחוק את הדוכן "${boothName}"?`)) {
            removeBooth(boothId);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 font-['Heebo']" dir="rtl">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <ArrowRight size={20} />
                    חזרה לניהול
                </button>
                <h1 className="text-4xl font-black text-white mb-2">ניהול דוכנים</h1>
                <div className="flex items-center justify-between">
                    <p className="text-slate-400">הוסף, ערוך או מחק דוכנים זמינים</p>
                    <button
                        onClick={handleSyncToFirebase}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg hover:bg-cyan-500/30 hover:border-cyan-500 transition-all text-cyan-400 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        title="העלה דוכנים מ-localStorage ל-Firebase"
                    >
                        <Upload size={18} className={isSyncing ? 'animate-pulse' : ''} />
                        {isSyncing ? 'מעלה...' : 'סנכרן ל-Firebase'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto">
                {/* Add New Booth Button */}
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full p-4 bg-emerald-500/20 border-2 border-dashed border-emerald-500/50 rounded-xl hover:bg-emerald-500/30 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 text-emerald-400 font-bold mb-6"
                    >
                        <Plus size={20} />
                        הוסף דוכן חדש
                    </button>
                )}

                {/* Add Form */}
                {isAdding && (
                    <div className="bg-slate-800/50 border border-emerald-500/30 rounded-xl p-4 mb-6">
                        <h3 className="font-bold text-emerald-400 mb-3">דוכן חדש</h3>
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="text-sm text-slate-400 mb-1 block">שם הדוכן</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    placeholder="למשל: דוכן הכניסה"
                                    className="w-full bg-slate-900/50 text-white px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-emerald-500/50"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-1 block">צבע</label>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-16 h-10 rounded-lg border border-white/10 bg-slate-900/50 cursor-pointer"
                                />
                            </div>
                            <button
                                onClick={handleAdd}
                                disabled={!formData.name.trim()}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                הוסף
                            </button>
                            <button
                                onClick={() => {
                                    setIsAdding(false);
                                    setFormData({ name: '', color: '#FF6B6B' });
                                }}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                )}

                {/* Booths List */}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {availableBooths.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-6xl mb-4">🏪</div>
                            <p className="text-lg">עדיין לא הוספת דוכנים</p>
                            <p className="text-sm">לחץ על "הוסף דוכן חדש" כדי להתחיל</p>
                        </div>
                    )}

                    {availableBooths.map((booth) => (
                        <div
                            key={booth.id}
                            className="bg-slate-800/40 border border-white/5 rounded-xl p-4 hover:bg-slate-800/60 hover:border-white/10 transition-all"
                        >
                            {editingId === booth.id ? (
                                // Edit Mode
                                <div className="flex gap-3 items-center">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            className="w-full bg-slate-900/50 text-white px-3 py-2 rounded-lg border border-cyan-500/50 outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                        className="w-16 h-10 rounded-lg border border-white/10 bg-slate-900/50 cursor-pointer"
                                    />
                                    <button
                                        onClick={handleSaveEdit}
                                        className="p-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                                    >
                                        <Save size={18} />
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-lg"
                                            style={{ backgroundColor: booth.color }}
                                        />
                                        <span className="font-bold text-lg">{booth.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(booth)}
                                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors"
                                        >
                                            <Pen size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(booth.id, booth.name)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
