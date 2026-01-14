import React, { useState, useMemo, useEffect } from 'react';
import { useConferenceData } from '../hooks/useConferenceData';
import { Search, Plus, Minus, Settings, Trash2, Pen, Save, X, Upload, AlertTriangle, Lock, ArrowUpDown, SortAsc, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const ADMIN_PASSWORD = "מני2026המתכנת";
const AUTH_STORAGE_KEY = "admin_authenticated";

export default function Admin() {
    const { units, config, updateScore, updateUnit, addUnit, removeUnit, updateConfig, resetData, refreshData, isLoading } = useConferenceData();

    // Authentication State - Check localStorage on mount
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    });
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Local UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [sortMode, setSortMode] = useState("name"); // "name" or "score"
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: "", logo: "" });
    const [showConfig, setShowConfig] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [modalState, setModalState] = useState({ show: false, type: null, unitId: null, unitName: null });

    // Handle Password Submit
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            localStorage.setItem(AUTH_STORAGE_KEY, "true");
            setPasswordError(false);
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        }
    };

    // Filter & Sort
    const filteredUnits = useMemo(() => {
        const filtered = units.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id.toString().includes(searchTerm)
        );

        // Sort based on mode
        if (sortMode === "score") {
            return [...filtered].sort((a, b) => b.score - a.score);
        } else {
            return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'he'));
        }
    }, [units, searchTerm, sortMode]);

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

    const handleResetClick = () => {
        setModalState({ show: true, type: 'reset', unitId: null, unitName: null });
    };

    const handleRemoveClick = (unitId, unitName) => {
        setModalState({ show: true, type: 'remove', unitId, unitName });
    };

    const handleModalConfirm = () => {
        if (modalState.type === 'reset') {
            resetData();
        } else if (modalState.type === 'remove') {
            removeUnit(modalState.unitId);
        }
        setModalState({ show: false, type: null, unitId: null, unitName: null });
    };

    const handleModalCancel = () => {
        setModalState({ show: false, type: null, unitId: null, unitName: null });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshData();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // If not authenticated, show login screen
    if (!isAuthenticated) {
        return <LoginScreen
            passwordInput={passwordInput}
            setPasswordInput={setPasswordInput}
            handlePasswordSubmit={handlePasswordSubmit}
            passwordError={passwordError}
        />;
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1626] to-[#0a1320] text-white font-['Heebo'] selection:bg-cyan-500/30 overflow-hidden" dir="rtl">

            {/* Background Glows */}
            <div className="absolute top-[-20%] right-[10%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#0d1626]/90 backdrop-blur-xl border-b border-white/10 p-2 sm:p-3 lg:p-4 shadow-2xl">
                <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:gap-3 lg:gap-6">

                    {/* Title & Stats */}
                    <div className="flex items-center justify-between gap-2 lg:gap-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 lg:p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                                <Settings className="text-white w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                            </div>
                            <div>
                                <h1 className="text-base sm:text-xl lg:text-2xl font-black tracking-wide text-white">ניהול כנס</h1>
                                <div className="text-[10px] sm:text-xs lg:text-sm font-medium text-slate-400">לוח בקרה</div>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-4">
                            <StatBadge label="יחידות" value={units.length} color="bg-blue-500/20 text-blue-300" />
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">

                        {/* Search */}
                        <div className="relative group flex-1 sm:max-w-xs lg:max-w-md transition-all focus-within:sm:max-w-sm focus-within:lg:max-w-xl">
                            <Search className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="חיפוש יחידה..."
                                className="w-full pl-3 pr-8 sm:pl-4 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base rounded-xl border border-white/10 bg-slate-900/50 focus:bg-slate-900/80 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 items-center">
                            {/* Sort Toggle */}
                            <button
                                onClick={() => setSortMode(prev => prev === "name" ? "score" : "name")}
                                className={clsx(
                                    "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all border text-xs sm:text-sm font-bold whitespace-nowrap",
                                    sortMode === "score"
                                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border-white/10"
                                )}
                            >
                                <SortAsc size={14} className="sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{sortMode === "score" ? "לפי ניקוד" : "לפי שם"}</span>
                                <span className="sm:hidden">{sortMode === "score" ? "ניקוד" : "שם"}</span>
                            </button>

                            {/* Add Unit */}
                            <form onSubmit={handleAddUnit} className="flex gap-2 flex-1 sm:flex-none">
                                <input
                                    type="text"
                                    placeholder="הוסף יחידה..."
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-xl border border-white/10 bg-slate-900/50 focus:bg-slate-900/80 focus:ring-2 focus:ring-emerald-500/50 outline-none sm:w-32 focus:sm:w-48 lg:w-40 focus:lg:w-60 transition-all placeholder:text-slate-500"
                                    value={newUnitName}
                                    onChange={e => setNewUnitName(e.target.value)}
                                />
                                <button type="submit" disabled={!newUnitName} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 sm:p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                                    <Plus size={16} className="sm:w-5 sm:h-5" />
                                </button>
                            </form>

                            {/* Settings Toggle */}
                            <button
                                onClick={() => setShowConfig(!showConfig)}
                                className={clsx(
                                    "p-2 sm:p-2.5 rounded-xl transition-all border border-white/10",
                                    showConfig ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Settings size={16} className="sm:w-5 sm:h-5" />
                            </button>

                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                title="רענן נתונים"
                                className={clsx(
                                    "p-2 sm:p-2.5 rounded-xl transition-all border border-white/10",
                                    isRefreshing
                                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 cursor-wait"
                                        : "bg-slate-800/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                                )}
                            >
                                <RefreshCw size={16} className={clsx("sm:w-5 sm:h-5", isRefreshing && "animate-spin")} />
                            </button>

                            <button
                                onClick={handleResetClick}
                                title="איפוס נתונים כללי"
                                className="p-2 sm:p-2.5 rounded-xl transition-all border border-white/10 bg-slate-800/50 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
                            >
                                <Trash2 size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Config Panel (Collapsible) */}
                {showConfig && (
                    <div className="max-w-7xl mx-auto mt-2 sm:mt-3 lg:mt-4 p-3 sm:p-4 lg:p-6 bg-slate-900/90 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md transition-all duration-300">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 sm:gap-4 lg:gap-8">
                            <div className="flex flex-col gap-2 w-full lg:w-auto">
                                <label className="text-xs sm:text-sm font-bold text-slate-400">יחידות בעמוד</label>
                                <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-lg border border-white/5 w-full sm:w-fit">
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={config.pageSize || 10}
                                        onChange={(e) => updateConfig({ pageSize: parseInt(e.target.value) || 10 })}
                                        className="w-16 px-3 py-1 bg-transparent text-center font-mono font-bold focus:outline-none text-sm sm:text-base"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full lg:w-auto">
                                <label className="text-xs sm:text-sm font-bold text-slate-400">מספר דוכנים</label>
                                <div className="flex items-center gap-3 bg-slate-950 p-1 rounded-lg border border-white/5 w-full sm:w-fit">
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={config.maxScore || 10}
                                        onChange={(e) => updateConfig({ maxScore: parseInt(e.target.value) || 10 })}
                                        className="w-16 px-3 py-1 bg-transparent text-center font-mono font-bold focus:outline-none text-sm sm:text-base"
                                    />
                                </div>
                            </div>

                            <div className="hidden lg:block h-10 w-px bg-white/10" />

                            <div className="flex flex-col gap-2 w-full lg:w-auto">
                                <label className="text-xs sm:text-sm font-bold text-slate-400">הצג יחידות עם 0</label>
                                <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-white/5 w-full sm:w-fit h-[42px]">
                                    <input
                                        type="checkbox"
                                        checked={config.showZero ?? true}
                                        onChange={(e) => updateConfig({ showZero: e.target.checked })}
                                        className="w-5 h-5 accent-cyan-500 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="h-px lg:h-10 w-full lg:w-px bg-white/10" />

                            <div className="flex flex-col gap-2 w-full lg:w-auto">
                                <label className="text-xs sm:text-sm font-bold text-slate-400">סוג אחסון</label>
                                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-white/5 w-full sm:w-fit">
                                    <button
                                        onClick={() => updateConfig({ storageType: 'localStorage' })}
                                        className={clsx(
                                            "px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                                            config.storageType === 'localStorage' || !config.storageType
                                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                                        )}
                                    >
                                        LocalStorage
                                    </button>
                                    <button
                                        onClick={() => updateConfig({ storageType: 'firebase' })}
                                        className={clsx(
                                            "px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                                            config.storageType === 'firebase'
                                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                                                : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                                        )}
                                    >
                                        Firebase
                                    </button>
                                </div>
                            </div>

                            <div className="h-px lg:h-10 w-full lg:w-px bg-white/10" />

                            <button
                                onClick={() => setSearchTerm("")}
                                disabled={!searchTerm}
                                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white px-3 sm:px-4 py-2 rounded-xl transition-colors border border-transparent hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed w-full sm:w-auto text-sm"
                            >
                                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="font-bold">ניקוי סינון</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-2 sm:p-3 lg:p-4 xl:p-8 custom-scrollbar relative z-10">
                <div className="max-w-7xl mx-auto">

                    {filteredUnits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                            <Search size={48} className="opacity-20" />
                            <div className="text-lg sm:text-xl">לא נמצאו יחידות תואמות לחיפוש</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
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
                                    handleRemoveClick={handleRemoveClick}
                                    updateScore={updateScore}
                                    removeUnit={removeUnit}
                                    setEditingId={setEditingId}
                                    maxScore={config.maxScore || 10}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {modalState.show && (
                <ConfirmModal
                    type={modalState.type}
                    unitName={modalState.unitName}
                    onConfirm={handleModalConfirm}
                    onCancel={handleModalCancel}
                />
            )}
        </div>
    );
}

// Login Screen Component
function LoginScreen({ passwordInput, setPasswordInput, handlePasswordSubmit, passwordError }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1626] to-[#0a1320] px-4" dir="rtl">
            {/* Background Glows */}
            <div className="absolute top-[-20%] right-[10%] w-[700px] h-[700px] bg-cyan-400/20 rounded-full blur-[180px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-400/15 rounded-full blur-[200px] pointer-events-none" />

            <div className="relative w-full max-w-md">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-400/20 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] p-6 sm:p-8 lg:p-10 relative overflow-hidden">
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 rounded-3xl blur-2xl opacity-50 pointer-events-none" />

                    <div className="relative z-10">
                        {/* Lock Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 sm:p-5 bg-cyan-500/20 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-black text-white text-center mb-2 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                            כניסה לניהול
                        </h1>
                        <p className="text-slate-400 text-center mb-6 sm:mb-8 text-sm sm:text-base">
                            הזן את הסיסמה כדי להמשיך
                        </p>

                        {/* Password Form */}
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="סיסמה"
                                    className={clsx(
                                        "w-full px-4 py-3 sm:py-4 rounded-xl border bg-slate-900/50 text-white placeholder:text-slate-500 outline-none transition-all text-sm sm:text-base",
                                        passwordError
                                            ? "border-rose-500/50 ring-2 ring-rose-500/50 animate-shake"
                                            : "border-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/50"
                                    )}
                                    autoFocus
                                />
                            </div>

                            {passwordError && (
                                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm text-center animate-shake">
                                    סיסמה שגויה, נסה שוב
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 sm:py-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all active:scale-95 text-sm sm:text-base"
                            >
                                כניסה
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}

// Sub-components for cleaner code
function StatBadge({ label, value, color }) {
    return (
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border border-white/5 ${color} text-xs sm:text-sm`}>
            <span className="font-mono font-bold text-sm sm:text-lg">{value}</span>
            <span className="opacity-70 text-[10px] sm:text-xs">{label}</span>
        </div>
    );
}

function ConfirmModal({ type, unitName, onConfirm, onCancel }) {
    const isReset = type === 'reset';
    const isRemove = type === 'remove';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onCancel}
            dir="rtl"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
            <div
                className="relative bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 lg:p-8 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                {/* Background Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-2xl ${isReset ? 'bg-rose-500/20' : 'bg-rose-500/20'}`}>
                        <AlertTriangle className={`w-8 h-8 ${isReset ? 'text-rose-400' : 'text-rose-400'}`} />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white text-center mb-3">
                    {isReset ? 'איפוס ניקודים' : 'מחיקת יחידה'}
                </h2>

                {/* Message */}
                <p className="text-slate-300 text-center mb-6 leading-relaxed">
                    {isReset ? (
                        <>
                            <span className="font-bold text-rose-400">לחיצה על אישור יאפס את כל הניקודים</span> של היחידות!
                            <br />
                            <span className="text-slate-400 text-sm mt-2 block">השמות והתמונות יישמרו.</span>
                        </>
                    ) : (
                        <>
                            האם אתה בטוח שברצונך למחוק את היחידה
                            <br />
                            <span className="font-bold text-rose-400 text-lg">{unitName}</span>?
                            <br />
                            <span className="text-slate-400 text-sm mt-2 block">פעולה זו לא ניתנת לביטול.</span>
                        </>
                    )}
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold transition-all border border-white/10 hover:border-white/20"
                    >
                        ביטול
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shadow-lg hover:shadow-rose-500/30 active:scale-95"
                    >
                        {isReset ? 'איפוס' : 'מחיקה'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminUnitCard({ unit, editingId, editForm, setEditForm, handleLogoUpload, handleSaveEdit, handleEditClick, handleRemoveClick, updateScore, removeUnit, setEditingId, maxScore }) {
    const isEditing = editingId === unit.id;

    return (
        <div className={clsx(
            "relative flex flex-col gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-5 rounded-2xl border transition-all duration-200 group",
            isEditing
                ? "bg-slate-800/90 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] scale-[1.02] z-10"
                : "bg-slate-800/40 border-white/5 hover:bg-slate-800/60 hover:border-white/10 hover:shadow-xl hover:-translate-y-1"
        )}>
            {/* Header */}
            <div className="flex items-start gap-2 sm:gap-3">
                {/* Logo/Avatar */}
                <div className="relative shrink-0">
                    {isEditing ? (
                        <label className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 flex items-center justify-center cursor-pointer border border-dashed border-slate-600 hover:border-cyan-400 group/upload transition-colors overflow-hidden touch-manipulation">
                            {editForm.logo ? (
                                <img src={editForm.logo} className="w-full h-full object-cover opacity-50 group-hover/upload:opacity-100" />
                            ) : (
                                <Upload size={16} className="sm:w-[18px] sm:h-[18px] text-slate-400 group-hover/upload:text-cyan-400" />
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                    ) : (
                        unit.logo ? (
                            <img src={unit.logo} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-sm bg-white" />
                        ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-slate-400 border border-white/5 text-base sm:text-lg">
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
                                className="bg-slate-900/50 text-white px-2 py-1 rounded border border-cyan-500/50 outline-none w-full font-bold text-xs sm:text-sm lg:text-base"
                            />
                            <div className="flex gap-2 mt-1">
                                <button onClick={handleSaveEdit} className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1 touch-manipulation">
                                    <Save size={12} /> שמירה
                                </button>
                                <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-colors touch-manipulation">ביטול</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-start">
                            <div className="w-full">
                                <div className="font-bold text-sm sm:text-base lg:text-lg text-white truncate w-full" title={unit.name}>{unit.name}</div>
                                <div className="text-[10px] sm:text-xs font-mono text-slate-500">ID: {unit.id}</div>
                            </div>

                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(unit)} className="p-1 sm:p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors touch-manipulation">
                                    <Pen size={12} className="sm:w-[14px] sm:h-[14px]" />
                                </button>
                                <button onClick={() => handleRemoveClick(unit.id, unit.name)} className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors touch-manipulation">
                                    <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Score Controls */}
            <div className="mt-1 sm:mt-2 flex items-center justify-between bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
                <button
                    onClick={() => updateScore(unit.id, -1)}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all active:scale-90 touch-manipulation"
                >
                    <Minus size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">{unit.score}</span>
                </div>

                <button
                    onClick={() => updateScore(unit.id, 1)}
                    disabled={unit.score >= maxScore}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                >
                    <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                </button>
            </div>
        </div>
    );
}
