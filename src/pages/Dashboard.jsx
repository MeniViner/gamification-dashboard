import React, { useState, useEffect, useMemo } from 'react';
import { useConferenceData } from '../hooks/useConferenceData';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Trophy, Users, BarChart3, Store } from 'lucide-react';
import clsx from 'clsx';

// Remove PAGE_SIZE constant
const ROTATION_INTERVAL = 10000;

// Helper function: Get average color from booths
function getUnitAverageColor(unit, availableBooths) {
    if (!unit.booths || unit.booths.length === 0) {
        return '#64748b'; // slate-500 default
    }

    const colors = unit.booths
        .map(boothId => availableBooths.find(b => b.id === boothId)?.color)
        .filter(Boolean);

    if (colors.length === 0) return '#64748b';
    if (colors.length === 1) return colors[0];

    // Simple: return first color as representative
    return colors[0];
}

// Helper function: Create gradient string for progress bar
function createBoothsGradient(unit, availableBooths, maxBooths = 10) {
    if (!unit.booths || unit.booths.length === 0) {
        return 'linear-gradient(to left, transparent, transparent)';
    }

    const colors = unit.booths
        .map(boothId => availableBooths.find(b => b.id === boothId)?.color)
        .filter(Boolean);

    if (colors.length === 0) return 'linear-gradient(to left, #64748b, #64748b)';
    if (colors.length === 1) return `linear-gradient(to left, ${colors[0]}, ${colors[0]})`;

    // Create gradient with equal distribution
    const stops = colors.map((color, idx) => {
        const start = (idx / colors.length) * 100;
        const end = ((idx + 1) / colors.length) * 100;
        return `${color} ${start}%, ${color} ${end}%`;
    }).join(', ');

    return `linear-gradient(to left, ${stops})`;
}

// Helper function: Create VERTICAL gradient for podium (top 3)
function createBoothsGradientVertical(unit, availableBooths) {
    if (!unit.booths || unit.booths.length === 0) {
        return 'linear-gradient(to bottom, transparent, transparent)';
    }

    const colors = unit.booths
        .map(boothId => availableBooths.find(b => b.id === boothId)?.color)
        .filter(Boolean);

    if (colors.length === 0) return 'linear-gradient(to bottom, #64748b, #64748b)';
    if (colors.length === 1) return `linear-gradient(to bottom, ${colors[0]}, ${colors[0]})`;

    // Create vertical gradient with equal distribution
    const stops = colors.map((color, idx) => {
        const start = (idx / colors.length) * 100;
        const end = ((idx + 1) / colors.length) * 100;
        return `${color} ${start}%, ${color} ${end}%`;
    }).join(', ');

    return `linear-gradient(to bottom, ${stops})`;
}


