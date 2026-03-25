import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Trophy, Medal, Crown, ChevronDown, ChevronUp, Activity, Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { OpenPipelineDetail } from './OpenPipelineDetail';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
};

interface OpportunityOwnerDistributionProps {
    dateRange?: { start: string | null; end: string | null };
    teamId?: string | string[];
    ownerId?: string | string[];
    product?: string | string[];
}

export function OpportunityOwnerDistribution({ dateRange, teamId, ownerId, product }: OpportunityOwnerDistributionProps) {
    const { t } = useTranslation();
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPerformance = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (dateRange?.start) params.append('from', dateRange.start + ' 00:00:00');
                if (dateRange?.end) params.append('to', dateRange.end + ' 23:59:59');
                if (teamId) params.append('teamId', Array.isArray(teamId) ? teamId.join(',') : teamId);
                if (ownerId) params.append('ownerId', Array.isArray(ownerId) ? ownerId.join(',') : ownerId);
                if (product) params.append('product', Array.isArray(product) ? product.join(',') : product);

                const baseUrl = (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
                const response = await fetch(`${baseUrl}/opportunities-leaderboard?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch open opportunities leaderboard');

                const data = await response.json();
                setLeaderboardData(data.value || []);
            } catch (error) {
                console.error('Error fetching open opportunities leaderboard:', error);
                setLeaderboardData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerformance();
    }, [dateRange?.start, dateRange?.end, teamId, ownerId, product]);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown size={20} className="text-yellow-500 fill-yellow-500 animate-pulse" />;
            case 1: return <Medal size={20} className="text-slate-400 fill-slate-400" />;
            case 2: return <Medal size={20} className="text-amber-700 fill-amber-700" />;
            default: return <span className="text-sm font-bold text-slate-500 dark:text-slate-400 w-5 text-center">#{index + 1}</span>;
        }
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
                            <Target size={16} className="text-indigo-500" />
                            {t('ownerDistribution.title', { defaultValue: 'Fırsat Sahibi Bazında Satış Potansiyel Dağılımı' })}
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Activity size={10} />
                            Açık Fırsat Potansiyeli Dağılımı
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48 animate-pulse text-slate-500 text-sm flex-col gap-2">
                        <Activity size={24} className="text-indigo-400" />
                        {t('common.loading', 'Yükleniyor...')}
                    </div>
                ) : leaderboardData.length === 0 ? (
                    <div className="flex justify-center items-center h-48 text-slate-500 text-sm">
                        {'Seçili kriterlerde açık fırsat bulunamadı.'}
                    </div>
                ) : (
                    <div className="flex flex-col max-h-[720px] overflow-y-auto">
                        {leaderboardData.map((performer, index) => {
                            const isExpanded = expandedUserId === performer.ownerId;
                            return (
                                <motion.div
                                    key={performer.ownerId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "border-b border-slate-100 dark:border-slate-700 transition-all cursor-pointer",
                                        isExpanded ? "bg-slate-50 dark:bg-slate-800/80" : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    )}
                                    onClick={() => toggleExpand(performer.ownerId)}
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
                                                <UserAvatar name={performer.ownerName} size="lg" className="border-2 border-white dark:border-slate-600 shadow-sm" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className={cn(
                                                    "text-sm font-bold truncate",
                                                    index === 0 ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
                                                )}>
                                                    {performer.ownerName}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {performer.opportunityCount} Adet Açık Fırsat
                                                </span>
                                            </div>
                                        </div>

                                        {/* Share progress bar */}
                                        <div className="hidden sm:flex flex-1 items-center max-w-[120px]">
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${performer.sharePct}%` }}></div>
                                            </div>
                                            <span className="ml-2 text-[10px] font-bold text-slate-400">%{performer.sharePct.toFixed(0)}</span>
                                        </div>

                                        {/* Potential Amount */}
                                        <div className="flex flex-col items-end min-w-[80px]">
                                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                                                {formatCurrency(performer.potentialAmount)}₺
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-1">AÇIK POTANSİYEL</span>
                                        </div>

                                        {/* Expand Icon */}
                                        <div className="text-slate-400 ml-2">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden cursor-default"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <OpenPipelineDetail
                                                    ownerId={performer.ownerId}
                                                    filters={{ dateRange, teamId, ownerId, product }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
