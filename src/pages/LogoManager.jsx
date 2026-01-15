import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConferenceData } from '../hooks/useConferenceData';
import { ArrowRight, Upload, Trash2, CheckCircle, Search, Grid, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../utils/imageUtils';
import clsx from 'clsx';

export default function LogoManager() {
    const navigate = useNavigate();
    const { logos, addNewLogo, removeLogoArg } = useConferenceData();
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of files) {
                // Determine name from filename (remove extension)
                const name = file.name.replace(/\.[^/.]+$/, "");

                // Compress (150px is good for icons)
                const base64 = await compressImage(file, 150, 0.7);

                await addNewLogo(name, base64);
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This will break any units using this logo.`)) {
            await removeLogoArg(id);
        }
    };

    const filteredLogos = logos.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white font-['Heebo'] p-4 lg:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 bg-slate-800/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowRight size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-cyan-400 to-blue-500">
                                ניהול סמלים
                            </h1>
                            <p className="text-slate-400 mt-1">
                                ספריית סמלים מרכזית ({logos.length} סמלים)
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <label className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer font-bold transition-all shadow-lg
                            ${isUploading ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20 hover:shadow-cyan-500/30'}
                        `}>
                            {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={20} />}
                            <span>{isUploading ? 'מעלה...' : 'העלאת סמלים'}</span>
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </header>

                {/* Search */}
                <div className="mb-6 relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="חיפוש סמל..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                    />
                </div>

                {/* Grid */}
                {logos.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 bg-slate-800/20 rounded-3xl border border-dashed border-white/5">
                        <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold">הספרייה ריקה</h3>
                        <p>העלה סמלים כדי להתחיל להשתמש בהם ביחידות</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {filteredLogos.map(logo => (
                            <div key={logo.id} className="group relative bg-slate-800 rounded-xl p-3 border border-white/5 hover:border-cyan-500/30 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="aspect-square bg-slate-900/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                                    <img src={logo.data} alt={logo.name} className="w-4/5 h-4/5 object-contain" />

                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleDelete(logo.id, logo.name)}
                                            className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                                            title="מחק"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-sm text-slate-300 truncate" title={logo.name}>{logo.name}</div>
                                    <div className="text-[10px] text-slate-600 font-mono mt-0.5 truncate">{logo.id.slice(-6)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
