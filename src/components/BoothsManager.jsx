import React, { useState } from 'react';
import { Plus, Trash2, Pen, Save, X } from 'lucide-react';
import clsx from 'clsx';

export default function BoothsManager({ availableBooths, addBooth, updateBooth, removeBooth }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', color: '#FF6B6B' });

    const handleAddBooth = () => {
        if (formData.name.trim()) {
            addBooth(formData.name, formData.color);
            setFormData({ name: '', color: '#FF6B6B' });
            setIsAdding(false);
        }
    };

    const handleEditClick = (booth) => {
        setEditingId(booth.id);
        setFormData({ name: booth.name, color: booth.color });
    };

    const handleSaveEdit = () => {
        updateBooth(editingId, formData);
        setEditingId(null);
        setFormData({ name: '', color: '#FF6B6B' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', color: '#FF6B6B' });
    };

    return (
        <div className="flex flex-col gap-3 bg-slate-900/90 rounded-2xl p-4 lg:p-6 border border-white/10">
            <div className="flex items-center justify-between">
                <h3 className="text-base lg:text-lg font-bold text-cyan-400">ניהול דוכנים</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={clsx(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-bold",
                        isAdding
                            ? "bg-slate-700 text-slate-300"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    )}
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                    {isAdding ? 'ביטול' : 'הוסף דוכן'}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-950 rounded-xl border border-emerald-500/30">
                    <input
                        type="text"
                        placeholder="שם הדוכן..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBooth()}
                        className="flex-1 px-3 py-2 bg-slate-900 rounded-lg border border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30 outline-none text-sm"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-20 h-10 rounded-lg cursor-pointer bg-slate-900 border border-white/10"
                        />
                        <button
                            onClick={handleAddBooth}
                            disabled={!formData.name.trim()}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        >
                            שמירה
                        </button>
                    </div>
                </div>
            )}

            {/* Booths List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableBooths.map((booth) => (
                    <div
                        key={booth.id}
                        className={clsx(
                            "flex items-center gap-2 p-2 rounded-lg border transition-all",
                            editingId === booth.id
                                ? "bg-slate-800 border-cyan-500/50"
                                : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10"
                        )}
                    >
                        {editingId === booth.id ? (
                            <>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-8 h-8 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                    className="flex-1 px-2 py-1 bg-slate-900 rounded border border-cyan-500/50 outline-none text-sm"
                                />
                                <button
                                    onClick={handleSaveEdit}
                                    className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 text-slate-400 hover:bg-slate-700 rounded transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <div
                                    className="w-6 h-6 rounded border border-white/20 shrink-0"
                                    style={{ backgroundColor: booth.color }}
                                />
                                <span className="flex-1 text-sm font-medium text-slate-200 truncate" title={booth.name}>
                                    {booth.name}
                                </span>
                                <button
                                    onClick={() => handleEditClick(booth)}
                                    className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Pen size={14} />
                                </button>
                                <button
                                    onClick={() => removeBooth(booth.id)}
                                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {availableBooths.length === 0 && !isAdding && (
                <div className="text-center py-8 text-slate-500 text-sm">
                    אין דוכנים. לחץ על "הוסף דוכן" כדי להתחיל.
                </div>
            )}
        </div>
    );
}