export default function Dashboard() {
    const { units, config, refreshData, getUnitLogo } = useConferenceData();
    const [page, setPage] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const PAGE_SIZE = config?.pageSize || 10;

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Sort and Rank
    const sortedUnits = useMemo(() => {
        let filtered = units;
        // Check explicit false, default is true
        if (config.showZero === false) {
            filtered = units.filter(u => (u.booths && u.booths.length > 0));
        }
        return [...filtered].sort((a, b) => (b.booths?.length || 0) - (a.booths?.length || 0));
    }, [units, config.showZero]);

    // Create placeholder podium data when showZero is enabled and everyone is at 0
    const top3 = useMemo(() => {
        const lockedTop3 = config.lockedTop3 || [null, null, null];

        // Check if we have any locked positions
        const hasLockedPositions = lockedTop3.some(id => id !== null);

        if (hasLockedPositions) {
            // Use locked positions
            return lockedTop3.map((unitId, index) => {
                if (unitId === null) {
                    // Empty slot - show placeholder
                    return {
                        id: `placeholder-${index + 1}`,
                        name: '',
                        booths: [],
                        isPlaceholder: true,
                        isLocked: false
                    };
                }
                // Find the locked unit
                const unit = units.find(u => u.id === unitId);
                if (!unit) {
                    // Unit not found (shouldn't happen, but handle it)
                    return {
                        id: `placeholder-${index + 1}`,
                        name: '',
                        booths: [],
                        isPlaceholder: true,
                        isLocked: false
                    };
                }
                return {
                    ...unit,
                    isLocked: true // Mark as locked for visual indicator
                };
            });
        }

        // Fallback to dynamic top 3 (original logic when nothing is locked)
        const hasAnyScore = sortedUnits.some(u => u.booths && u.booths.length > 0);

        // If showZero is enabled and NO ONE has any booths yet, create placeholders for visual appeal
        if (config.showZero !== false && !hasAnyScore) {
            return [
                { id: 'placeholder-1', name: '', booths: [], isPlaceholder: true, isLocked: false },
                { id: 'placeholder-2', name: '', booths: [], isPlaceholder: true, isLocked: false },
                { id: 'placeholder-3', name: '', booths: [], isPlaceholder: true, isLocked: false }
            ];
        }

        // Otherwise, only show units that actually have booths (never show 0-score units in top 3)
        const unitsWithScore = sortedUnits.filter(u => u.booths && u.booths.length > 0);
        const actualTop3 = unitsWithScore.slice(0, 3).map(u => ({ ...u, isLocked: false }));

        // If showZero is enabled, always fill to 3 positions with placeholders
        if (config.showZero !== false) {
            const result = [...actualTop3];
            while (result.length < 3) {
                result.push({
                    id: `placeholder-${result.length + 1}`,
                    name: '',
                    booths: [],
                    isPlaceholder: true,
                    isLocked: false
                });
            }
            return result;
        }

        // If showZero is disabled, only return units with scores
        return actualTop3;
    }, [sortedUnits, config.showZero, config.lockedTop3, units]);

    // Show ALL units in general ranking (including locked top 3 if they're finished)
    const rest = useMemo(() => {
        return sortedUnits; // Show everyone in the general ranking
    }, [sortedUnits]);
    const totalPages = Math.ceil(rest.length / PAGE_SIZE) || 1;

    // Auto-rotate pages
    useEffect(() => {
        const timer = setInterval(() => {
            setPage((prev) => (prev + 1) % totalPages);
        }, ROTATION_INTERVAL);
        return () => clearInterval(timer);
    }, [totalPages]);

    // Bounds check
    useEffect(() => {
        if (page >= totalPages && totalPages > 0) {
            setPage(0);
        }
    }, [page, totalPages]);

    const currentBatch = rest.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    // Stats
    const availableBooths = config.availableBooths || [];
    const totalFinished = units.filter(u => u.booths?.length >= availableBooths.length).length;
    const totalScore = units.reduce((acc, u) => acc + (u.booths?.length || 0), 0);
    const avgScore = units.length > 0 ? (totalScore / units.length).toFixed(1) : 0;

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-gradient-to-br from-[#0a0e1a] via-[#0d1626] to-[#0a1320] text-white overflow-y-auto lg:overflow-hidden p-3 pt-24 lg:p-6 lg:pt-32 gap-3 lg:gap-6 font-['Heebo'] relative selection:bg-cyan-500/30 select-none cursor-default" dir="rtl">

            {/* Enhanced Background Ambient Glow */}
            <div className="absolute top-[-20%] right-[10%] w-[700px] h-[700px] bg-cyan-400/20 rounded-full blur-[180px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-blue-400/15 rounded-full blur-[200px] pointer-events-none" />
            <div className="absolute top-[30%] left-[30%] w-[600px] h-[600px] bg-sky-300/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-indigo-400/12 rounded-full blur-[140px] pointer-events-none animate-pulse" />

            {/* Header Title with Clock */}
            <div className="absolute top-6 lg:top-10 left-0 w-full flex items-center px-4 lg:px-8 z-40">
                <div className="flex-shrink-0">
                    <DigitalClock currentTime={currentTime} />
                </div>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl lg:text-5xl font-black text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.6)] tracking-wider whitespace-nowrap">
                    כנס הדרכה ז"י | 2026
                </h1>
            </div>

            {/* Absolute Header - Top Left Logos */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 lg:top-5 lg:left-8 lg:translate-x-0 flex gap-2 lg:gap-4 z-50 scale-50 lg:scale-100">
                {/* Logo 1 - Alpha */}
                {/* <img
                    src="/logos/alpha logo1.png"
                    alt="Alpha Logo"
                    className="h-20 w-40 -ml-8 object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                /> */}

                {/* Logo 2 */}
                {/* <img
                    src="/logos/4.png"
                    alt="Partner Logo 2"
                    className="h-20 w-auto mt-1 object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                /> */}

                {/* Logo 3 */}
                <img
                    src="/logos/1.png"
                    alt="Partner Logo 3"
                    className="h-20 w-auto object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                />

                {/* Logo 4 */}
                {/* <img
                    src="/logos/3.svg"
                    alt="Partner Logo 4"
                    className="h-20 w-auto object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                /> */}
            </div>

            {/* Right Sidebar: Stats & Credits */}
            <aside className="w-full lg:w-64 flex flex-col gap-2 lg:gap-3 shrink-0 z-20 order-1 lg:order-none">

                {/* Top: Stats (75%) */}
                <div className="flex-[3] grid grid-cols-2 lg:flex lg:flex-col gap-2 lg:gap-4 bg-slate-800/40 rounded-2xl lg:rounded-3xl p-3 lg:p-5 border border-cyan-400/20 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.3)] relative overflow-hidden">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl pointer-events-none" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-cyan-400/0 rounded-3xl blur-2xl opacity-50 pointer-events-none" />

                    <div className="text-center mb-1 col-span-2 relative z-10">
                        <h2 className="text-xl lg:text-2xl font-black text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                            לוח תוצאות
                        </h2>
                        <div className="w-12 h-1 bg-cyan-400 mx-auto mt-1 lg:mt-2 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
                    </div>

                    <StatCard icon={Users} label="סה״כ יחידות" value={units.length} color="from-blue-400 to-blue-600" />
                    <StatCard icon={Store} label="סוגי דוכנים" value={availableBooths.length} color="from-purple-400 to-purple-600" />
                    <StatCard icon={Trophy} label="סיימו מסלול" value={totalFinished} color="from-amber-400 to-orange-500" />
                    <StatCard icon={BarChart3} label="ניקוד כולל" value={totalScore} color="from-emerald-400 to-emerald-600" />
                </div>

                {/* Bottom: Secret Refresh Button (Banner Image) */}
                <div
                    onClick={async () => {
                        if (!isRefreshing) {
                            setIsRefreshing(true);
                            await refreshData();
                            setTimeout(() => setIsRefreshing(false), 500);
                        }
                    }}
                    className={clsx(
                        "flex-[1] flex items-center justify-center bg-slate-900/60 rounded-2xl lg:rounded-3xl p-2 lg:p-4 border border-cyan-400/20 backdrop-blur-xl relative overflow-hidden group shadow-[0_0_40px_rgba(6,182,212,0.2)] cursor-pointer transition-all",
                        isRefreshing && "opacity-60"
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 group-active:opacity-50 transition-opacity" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                    <img
                        src="/logos/al_log_ban.png"
                        alt="Alpha Banner"
                        className={clsx(
                            "w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-110 group-hover:drop-shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all group-active:scale-105",
                            isRefreshing && "animate-pulse"
                        )}
                    />
                </div>
            </aside>

            {/* Left Side: Booths Legend */}
            <aside className="hidden lg:flex w-48 flex-col gap-4 shrink-0 z-20 order-3 bg-slate-800/20 rounded-2xl p-4 border border-cyan-400/10 backdrop-blur-md">
                <h3 className="text-xl font-black text-cyan-400 mb-2">מקרא דוכנים</h3>
                {availableBooths.map((booth) => (
                    <div key={booth.id} className="flex items-center gap-3 py-1.5">
                        <div className="w-5 h-5 rounded-full shrink-0 shadow-lg ring-2 ring-white/20" style={{ backgroundColor: booth.color }} />
                        <span className="text-white font-bold text-lg leading-tight" title={booth.name}>{booth.name}</span>
                    </div>
                ))}
                {availableBooths.length === 0 && (
                    <div className="text-base text-slate-500 text-center py-4">
                        אין דוכנים זמינים
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-6 z-20 order-2 lg:order-none">

                {/* Center-Right: Podium (Top 3) */}
                <section className="flex-[1.5] flex flex-col bg-slate-800/20 rounded-2xl lg:rounded-3xl p-4 lg:p-8 border border-cyan-400/10 backdrop-blur-md relative shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />

                    <h2 className="text-lg lg:text-2xl font-bold mb-4 lg:mb-8 text-center text-white/90 flex items-center justify-center gap-2 lg:gap-3 relative z-10">
                        <div className="p-1.5 lg:p-2 bg-yellow-500/20 rounded-lg text-yellow-400"><Trophy className="w-4 h-4 lg:w-6 lg:h-6" /></div>
                        המובילים
                    </h2>

                    <div className="flex-1 flex items-end justify-center gap-3 lg:gap-6 pb-4 lg:pb-8">
                        <LayoutGroup id="podium">
                            {/* Silver (2nd) */}
                            {top3[1] && <PodiumBar unit={top3[1]} rank={2} color="from-slate-300 via-slate-400 to-slate-500" height="60%" delay={0.2} availableBooths={availableBooths} />}

                            {/* Gold (1st) */}
                            {top3[0] && <PodiumBar unit={top3[0]} rank={1} color="from-yellow-300 via-yellow-500 to-yellow-600" height="85%" delay={0} availableBooths={availableBooths} />}

                            {/* Bronze (3rd) */}
                            {top3[2] && <PodiumBar unit={top3[2]} rank={3} color="from-orange-300 via-orange-400 to-orange-500" height="45%" delay={0.4} availableBooths={availableBooths} />}
                        </LayoutGroup>
                    </div>
                </section>

                {/* Left: Carousel (Rank 4-40) */}
                <section className="flex-[3] flex flex-col bg-slate-800/20 rounded-2xl lg:rounded-3xl p-4 lg:py-8 lg:px-4 border border-cyan-400/20 backdrop-blur-md overflow-hidden relative shadow-[0_0_60px_rgba(6,182,212,0.25)]">
                    {/* Inner glow effects */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/8 via-blue-400/5 to-sky-400/8 rounded-3xl pointer-events-none" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/15 via-blue-400/15 to-purple-400/15 rounded-3xl blur-2xl opacity-40 pointer-events-none" />
                    <div className="flex justify-between items-center mb-3 lg:mb-6 px-1 lg:px-2">
                        <h2 className="text-lg lg:text-2xl font-bold text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)] relative z-10">דירוג כללי</h2>
                        <div className="text-xs lg:text-sm font-bold text-cyan-300 bg-slate-900/60 px-2 lg:px-4 py-1 lg:py-1.5 rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] relative z-10">
                            עמוד {page + 1} / {totalPages}
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 content-start gap-3">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={page}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full flex flex-col gap-3"
                            >
                                <LayoutGroup id={`batch-${page}`}>
                                    {currentBatch.map((unit) => (
                                        <RankRow key={unit.id} unit={unit} availableBooths={availableBooths} />
                                    ))}
                                </LayoutGroup>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-2 lg:bottom-4 left-0 w-full flex justify-center items-center gap-1.5 lg:gap-2 z-10">
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const isActive = i === page;
                            return (
                                <div key={i} className="relative flex items-center justify-center">
                                    <motion.div
                                        layout
                                        initial={false}
                                        animate={{
                                            width: isActive ? 32 : 6,
                                            backgroundColor: isActive ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.2)"
                                        }}
                                        className={clsx(
                                            "h-2 rounded-full backdrop-blur-sm transition-colors duration-300",
                                            !isActive && "hover:bg-white/40 cursor-pointer"
                                        )}
                                        onClick={() => setPage(i)}
                                    >
                                        {isActive && (
                                            <motion.div
                                                className="h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: ROTATION_INTERVAL / 1000, ease: "linear" }}
                                            />
                                        )}
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </section>

            </div>
        </div>
    );
}

// Sub-components
function DigitalClock({ currentTime }) {
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');

    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();

    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayName = days[currentTime.getDay()];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-xl lg:rounded-2xl px-4  py-2 lg:py-3 border border-cyan-400/40 shadow-[0_0_50px_rgba(6,182,212,0.4)] relative overflow-hidden"
            dir="ltr"
        >
            {/* Enhanced Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 pointer-events-none" />
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-sky-400/30 rounded-2xl blur-xl opacity-60 pointer-events-none animate-pulse" />

            <div className="relative z-10 flex items-center gap-2 lg:gap-3">
                {/* Time Display - LTR */}
                <div className="flex items-center gap-1 lg:gap-1.5">
                    <div className="relative inline-block">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={hours}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-xl lg:text-3xl font-black font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] absolute inset-0"
                            >
                                {hours}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-xl lg:text-3xl font-black font-mono opacity-0">{hours}</span>
                    </div>
                    <span className="text-xl lg:text-3xl font-black text-cyan-500/50 animate-pulse">:</span>
                    <div className="relative inline-block">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={minutes}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-xl lg:text-3xl font-black font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] absolute inset-0"
                            >
                                {minutes}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-xl lg:text-3xl font-black font-mono opacity-0">{minutes}</span>
                    </div>
                    <span className="text-lg lg:text-2xl font-black text-cyan-500/50 animate-pulse">:</span>
                    <div className="relative inline-block">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={seconds}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-lg lg:text-2xl font-black font-mono text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] absolute inset-0"
                            >
                                {seconds}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-lg lg:text-2xl font-black font-mono opacity-0">{seconds}</span>
                    </div>
                </div>

                {/* Separator */}
                <div className="w-px h-6 lg:h-8 bg-cyan-500/30" />

                {/* Date Display */}
                <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="text-xs lg:text-xl mt-1 font-bold text-slate-300 whitespace-nowrap">
                        {day}/{month}/26
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-slate-900/40 p-2 lg:p-4 rounded-xl lg:rounded-2xl border border-cyan-400/10 flex items-center gap-3 lg:gap-5 hover:bg-slate-900/60 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={clsx("p-2 lg:p-3.5 rounded-lg lg:rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all relative z-10", color)}>
                <Icon size={18} className="lg:w-[26px] lg:h-[26px] text-white drop-shadow-md" />
            </div>
            <div className="relative z-10">
                <div className="text-xl lg:text-3xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{value}</div>
                <div className="text-xs lg:text-sm font-medium text-slate-400">{label}</div>
            </div>
        </div>
    );
}

