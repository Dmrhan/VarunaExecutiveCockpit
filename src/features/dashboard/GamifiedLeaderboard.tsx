import { useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { Trophy, Medal, Flame, Target, Crown, Star, ChevronDown, ChevronUp, Zap, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

// Mock function to generate deterministic trend data
const generateTrendData = (seed: string) => {
    const data = [];
    let value = 50;
    for (let i = 0; i < 6; i++) {
        const change = (seed.charCodeAt(i % seed.length) % 40) - 20;
        value = Math.max(10, Math.min(100, value + change));
        data.push({ value });
    }
    return data;
};

import type { Deal } from '../../types/crm';

interface GamifiedLeaderboardProps {
    deals?: Deal[];
}

export function GamifiedLeaderboard({ deals: propDeals }: GamifiedLeaderboardProps) {
    const { t } = useTranslation();
    const { deals: contextDeals, users } = useData();
    const deals = propDeals || contextDeals;
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const leaderboardData = useMemo(() => {
        // Calculate Team Averages for Comparison
        const teamRevenue = deals.filter(d => ['Kazanıldı', 'Order'].includes(d.stage)).reduce((sum, d) => sum + d.value, 0);
        const activeReps = users.filter(u => u.role === 'sales_rep').length;
        const avgRevenue = activeReps > 0 ? teamRevenue / activeReps : 0;

        const stats = users
            .filter(u => u.role === 'sales_rep')
            .map(user => {
                const userDeals = deals.filter(d => d.ownerId === user.id);
                const wonDeals = userDeals.filter(d => ['Kazanıldı', 'Order'].includes(d.stage));
                const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
                const dealCount = wonDeals.length;
                const totalDeals = userDeals.length;
                const winRate = totalDeals > 0 ? (dealCount / totalDeals) * 100 : 0;

                // Advanced Overall Score Calculation (Weighted)
                // Normalize metrics roughly to 0-100 scale then apply weights
                const normalizedRevenue = Math.min(100, (totalRevenue / 5000000) * 100); // Target $5M
                const normalizedWinRate = Math.min(100, winRate * 1.5); // Target ~66% winrate
                const normalizedActivity = Math.min(100, (dealCount / 10) * 100); // Target 10 deals

                const overallScore = (normalizedRevenue * 0.50) + (normalizedWinRate * 0.30) + (normalizedActivity * 0.20);

                const trendData = generateTrendData(user.name);
                const isTrendingUp = trendData[trendData.length - 1].value > trendData[0].value;

                return {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    revenue: totalRevenue,
                    winRate,
                    dealCount,
                    overallScore,
                    trendData,
                    isTrendingUp,
                    comparisons: {
                        vsAvgRevenue: ((totalRevenue - avgRevenue) / avgRevenue) * 100,
                    },
                    streak: Math.floor(Math.random() * 8) + 2
                };
            })
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 10);

        return stats;
    }, [deals, users]);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown size={20} className="text-yellow-500 fill-yellow-500 animate-pulse" />;
            case 1: return <Medal size={20} className="text-slate-400 fill-slate-400" />;
            case 2: return <Medal size={20} className="text-amber-700 fill-amber-700" />;
            default: return <span className="text-sm font-bold text-slate-500 dark:text-slate-400 w-5 text-center">#{index + 1}</span>;
        }
    };

    const getBadges = (performer: any, index: number) => {
        const badges = [];
        if (index === 0) badges.push({
            icon: <Trophy size={10} />,
            color: 'bg-yellow-500 text-white',
            text: t('gamification.badges.mvp.title'),
            desc: t('gamification.badges.mvp.desc', { score: performer.overallScore.toFixed(0) })
        });
        if (performer.winRate > 40) badges.push({
            icon: <Target size={10} />,
            color: 'bg-emerald-500 text-white',
            text: t('gamification.badges.sniper.title'),
            desc: t('gamification.badges.sniper.desc', { rate: performer.winRate.toFixed(1) })
        });
        if (performer.revenue > 3000000) badges.push({
            icon: <Star size={10} />,
            color: 'bg-indigo-500 text-white',
            text: t('gamification.badges.rainmaker.title'),
            desc: t('gamification.badges.rainmaker.desc', { revenue: formatCurrency(performer.revenue) })
        });
        if (performer.streak > 3) badges.push({
            icon: <Flame size={10} />,
            color: 'bg-orange-500 text-white',
            text: t('gamification.badges.streak.title', { count: performer.streak }),
            desc: t('gamification.badges.streak.desc', { count: performer.streak })
        });
        return badges;
    };

    const toggleExpand = (id: string) => {
        setExpandedUserId(expandedUserId === id ? null : id);
    };

    return (
        <Card className="h-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0 border-b border-slate-100 dark:border-white/5 pb-4 bg-white/50 dark:bg-slate-700/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Trophy size={16} className="text-indigo-500" />
                            {t('gamification.title')}
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Activity size={10} />
                            {t('gamification.subtitle')}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-auto">
                <div className="flex flex-col">
                    {leaderboardData.map((performer, index) => {
                        const isExpanded = expandedUserId === performer.id;
                        return (
                            <motion.div
                                key={performer.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    "border-b border-slate-100 dark:border-white/5 transition-all cursor-pointer",
                                    isExpanded ? "bg-indigo-50/50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5",
                                    index === 0 && !isExpanded ? "bg-amber-50/30 dark:bg-amber-500/5" : ""
                                )}
                                onClick={() => toggleExpand(performer.id)}
                            >
                                {/* Main Row */}
                                <div className="flex items-center gap-4 p-4">
                                    {/* Rank */}
                                    <div className="w-8 flex justify-center flex-shrink-0">
                                        {getRankIcon(index)}
                                    </div>

                                    {/* Avatar & Basic Info */}
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-600 overflow-hidden shadow-sm">
                                                <img src={performer.avatar} alt={performer.name} className="w-full h-full object-cover" />
                                            </div>
                                            {index === 0 && (
                                                <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[8px] px-1 rounded-full font-bold shadow-sm border border-white dark:border-slate-900">
                                                    #1
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "text-sm font-bold truncate",
                                                index === 0 ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
                                            )}>
                                                {performer.name}
                                            </span>
                                            <div className="flex gap-1 flex-wrap mt-0.5">
                                                {getBadges(performer, index).map((b, i) => (
                                                    <div key={i} className={cn("text-[9px] px-1.5 py-0 rounded-full flex items-center gap-1 font-semibold", b.color)}>
                                                        {b.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sparkline Trend */}
                                    <div className="hidden sm:block w-16 h-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={performer.trendData}>
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={performer.isTrendingUp ? "#10b981" : "#f43f5e"}
                                                    strokeWidth={2}
                                                    dot={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Overall Score */}
                                    <div className="flex flex-col items-end flex-shrink-0 min-w-[60px]">
                                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                            {performer.overallScore.toFixed(0)}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{t('gamification.score')}</span>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="text-slate-400">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {/* Expanded Detail View (Explainability) */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 pt-0 pl-16 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                                                {/* AI Insights / Why I Won */}
                                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                                                    <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
                                                        <Zap size={12} className="fill-current" />
                                                        {t('gamification.whyScore')}
                                                    </h4>
                                                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                                                        <li className="flex items-start gap-1.5">
                                                            <div className="mt-0.5 w-1 h-1 rounded-full bg-indigo-500" />
                                                            <span>
                                                                <Trans
                                                                    i18nKey="gamification.revenueInsight"
                                                                    values={{
                                                                        revenue: formatCurrency(performer.revenue),
                                                                        percentage: performer.comparisons.vsAvgRevenue.toFixed(0)
                                                                    }}
                                                                    components={{ 1: <strong className="text-slate-900 dark:text-white" />, 3: <strong className="text-emerald-600" /> }}
                                                                />
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-1.5">
                                                            <div className="mt-0.5 w-1 h-1 rounded-full bg-indigo-500" />
                                                            <span>
                                                                <Trans
                                                                    i18nKey="gamification.winRateInsight"
                                                                    values={{
                                                                        rate: performer.winRate.toFixed(0),
                                                                        status: performer.winRate > 40 ? t('executiveBrief.kpis.strongSignal') : t('executiveBrief.kpis.needsAttention')
                                                                    }}
                                                                    components={{ 1: <strong className="text-slate-900 dark:text-white" /> }}
                                                                />
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-1.5">
                                                            <div className="mt-0.5 w-1 h-1 rounded-full bg-indigo-500" />
                                                            <span>
                                                                {performer.isTrendingUp
                                                                    ? t('gamification.trendingUp')
                                                                    : t('gamification.trendingDown')}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                {/* Comparison Stats */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">{t('gamification.revenueTrend')}</span>
                                                        <div className="flex items-center gap-1">
                                                            {performer.comparisons.vsAvgRevenue > 0
                                                                ? <ArrowUpRight size={14} className="text-emerald-500" />
                                                                : <ArrowDownRight size={14} className="text-rose-500" />}
                                                            <span className={cn("font-bold", performer.comparisons.vsAvgRevenue > 0 ? "text-emerald-600" : "text-rose-600")}>
                                                                %{Math.abs(performer.comparisons.vsAvgRevenue).toFixed(0)}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400">{t('gamification.vsTeam')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">{t('gamification.nextAction')}</span>
                                                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                            <Target size={14} className="text-indigo-500" />
                                                            <span className="font-medium">{t('gamification.closeDeal')}</span>
                                                        </div>
                                                        <span className="text-[8px] text-slate-400 block mt-0.5">{t('gamification.reachMaster')}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
