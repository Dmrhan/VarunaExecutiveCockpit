import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Quote } from '../../types/crm';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
    return value.toString();
};

interface SalesRepPerformanceProps {
    quotes: Quote[];
}

export function SalesRepPerformance({ quotes }: SalesRepPerformanceProps) {
    const { t } = useTranslation();

    const topPerformers = useMemo(() => {
        // Filter for approved/accepted quotes (closed business)
        const closedQuotes = quotes.filter(q =>
            ['Accepted', 'Approved', 'Sözleşme', 'Kazanıldı'].includes(q.status)
        );

        const performanceMap = new Map<string, {
            id: string;
            name: string;
            revenue: number;
            count: number;
        }>();

        closedQuotes.forEach(quote => {
            if (!quote.salesRepId || !quote.salesRepName) return;

            const existing = performanceMap.get(quote.salesRepId) || {
                id: quote.salesRepId,
                name: quote.salesRepName,
                revenue: 0,
                count: 0
            };

            existing.revenue += quote.amount;
            existing.count += 1;
            performanceMap.set(quote.salesRepId, existing);
        });

        // Convert to array and sort by revenue desc
        return Array.from(performanceMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5); // Take top 5
    }, [quotes]);

    // Helper for ranking icons
    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Trophy size={16} className="text-amber-500" />;
            case 1: return <Medal size={16} className="text-slate-400" />;
            case 2: return <Medal size={16} className="text-amber-700" />;
            default: return <Award size={16} className="text-indigo-400" />;
        }
    };

    const getRankColor = (index: number) => {
        switch (index) {
            case 0: return "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20";
            case 1: return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
            case 2: return "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-500/20";
            default: return "bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800";
        }
    };

    return (
        <Card className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col h-full">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <CardTitle className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                            {t('dashboard.salesRepPerformance', 'Satış Temsilcisi Performansı')}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                {topPerformers.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-6 text-slate-400 text-sm italic">
                        No approved quote data available
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {topPerformers.map((rep, index) => (
                            <div
                                key={rep.id}
                                className={cn(
                                    "flex items-center justify-between p-4 border-b border-slate-50/50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group",
                                    index < 3 ? "font-medium" : ""
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center border shadow-sm",
                                        getRankColor(index)
                                    )}>
                                        {getRankIcon(index)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {rep.name}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span>{rep.count} {t('quotes.units.approved', 'Onaylı Teklif')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-bold font-mono text-slate-800 dark:text-white">
                                        {formatCurrency(rep.revenue)}
                                    </div>
                                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden ml-auto">
                                        <div
                                            className={cn(
                                                "h-full rounded-full",
                                                index === 0 ? "bg-amber-500" :
                                                    index === 1 ? "bg-slate-400" :
                                                        index === 2 ? "bg-amber-700" : "bg-indigo-500"
                                            )}
                                            style={{ width: `${Math.min(100, (rep.revenue / topPerformers[0].revenue) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