function UnitLogo({ unit, className }) {
    const { getUnitLogo } = useConferenceData();

    // We can use the hook here, as long as this component isn't inside a tight loop that creates new hook instances every render (which it isn't).
    // However, if we want to avoid re-renders, passing it as a prop is better.
    // Given the previous attempt failed, let's just use the hook for simplicity and correctness now.

    const logoSrc = getUnitLogo(unit);

    if (logoSrc) {
        return (
            <img
                src={logoSrc}
                alt={unit.name || 'Unit'}
                className={clsx("rounded-full border-2 border-slate-600/50 shadow-lg object-cover bg-white", className)}
            />
        );
    }
    // Fallback - check if name exists
    if (!unit.name) {
        // Return empty placeholder for units without names
        return (
            <div className={clsx("rounded-full border-2 border-slate-600/50 shadow-lg bg-slate-700", className)} />
        );
    }
    const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(unit.name)}&background=random&color=fff&bold=true`;
    return (
        <img
            src={url}
            alt={unit.name}
            className={clsx("rounded-full border-2 border-slate-600/50 shadow-lg", className)}
        />
    );
}

function PodiumBar({ unit, rank, color, height, delay, availableBooths }) {
    const gradient = createBoothsGradientVertical(unit, availableBooths);

    // Calculate progress percentage relative to total available booths
    const totalBooths = Math.max(availableBooths.length, 1);
    const unitBooths = unit.booths?.length || 0;
    const progressPercent = Math.min(100, (unitBooths / totalBooths) * 100);

    // Check if this is a placeholder
    const isPlaceholder = unit.isPlaceholder === true;

    return (
        <motion.div
            layoutId={`unit-${unit.id}`}
            className="flex flex-col items-center justify-end w-1/3 max-w-[100px] relative z-10"
            style={{ height: "100%" }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
            {!isPlaceholder && (
                <div className="mb-2 lg:mb-4 text-center flex flex-col items-center gap-1 lg:gap-2 relative">
                    {/* Lock indicator for locked positions */}
                    {unit.isLocked && (
                        <div className="absolute -top-1 -right-1 lg:-top-2 lg:-right-2 bg-yellow-500 rounded-full p-1 lg:p-1.5 shadow-lg ring-2 ring-yellow-400/50 z-20">
                            <span className="text-xs lg:text-sm">🔒</span>
                        </div>
                    )}
                    <UnitLogo unit={unit} className="w-10 h-10 lg:w-14 lg:h-14 ring-2 lg:ring-4 ring-black/20" />
                    <motion.div
                        className="text-xs lg:text-sm font-bold text-slate-200 bg-slate-900/60 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full border border-white/10 backdrop-blur-sm mt-0.5 lg:mt-1 shadow-lg whitespace-nowrap"
                        layout
                    >
                        {unit.name}
                    </motion.div>
                    <div className="font-mono font-black text-white text-xl lg:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{unit.booths?.length || 0}</div>
                </div>
            )}

            {/* Podium Pillar Container (Track) */}
            <motion.div
                className="w-full rounded-t-2xl relative shadow-[0_0_40px_rgba(6,182,212,0.4)] border-x border-t border-cyan-400/30 overflow-hidden bg-slate-900/60 backdrop-blur-sm"
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
            >
                {/* Background Track Pattern/Glow */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />

                {/* Progress Bar (Fill) */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 w-full"
                    style={{ background: gradient }}
                    initial={{ height: 0 }}
                    animate={{ height: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 40, damping: 20, delay: 0.2 }}
                >
                    {/* Top shine for the fill */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50 shadow-[0_0_10px_white]" />
                </motion.div>

                <div className="absolute top-2 lg:top-4 w-full text-center font-black text-white text-3xl lg:text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-40 mix-blend-overlay z-20 pointer-events-none">
                    {rank}
                </div>

                {/* Enhanced Hover Glow effect (on the whole pillar) */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>

            <div className="mt-1 lg:mt-3 font-bold text-slate-400 text-xs lg:text-sm tracking-widest">מקום {rank}</div>
        </motion.div>
    );
}

// Helper component for scrolling text when name is too long
function ScrollingText({ text, className }) {
    const textRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const [shouldScroll, setShouldScroll] = React.useState(false);

    React.useEffect(() => {
        if (textRef.current && containerRef.current) {
            const textWidth = textRef.current.scrollWidth;
            const containerWidth = containerRef.current.clientWidth;
            setShouldScroll(textWidth > containerWidth);
        }
    }, [text]);

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden ${className}`}
            style={shouldScroll ? { '--container-width': `${containerRef.current?.clientWidth || 0}px` } : {}}
        >
            <div
                ref={textRef}
                className={shouldScroll ? 'inline-block whitespace-nowrap' : 'truncate'}
                style={shouldScroll ? {
                    animation: 'scroll-text 4s linear infinite',
                } : {}}
            >
                {text}
            </div>
        </div>
    );
}

