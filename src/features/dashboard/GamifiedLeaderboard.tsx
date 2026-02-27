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

import type { Deal, Order } from '../../types/crm';

interface GamifiedLeaderboardProps {
    deals?: Deal[];
    orders?: Order[];
}

export function GamifiedLeaderboard({ deals: propDeals, orders: propOrders }: GamifiedLeaderboardProps) {
    const { t } = useTranslation();
    const { deals: contextDeals, orders: contextOrders, users } = useData();
    const deals = propDeals || contextDeals;
    const orders = propOrders || contextOrders;
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const leaderboardData = useMemo(() => {
        // Calculate Team Averages for Comparison based purely on Invoiced Amount
        const teamInvoicedAmount = orders.filter(o => o.status === 'Closed').reduce((sum, o) => sum + o.amount, 0);
        const activeReps = users.filter(u => u.role === 'sales_rep').length;
        const avgInvoiced = activeReps > 0 ? teamInvoicedAmount / activeReps : 0;

        const stats = users
            .filter(u => u.role === 'sales_rep')
            .map(user => {
                const userDeals = deals.filter(d => d.ownerId === user.id);
                const wonDeals = userDeals.filter(d => ['Kazanıldı', 'Order'].includes(d.stage));
                const dealCount = wonDeals.length;
                const totalDeals = userDeals.length;
                const winRate = totalDeals > 0 ? (dealCount / totalDeals) * 100 : 0;

                const userOrders = orders.filter(o => o.salesRepId === user.id && o.status === 'Closed');
                const invoicedAmount = userOrders.reduce((sum, o) => sum + o.amount, 0);

                return {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    revenue: invoicedAmount,
                    invoicedAmount,
                    winRate,
                    dealCount,
                    // Temporary zero for now, we will calculate relative score in a second pass
                    overallScore: 0,
                };
            });

        // Second pass: Calculate relative scores based on dataset maximums
        const maxInvoiced = Math.max(...stats.map(s => s.invoicedAmount), 1);
        const maxDeals = Math.max(...stats.map(s => s.dealCount), 1);

        const scoredStats = stats.map(stat => {
            // Relative normalization (0-100)
            const normalizedInvoiced = (stat.invoicedAmount / maxInvoiced) * 100;
            const normalizedWinRate = stat.winRate; // Already 0-100
            const normalizedActivity = (stat.dealCount / maxDeals) * 100;

            // Updated weights: Revenue is king (60%), Win Rate (25%), Activity (15%)
            let overallScore = (normalizedInvoiced * 0.60) + (normalizedWinRate * 0.25) + (normalizedActivity * 0.15);

            // Add a small boost for purely invoiced amount to ensure monetary leaders stay at top
            if (normalizedInvoiced === 100) overallScore += 2;

            // Cap at 99 to leave room for the +2 boost, max 100
            overallScore = Math.min(100, Math.max(0, overallScore));

            const trendData = generateTrendData(stat.name);
            const isTrendingUp = trendData[trendData.length - 1].value > trendData[0].value;

            return {
                id: stat.id,
                name: stat.name,
                avatar: stat.avatar,
                revenue: stat.invoicedAmount, // We use invoiced as the primary revenue metric for the leaderboard
                invoicedAmount: stat.invoicedAmount,
                winRate: stat.winRate,
                dealCount: stat.dealCount,
                overallScore,
                trendData,
                isTrendingUp,
                gapToLeader: 0,
                comparisons: {
                    vsAvgRevenue: avgInvoiced > 0 ? ((stat.invoicedAmount - avgInvoiced) / avgInvoiced) * 100 : 0,
                },
                streak: Math.floor(Math.random() * 8) + 2
            };
        });

        // Third pass: Sort and rank
        const sortedStats = scoredStats
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 10);

        if (sortedStats.length > 0) {
            const leaderRevenue = sortedStats[0].invoicedAmount;
            sortedStats.forEach((stat, index) => {
                stat.gapToLeader = index === 0 ? 0 : Math.max(0, leaderRevenue - stat.invoicedAmount);
            });
        }

        return sortedStats;
    }, [deals, orders, users]);

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
                                    "border-b border-slate-100 dark:border-slate-700 transition-all cursor-pointer",
                                    isExpanded ? "bg-slate-50 dark:bg-slate-800/80" : "hover:bg-slate-50 dark:hover:bg-slate-800/40",
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

                                    {/* Invoiced & Score */}
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="flex flex-col items-end min-w-[80px]">
                                            <span className="text-lg font-bold text-slate-700 dark:text-slate-200 leading-none">
                                                {formatCurrency(performer.invoicedAmount)}₺
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">FATURALANAN</span>
                                        </div>
                                        <div className="flex flex-col items-end min-w-[60px]">
                                            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                                {performer.overallScore.toFixed(0)}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{t('gamification.score')}</span>
                                        </div>
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
                                                <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                                        <Zap size={14} className="text-indigo-500 fill-current" />
                                                        {t('gamification.whyScore')}
                                                    </h4>
                                                    <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                                        <li className="flex items-start gap-2">
                                                            <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                                                            <span>
                                                                <Trans
                                                                    i18nKey="gamification.revenueInsight"
                                                                    values={{
                                                                        revenue: formatCurrency(performer.invoicedAmount),
                                                                        percentage: Math.abs(performer.comparisons.vsAvgRevenue).toFixed(0),
                                                                        direction: performer.comparisons.vsAvgRevenue >= 0 ? "üzerindesin" : "gerisindesin"
                                                                    }}
                                                                    components={{
                                                                        1: <strong className="text-slate-900 dark:text-slate-200" />,
                                                                        3: <strong className={performer.comparisons.vsAvgRevenue >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"} />
                                                                    }}
                                                                />
                                                            </span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                                                            <span>
                                                                <Trans
                                                                    i18nKey="gamification.winRateInsight"
                                                                    values={{
                                                                        rate: performer.winRate.toFixed(0),
                                                                        status: performer.winRate > 40 ? t('executiveBrief.kpis.strongSignal') : t('executiveBrief.kpis.needsAttention')
                                                                    }}
                                                                    components={{ 1: <strong className="text-slate-900 dark:text-slate-200" /> }}
                                                                />
                                                            </span>
                                                        </li>

                                                        <li className="flex items-start gap-2">
                                                            <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-500 flex-shrink-0" />
                                                            <span>
                                                                {performer.isTrendingUp
                                                                    ? t('gamification.trendingUp')
                                                                    : t('gamification.trendingDown')}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>

                                                {/* Comparison Stats */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-slate-100 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2">{t('gamification.revenueTrend')}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            {performer.comparisons.vsAvgRevenue > 0
                                                                ? <ArrowUpRight size={16} className="text-emerald-500" />
                                                                : <ArrowDownRight size={16} className="text-rose-500" />}
                                                            <span className={cn("text-lg font-bold", performer.comparisons.vsAvgRevenue > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                                                %{Math.abs(performer.comparisons.vsAvgRevenue).toFixed(0)}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">{t('gamification.vsTeam')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-100 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                                        {index === 0 ? (
                                                            <>
                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2">{t('gamification.nextAction')}</span>
                                                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                                    <Crown size={16} className="text-yellow-500" />
                                                                    <span className="font-semibold text-sm">Zirveyi Koru</span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Liderliği devretme!</span>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col h-full justify-between">
                                                                <div>
                                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-2">LİDER İLE FARK</span>
                                                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                                        <Target size={16} className="text-indigo-500" />
                                                                        <span className="font-semibold text-sm">{formatCurrency(performer.gapToLeader)}₺</span>
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1 tracking-tight">
                                                                        Sıralamayı değiştirecek güç sende.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
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
