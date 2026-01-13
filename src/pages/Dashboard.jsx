import React, { useState, useEffect, useMemo } from 'react';
import { useConferenceData } from '../hooks/useConferenceData';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Trophy, Users, BarChart3, Store } from 'lucide-react';
import clsx from 'clsx';

// Remove PAGE_SIZE constant
const ROTATION_INTERVAL = 10000;

export default function Dashboard() {
    const { units, config } = useConferenceData();
    const [page, setPage] = useState(0);

    const PAGE_SIZE = config?.pageSize || 10;

    // Sort and Rank
    const sortedUnits = useMemo(() => {
        let filtered = units;
        // Check explicit false, default is true
        if (config.showZero === false) {
            filtered = units.filter(u => u.score > 0);
        }
        return [...filtered].sort((a, b) => b.score - a.score);
    }, [units, config.showZero]);

    const top3 = useMemo(() => sortedUnits.slice(0, 3), [sortedUnits]);
    const rest = useMemo(() => sortedUnits.slice(3), [sortedUnits]);
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
    const totalFinished = units.filter(u => u.score >= 10).length;
    const totalScore = units.reduce((acc, u) => acc + u.score, 0);
    const avgScore = units.length > 0 ? (totalScore / units.length).toFixed(1) : 0;

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-[#0d1626] text-white overflow-y-auto lg:overflow-hidden p-3 pt-24 lg:p-6 lg:pt-32 gap-3 lg:gap-6 font-['Heebo'] relative selection:bg-cyan-500/30 select-none cursor-default" dir="rtl">

            {/* Background Ambient Glow */}
            <div className="absolute top-[-20%] right-[10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />

            {/* Header Title */}
            <h1 className="absolute top-6 lg:top-10 left-0 w-full text-center text-2xl lg:text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] z-40 tracking-wider">
                כנס מדריכים ז"י | 2026
            </h1>

            {/* Absolute Header - Top Left Logos */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 lg:top-8 lg:left-8 lg:translate-x-0 flex gap-2 lg:gap-4 z-50 scale-50 lg:scale-100">
                {/* Logo 1 - Alpha */}
                <img
                    src="/logos/alpha logo1.png"
                    alt="Alpha Logo"
                    className="h-20 w-40 -ml-8 object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                />

                {/* Logo 2 */}
                <img
                    src="/logos/4.png"
                    alt="Partner Logo 2"
                    className="h-20 w-auto mt-1 object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                />

                {/* Logo 3 */}
                <img
                    src="/logos/1.png"
                    alt="Partner Logo 3"
                    className="h-20 w-auto object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                />

                {/* Logo 4 */}
                <img
                    src="/logos/3.svg"
                    alt="Partner Logo 4"
                    className="h-20 w-auto object-cover drop-shadow-xl hover:scale-105 transition-transform cursor-pointer"
                />
            </div>

            {/* Right Sidebar: Stats & Credits */}
            <aside className="w-full lg:w-72 flex flex-col gap-3 lg:gap-4 shrink-0 z-20 order-1 lg:order-none">

                {/* Top: Stats (75%) */}
                <div className="flex-[3] grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:gap-6 bg-slate-800/40 rounded-2xl lg:rounded-3xl p-4 lg:p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="text-center mb-2 col-span-2">
                        <h2 className="text-xl lg:text-3xl font-black text-white drop-shadow-md">
                            לוח תוצאות
                        </h2>
                        <div className="w-12 h-1 bg-cyan-500 mx-auto mt-2 lg:mt-4 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    </div>

                    <StatCard icon={Users} label="סה״כ יחידות" value={units.length} color="from-blue-400 to-blue-600" />
                    <StatCard icon={Store} label="מספר דוכנים" value={config.maxScore || 10} color="from-purple-400 to-purple-600" />
                    <StatCard icon={Trophy} label="סיימו מסלול" value={totalFinished} color="from-amber-400 to-orange-500" />
                    <StatCard icon={BarChart3} label="ניקוד כולל" value={totalScore} color="from-emerald-400 to-emerald-600" />
                </div>

                {/* Bottom: Banner Image */}
                <div className="flex-[1] flex items-center justify-center bg-slate-900/60 rounded-2xl lg:rounded-3xl p-2 lg:p-4 border border-white/5 backdrop-blur-xl relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                        src="/logos/al_log_ban.png"
                        alt="Alpha Banner"
                        className="w-full h-full object-contain relative z-10 drop-shadow-xl scale-110"
                    />
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-6 z-20 order-2 lg:order-none">

                {/* Center-Right: Podium (Top 3) */}
                <section className="flex-[1.5] flex flex-col bg-slate-800/20 rounded-2xl lg:rounded-3xl p-4 lg:p-8 border border-white/5 backdrop-blur-md relative shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />

                    <h2 className="text-lg lg:text-2xl font-bold mb-4 lg:mb-8 text-center text-white/90 flex items-center justify-center gap-2 lg:gap-3">
                        <div className="p-1.5 lg:p-2 bg-yellow-500/20 rounded-lg text-yellow-500"><Trophy className="w-4 h-4 lg:w-6 lg:h-6" /></div>
                        המובילים
                    </h2>

                    <div className="flex-1 flex items-end justify-center gap-3 lg:gap-6 pb-4 lg:pb-8">
                        <LayoutGroup id="podium">
                            {/* Silver (2nd) */}
                            {top3[1] && <PodiumBar unit={top3[1]} rank={2} color="from-slate-300 via-slate-400 to-slate-500" height="60%" delay={0.2} />}

                            {/* Gold (1st) */}
                            {top3[0] && <PodiumBar unit={top3[0]} rank={1} color="from-yellow-300 via-yellow-500 to-yellow-600" height="85%" delay={0} />}

                            {/* Bronze (3rd) */}
                            {top3[2] && <PodiumBar unit={top3[2]} rank={3} color="from-orange-300 via-orange-400 to-orange-500" height="45%" delay={0.4} />}
                        </LayoutGroup>
                    </div>
                </section>

                {/* Left: Carousel (Rank 4-40) */}
                <section className="flex-[3] flex flex-col bg-slate-800/20 rounded-2xl lg:rounded-3xl p-4 lg:p-8 border border-white/5 backdrop-blur-md overflow-hidden relative shadow-2xl">
                    <div className="flex justify-between items-center mb-3 lg:mb-6 px-1 lg:px-2">
                        <h2 className="text-lg lg:text-2xl font-bold text-cyan-400 drop-shadow-sm">דירוג כללי</h2>
                        <div className="text-xs lg:text-sm font-bold text-slate-300 bg-slate-900/60 px-2 lg:px-4 py-1 lg:py-1.5 rounded-full border border-white/10">
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
                                        <RankRow key={unit.id} unit={unit} maxScore={config.maxScore || 10} />
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
function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-slate-900/40 p-2 lg:p-4 rounded-xl lg:rounded-2xl border border-white/5 flex items-center gap-3 lg:gap-5 hover:bg-slate-900/60 transition-colors group">
            <div className={clsx("p-2 lg:p-3.5 rounded-lg lg:rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform", color)}>
                <Icon size={18} className="lg:w-[26px] lg:h-[26px] text-white drop-shadow-md" />
            </div>
            <div>
                <div className="text-xl lg:text-3xl font-black font-mono text-white tracking-tight drop-shadow-sm">{value}</div>
                <div className="text-xs lg:text-sm font-medium text-slate-400">{label}</div>
            </div>
        </div>
    );
}

function UnitLogo({ unit, className }) {
    if (unit.logo) {
        return (
            <img
                src={unit.logo}
                alt={unit.name}
                className={clsx("rounded-full border-2 border-slate-600/50 shadow-lg object-cover bg-white", className)}
            />
        );
    }
    // Fallback
    const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(unit.name)}&background=random&color=fff&bold=true`;
    return (
        <img
            src={url}
            alt={unit.name}
            className={clsx("rounded-full border-2 border-slate-600/50 shadow-lg", className)}
        />
    );
}

function PodiumBar({ unit, rank, color, height, delay }) {
    return (
        <motion.div
            layoutId={`unit-${unit.id}`}
            className="flex flex-col items-center justify-end w-1/3 max-w-[120px] relative z-10"
            style={{ height: "100%" }}
            transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
            <div className="mb-2 lg:mb-4 text-center flex flex-col items-center gap-1 lg:gap-2">
                <UnitLogo unit={unit} className="w-10 h-10 lg:w-14 lg:h-14 ring-2 lg:ring-4 ring-black/20" />
                <motion.div
                    className="text-xs lg:text-sm font-bold text-slate-200 bg-slate-900/60 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full border border-white/10 backdrop-blur-sm mt-0.5 lg:mt-1 shadow-lg whitespace-nowrap"
                    layout
                >
                    {unit.name}
                </motion.div>
                <div className="font-mono font-black text-white text-xl lg:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{unit.score}</div>
            </div>

            <motion.div
                className={clsx("w-full rounded-t-2xl relative group shadow-2xl border-x border-t border-white/20", `bg-gradient-to-b ${color}`)}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
            >
                <div className="absolute top-2 lg:top-4 w-full text-center font-black text-white text-3xl lg:text-5xl drop-shadow-md opacity-40 mix-blend-overlay">
                    {rank}
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
            </motion.div>

            <div className="mt-1 lg:mt-3 font-bold text-slate-400 text-xs lg:text-sm tracking-widest">מקום {rank}</div>
        </motion.div>
    );
}

function RankRow({ unit, maxScore }) {
    const barWidth = `${Math.min(100, (unit.score / (maxScore || 10)) * 100)}%`;

    return (
        <motion.div
            layoutId={`row-${unit.id}`}
            className="flex items-center gap-2 lg:gap-4 p-2 lg:p-3 bg-slate-900/30 rounded-xl border border-white/5 hover:bg-slate-900/50 transition-colors group relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            <div className="w-6 lg:w-8 font-mono text-slate-500 text-xs lg:text-sm font-bold text-center group-hover:text-cyan-400 transition-colors">
                #{unit.id}
            </div>

            <UnitLogo unit={unit} className="w-8 h-8 lg:w-10 lg:h-10 shrink-0" />

            <div className="w-20 lg:w-32 font-bold text-slate-200 truncate group-hover:text-white transition-colors text-sm lg:text-lg" title={unit.name}>
                {unit.name}
            </div>

            {/* Bar */}
            <div className="flex-1 h-2.5 lg:h-3.5 bg-black/40 rounded-full overflow-hidden relative shadow-inner cursor-default">
                <motion.div
                    layout
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] relative"
                    initial={{ width: 0 }}
                    animate={{ width: barWidth }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                >
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-white/30" />
                </motion.div>
            </div>

            <div className="w-10 lg:w-12 font-mono font-black text-white text-right text-base lg:text-xl drop-shadow-sm">
                {unit.score}
            </div>
        </motion.div>
    );
}