function RankRow({ unit, availableBooths }) {
    const totalBooths = availableBooths.length;
    const unitBooths = unit.booths?.length || 0;
    const barWidth = `${Math.min(100, (unitBooths / Math.max(totalBooths, 1)) * 100)}%`;
    const gradient = createBoothsGradient(unit, availableBooths);

    return (
        <motion.div
            layoutId={`row-${unit.id}`}
            className="flex items-center gap-2 lg:gap-4 py-2 lg:py-3 transition-all group relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className="w-6 lg:w-8 font-mono text-slate-500 text-xs lg:text-sm font-bold text-center group-hover:text-cyan-400 transition-colors">
                #{unit.id}
            </div>

            <UnitLogo unit={unit} className="w-8 h-8 lg:w-10 lg:h-10 shrink-0" />

            <ScrollingText
                text={unit.name}
                className="w-28 lg:w-28 font-bold text-slate-200 group-hover:text-white transition-colors text-sm lg:text-lg"
            />

            {/* Bar */}
            <div className="flex-1 h-2.5 lg:h-3.5 bg-black/40 rounded-full overflow-hidden relative shadow-inner cursor-default">
                <motion.div
                    layout
                    className="h-full rounded-full shadow-[0_0_20px_rgba(6,182,212,0.7)] relative group-hover:shadow-[0_0_30px_rgba(6,182,212,0.9)]"
                    style={{ background: gradient }}
                    initial={{ width: 0 }}
                    animate={{ width: barWidth }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                >
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30" />
                </motion.div>
            </div>

            <div className="w-10 lg:w-6 font-mono font-black text-white text-right text-base lg:text-xl drop-shadow-sm">
                {unitBooths}
            </div>
        </motion.div>
    );
}
