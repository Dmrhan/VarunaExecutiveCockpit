import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { Trophy, Medal, Flame, TrendingUp, Target, Crown, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

export function TopPerformerLeaderboard() {
    const { deals, users } = useData();

    const leaderboardData = useMemo(() => {
        const stats = users
            .filter(u => u.role === 'sales_rep')
            .map(user => {
                const userDeals = deals.filter(d => d.ownerId === user.id);
                const wonDeals = userDeals.filter(d => ['Kazanıldı', 'Order'].includes(d.stage));
                const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
                const dealCount = wonDeals.length;
                const totalDeals = userDeals.length; // Basic conversion rate base
                const winRate = totalDeals > 0 ? (dealCount / totalDeals) * 100 : 0;

                // Gamification Score
                // Revenue * 0.01 + WinRate * 100 + Deals * 500
                const score = (totalRevenue * 0.0001) + (winRate * 50) + (dealCount * 100);

                return {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar,
                    revenue: totalRevenue,
                    winRate,
                    dealCount,
                    score,
                    streak: Math.floor(Math.random() * 10) + 1 // Mock streak data
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10

        return stats;
    }, [deals, users]);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown size={20} className="text-yellow-500 fill-yellow-500 animate-pulse" />;
            case 1: return <Medal size={20} className="text-slate-400 fill-slate-400" />;
            case 2: return <Medal size={20} className="text-amber-700 fill-amber-700" />;
            default: return <span className="text-sm font-bold text-slate-500 dark:text-slate-400">#{index + 1}</span>;
        }
    };

    const getBadges = (performer: any, index: number) => {
        const badges = [];
        if (index === 0) badges.push({ icon: <Trophy size={10} />, color: 'bg-yellow-500 text-white', text: 'MVP', desc: 'En Değerli Oyuncu - Lider' });
        if (performer.winRate > 40) badges.push({ icon: <Target size={10} />, color: 'bg-emerald-500 text-white', text: 'Sniper', desc: '>%40 Kazanma Oranı' });
        if (performer.revenue > 5000000) badges.push({ icon: <Star size={10} />, color: 'bg-indigo-500 text-white', text: 'Rainmaker', desc: '>$5M Ciro' });
        if (performer.streak > 5) badges.push({ icon: <Flame size={10} />, color: 'bg-orange-500 text-white', text: `${performer.streak} Streak`, desc: `${performer.streak} Ardışık Başarı` });
        return badges;
    };

    return (
        <Card className="h-full bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative flex flex-col">
            <CardHeader className="flex-shrink-0 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Trophy size={14} />
                            Top Performers
                        </CardTitle>
                    </div>
                    <div className="bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <TrendingUp size={12} />
                            Canlı Sıralama
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-auto">
                <div className="flex flex-col">
                    {leaderboardData.map((performer, index) => (
                        <motion.div
                            key={performer.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "flex items-center gap-4 p-4 border-b border-slate-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-white/5",
                                index === 0 ? "bg-amber-50/50 dark:bg-amber-500/5" : ""
                            )}
                        >
                            {/* Rank */}
                            <div className="w-8 flex justify-center flex-shrink-0">
                                {getRankIcon(index)}
                            </div>

                            {/* Avatar & Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden flex-shrink-0">
                                        <img src={performer.avatar} alt={performer.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={cn(
                                            "text-sm font-bold truncate",
                                            index === 0 ? "text-amber-700 dark:text-amber-500" : "text-slate-700 dark:text-slate-200"
                                        )}>
                                            {performer.name}
                                        </span>
                                        <div className="flex gap-1 flex-wrap">
                                            {getBadges(performer, index).map((b, i) => (
                                                <div
                                                    key={i}
                                                    title={b.desc}
                                                    className={cn("text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-bold tracking-wide shadow-sm cursor-help transition-transform hover:scale-105", b.color)}
                                                >
                                                    {b.icon} {b.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <span className={cn(
                                    "text-sm font-bold font-mono",
                                    index === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
                                )}>
                                    {formatCurrency(performer.revenue)}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    <span>{performer.dealCount} Deal</span>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <span className={performer.winRate > 50 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}>%{performer.winRate.toFixed(0)} WR</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
