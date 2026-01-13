import React, { useState, useMemo } from 'react';
import { useConferenceData } from '../hooks/useConferenceData';
import { Search, Plus, Minus, Settings, Trash2, Pen, Save, X, Upload, LayoutGrid, List as ListIcon } from 'lucide-react';
import clsx from 'clsx';

export default function Admin() {
    const { units, config, updateScore, updateUnit, addUnit, removeUnit, updateConfig, resetData } = useConferenceData();

    // Local UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", logo: "" });
    const [showConfig, setShowConfig] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");

    // Filter & Sort (Always Alphabetical)
    const filteredUnits = useMemo(() => {
        return units
            .filter(u =>
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.id.toString().includes(searchTerm)
            )
            .sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }, [units, searchTerm]);

    // Handlers
    const handleEditClick = (unit) => {
        setEditingId(unit.id);
        setEditForm({ name: unit.name, logo: unit.logo || "" });
    };

    const handleSaveEdit = () => {
        updateUnit(editingId, editForm);
        setEditingId(null);
    };

    const handleAddUnit = (e) => {
        e.preventDefault();
        if (newUnitName.trim()) {
            addUnit(newUnitName);
            setNewUnitName("");
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#0d1626] text-white font-['Heebo'] selection:bg-cyan-500/30 overflow-hidden" dir="rtl">

            {/* Background Glows */}
            <div className="absolute top-[-20%] right-[10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#0d1626]/80 backdrop-blur-xl border-b border-white/5 p-3 lg:p-4 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col gap-3 lg:gap-6">

                    {/* Title & Stats */}
                    <div className="flex items-center justify-between lg:gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 lg:p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                                <Settings className="text-white w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl lg:text-2xl font-black tracking-wide text-white">ניהול כנס</h1>
                                <div className="text-xs lg:text-m font-medium text-slate-400">לוח בקרה</div>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-white/10 hidden md:block" />

                        <div className="hidden lg:flex gap-4">
                            <StatBadge label="יחידות" value={units.length} color="bg-blue-500/20 text-blue-300" />
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 flex-1 lg:justify-end">

                        {/* Search */}
                        <div className="relative group w-full lg:w-64 transition-all focus-within:lg:w-80">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="חיפוש יחידה..."
                                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-white/10 bg-slate-900/50 focus:bg-slate-900/80 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 w-full lg:w-auto items-center">
                            <div className="h-8 w-px bg-white/10 hidden lg:block" />

                            {/* Add Unit */}
                            <form onSubmit={handleAddUnit} className="flex gap-2 flex-1 lg:flex-none">
                                <input
                                    type="text"
                                    placeholder="הוסף יחידה..."
                                    className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/50 focus:bg-slate-900/80 focus:ring-2 focus:ring-emerald-500/50 outline-none lg:w-40 focus:lg:w-60 transition-all placeholder:text-slate-500"
                                    value={newUnitName}
                                    onChange={e => setNewUnitName(e.target.value)}
                                />
                                <button type="submit" disabled={!newUnitName} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                                    <Plus size={20} />
                                </button>
                            </form>

                            {/* Settings Toggle */}
                            <button
                                onClick={() => setShowConfig(!showConfig)}
                                className={`p-2.5 rounded-xl transition-all border border-white/10 ${showConfig ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <Settings size={20} />
                            </button>

                            <button
                                onClick={resetData}
                                title="איפוס נתונים כללי"
                                className="p-2.5 rounded-xl transition-all border border-white/10 bg-slate-800/50 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Config Panel (Collapsible) */}
                {showConfig && (
                    <div className="max-w-7xl mx-auto mt-3 lg:mt-4 p-4 lg:p-6 bg-slate-900/90 rounded-2xl border border-white/10 animate-in slide-in-from-top-4 shadow-2xl backdrop-blur-md">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-400">יחידות בעמוד (קרוסלה)</label>
                                <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-lg border border-white/5 w-fit">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={config.pageSize || 10}
                                        onChange={(e) => updateConfig({ pageSize: parseInt(e.target.value) || 10 })}
                                        className="w-16 px-3 py-1 bg-transparent text-center font-mono font-bold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-400">מספר דוכנים (מקסימום)</label>
                                <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-lg border border-white/5 w-fit">
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={config.maxScore || 10}
                                        onChange={(e) => updateConfig({ maxScore: parseInt(e.target.value) || 10 })}
                                        className="w-16 px-3 py-1 bg-transparent text-center font-mono font-bold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="hidden lg:block h-10 w-px bg-white/10" />

                            <div className="hidden lg:block h-10 w-px bg-white/10" />

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-400">הצג יחידות עם 0</label>
                                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-white/5 w-fit h-[42px]">
                                    <input
                                        type="checkbox"
                                        checked={config.showZero ?? true}
                                        onChange={(e) => updateConfig({ showZero: e.target.checked })}
                                        className="w-5 h-5 accent-cyan-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="h-10 w-px bg-white/10" />

                            <button
                                onClick={() => setSearchTerm("")}
                                disabled={!searchTerm}
                                className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-xl transition-colors border border-transparent hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <X size={18} />
                                <span className="font-bold">ניקוי סינון</span>
                            </button>
                        </div>
                    </div>
                )
                }
            </header >

            {/* Main Content Area */}
            < div className="flex-1 overflow-auto p-3 lg:p-4 xl:p-8 custom-scrollbar relative z-10" >
                <div className="max-w-7xl mx-auto">

                    {filteredUnits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                            <Search size={48} className="opacity-20" />
                            <div className="text-xl">לא נמצאו יחידות תואמות לחיפוש</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                            {filteredUnits.map(unit => (
                                <AdminUnitCard
                                    key={unit.id}
                                    unit={unit}
                                    editingId={editingId}
                                    editForm={editForm}
                                    setEditForm={setEditForm}
                                    handleLogoUpload={handleLogoUpload}
                                    handleSaveEdit={handleSaveEdit}
                                    handleEditClick={handleEditClick}
                                    updateScore={updateScore}
                                    removeUnit={removeUnit}
                                    setEditingId={setEditingId}
                                    maxScore={config.maxScore || 10}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}

// Sub-components for cleaner code
function StatBadge({ label, value, color }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 ${color}`}>
            <span className="font-mono font-bold text-lg">{value}</span>
            <span className="text-xs opacity-70">{label}</span>
        </div>
    );
}

function AdminUnitCard({ unit, editingId, editForm, setEditForm, handleLogoUpload, handleSaveEdit, handleEditClick, updateScore, removeUnit, setEditingId, maxScore }) {
    const isEditing = editingId === unit.id;

    return (
        <div className={clsx(
            "relative flex flex-col gap-3 lg:gap-4 p-4 lg:p-5 rounded-2xl border transition-all duration-200 group",
            isEditing
                ? "bg-slate-800/90 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] scale-[1.02] z-10"
                : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10 hover:shadow-xl hover:-translate-y-1"
        )}>
            {/* Header */}
            <div className="flex items-start gap-3">
                {/* Logo/Avatar */}
                <div className="relative shrink-0">
                    {isEditing ? (
                        <label className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center cursor-pointer border border-dashed border-slate-600 hover:border-cyan-400 group/upload transition-colors overflow-hidden touch-manipulation">
                            {editForm.logo ? (
                                <img src={editForm.logo} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-100" />
                            ) : (
                                <Upload size={18} className="text-slate-400 group-hover/upload:text-cyan-400" />
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                    ) : (
                        unit.logo ? (
                            <img src={unit.logo} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-400 border border-white/5 text-lg">
                                {unit.name.charAt(0)}
                            </div>
                        )
                    )}
                </div>

                {/* Name & ID */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                }}
                                className="bg-slate-900/50 text-white px-2 py-1 rounded border border-cyan-500/50 outline-none w-full font-bold text-sm lg:text-base"
                            />
                            <div className="flex gap-2 mt-1">
                                <button onClick={handleSaveEdit} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-1.5 lg:py-1 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 touch-manipulation">
                                    <Save size={12} /> שמירה
                                </button>
                                <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-1.5 lg:py-1 rounded-lg text-xs font-bold transition-colors touch-manipulation">ביטול</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-start">
                            <div className="w-full">
                                <div className="font-bold text-base lg:text-lg text-white truncate w-full" title={unit.name}>{unit.name}</div>
                                <div className="text-xs font-mono text-slate-500">ID: {unit.id}</div>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(unit)} className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors touch-manipulation">
                                    <Pen size={14} />
                                </button>
                                <button onClick={() => removeUnit(unit.id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors touch-manipulation">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Score Controls */}
            <div className="mt-2 flex items-center justify-between bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                <button
                    onClick={() => updateScore(unit.id, -1)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all active:scale-90 touch-manipulation"
                >
                    <Minus size={18} />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black font-mono text-white tracking-wider">{unit.score}</span>
                </div>

                <button
                    onClick={() => updateScore(unit.id, 1)}
                    disabled={unit.score >= maxScore}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
}
