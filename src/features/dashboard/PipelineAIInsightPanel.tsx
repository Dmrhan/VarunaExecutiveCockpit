import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import type { Deal } from '../../types/crm';
import { cn } from '../../lib/utils';

interface PipelineAIInsightPanelProps {
    currentDeals: Deal[];
    allDeals: Deal[];
    dateFilter: string;
    customRange: { start: Date | null, end: Date | null };
    className?: string;
}

export function PipelineAIInsightPanel({ currentDeals, allDeals, dateFilter, customRange, className }: PipelineAIInsightPanelProps) {
    const { t } = useTranslation();

    const insights = useMemo(() => {
        // Calculation for previous period
        let prevDeals: Deal[] = [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        if (dateFilter === 'today') {
            const yesterday = today - 86400000;
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt).getTime();
                return dt >= yesterday && dt < today;
            });
        } else if (dateFilter === 'this_month' || dateFilter === 'mtd') {
            const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt);
                return dt.getMonth() === lm && dt.getFullYear() === ly;
            });
        } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
            const duration = customRange.end.getTime() - customRange.start.getTime();
            const prevEnd = customRange.start.getTime();
            const prevStart = prevEnd - duration;
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt).getTime();
                return dt >= prevStart && dt < prevEnd;
            });
        } else {
            // For others, just use as if 10% less for mock effect or better logic
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt).getTime();
                // Simple heuristic for "previous" if not explicitly handled
                return dt < (customRange.start?.getTime() || today);
            }).slice(-Math.max(1, Math.floor(currentDeals.length * 0.9)));
        }

        const currentRev = currentDeals.reduce((s, d) => s + d.value, 0);
        const prevRev = prevDeals.length > 0 ? prevDeals.reduce((s, d) => s + d.value, 0) : 0;
        const revChange = prevRev === 0 ? (currentRev > 0 ? 100 : 0) : ((currentRev - prevRev) / prevRev) * 100;

        // Findings
        const topProductData = currentDeals.reduce((acc, d) => {
            if (d.product) {
                acc[d.product] = (acc[d.product] || 0) + d.value;
            }
            return acc;
        }, {} as Record<string, number>);

        const bestProductPair = Object.entries(topProductData).sort((a, b) => b[1] - a[1])[0];
        const bestSource = bestProductPair ? bestProductPair[0] : null;

        const stalledDealsList = currentDeals.filter(d =>
            d.aging > 30 &&
            !['Kazanıldı', 'Kaybedildi', 'Lost', 'Order'].includes(d.stage)
        );
        const stalledCount = stalledDealsList.length;
        const stalledValue = stalledDealsList.reduce((s, d) => s + d.value, 0);

        let narrative = "";
        if (revChange >= 0) {
            narrative = t('opportunities.aiNarrative.pipelineIncrease', { percent: Math.abs(revChange).toFixed(0) });
        } else {
            narrative = t('opportunities.aiNarrative.pipelineDecrease', { percent: Math.abs(revChange).toFixed(0) });
        }

        if (bestSource) {
            narrative += t('opportunities.aiNarrative.primaryEngine', { source: bestSource });
        }

        if (stalledCount > 0) {
            narrative += t('opportunities.aiNarrative.stalledDeals', { count: stalledCount, value: (stalledValue / 1000000).toFixed(1) });
        }

        return { narrative, revChange, stalledCount, bestSource };
    }, [currentDeals, allDeals, dateFilter, customRange, t]);

    return (
        <Card className={cn(
            "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 dark:from-indigo-600 dark:via-purple-700 dark:to-indigo-800 text-white border-0 shadow-xl relative overflow-hidden flex flex-col justify-between",
            className
        )}>
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center gap-2 text-indigo-100 mb-2">
                    <Sparkles size={14} className="text-yellow-300" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{t('opportunities.aiNarrative.title')}</span>
                </div>
                <CardTitle className="text-lg md:text-xl text-white font-light leading-tight">
                    {insights.narrative}
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                    {insights.revChange >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-white/50 tracking-wider font-mono">{t('opportunities.aiNarrative.revenueChange')}</span>
                        <span className="text-xs font-semibold">{insights.revChange >= 0 ? '+' : ''}{insights.revChange.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                    <Target size={14} className="text-indigo-300" />
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-white/50 tracking-wider font-mono">{t('opportunities.aiNarrative.mainSource')}</span>
                        <span className="text-xs font-semibold truncate max-w-[120px]">{insights.bestSource || '---'}</span>
                    </div>
                </div>

                {insights.stalledCount > 0 && (
                    <div className="flex items-center gap-3 bg-rose-500/20 px-3 py-2 rounded-xl border border-rose-500/20 backdrop-blur-md">
                        <AlertCircle size={14} className="text-rose-400" />
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold text-white/50 tracking-wider font-mono">{t('opportunities.aiNarrative.stalledDealsLabel')}</span>
                            <span className="text-xs font-semibold">{insights.stalledCount} Adet</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

