import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

interface OrderPoolAnalysisProps {
    data: { name: string; revenue: number }[];
    countData: { name: string; count: number }[];
    onStatusSelect: (status: string | null) => void;
    selectedStatus: string | null;
}

export function OrderPoolAnalysis({ data, countData, onStatusSelect, selectedStatus }: OrderPoolAnalysisProps) {
    const { t } = useTranslation();
    const poolData = useMemo(() => {
        const maxRevenue = Math.max(...data.map(d => d.revenue), 1); // Avoid division by zero

        // Define colors for Order statuses
        const statusConfig: Record<string, { color: string; bg: string }> = {
            'Open': { color: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
            'Closed': { color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            'Canceled': { color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        };

        return data.map(item => {
            const countItem = countData.find(c => c.name === item.name);
            // Default to gray if status not found
            const config = statusConfig[item.name] || { color: 'bg-slate-500', bg: 'bg-slate-100' };

            return {
                ...item,
                count: countItem ? countItem.count : 0,
                percentage: Math.round((item.revenue / maxRevenue) * 100),
                ...config
            };
        }).sort((a, b) => b.revenue - a.revenue); // Sort by revenue desc
    }, [data, countData]);

    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

    return (
        <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {t('orders.poolAnalysis.title')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        {t('orders.poolAnalysis.subtitle')}
                    </p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    {t('common.filters.today')}: {formatCurrency(totalRevenue)}
                </div>
            </div>

            <div className="flex-1 flex items-end justify-center gap-6 sm:gap-10 px-2 overflow-x-auto pb-2">
                {poolData.map((pool) => {
                    const isSelected = selectedStatus === pool.name;
                    // If something is selected and it's NOT this one, dim this one.
                    // If 'all' is selected (conceptually) or null, don't dim.
                    const isDimmed = selectedStatus !== null && selectedStatus !== 'all' && !isSelected;

                    return (
                        <div
                            key={pool.name}
                            onClick={() => onStatusSelect(isSelected ? null : pool.name)}
                            className={cn(
                                "flex flex-col items-center gap-3 w-20 sm:w-24 group cursor-pointer transition-all duration-300",
                                isDimmed ? "opacity-30 grayscale" : "opacity-100"
                            )}
                        >

                            {/* Value Label (Hover) */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap">
                                {formatCurrency(pool.revenue)} ({pool.count} {t('orders.units.count', { defaultValue: 'Adet' })})
                            </div>

                            {/* Pool Bar Container */}
                            <div className={cn(
                                "w-full relative rounded-xl overflow-hidden flex items-end transition-all duration-500",
                                "h-[200px] sm:h-[240px]",
                                pool.bg
                            )}>
                                {/* Liquid/Bar Fill */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${pool.percentage}%` }}
                                    transition={{ duration: 1, type: "spring" }}
                                    className={cn("w-full relative group-hover:brightness-110 transition-all", pool.color)}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50" />
                                </motion.div>

                                {/* Inner Value Text (if tall enough) */}
                                {pool.percentage > 15 && (
                                    <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-white/90 drop-shadow-sm">
                                        {formatCurrency(pool.revenue)}
                                    </div>
                                )}
                            </div>

                            {/* Status Label */}
                            <div className="text-center">
                                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight truncate max-w-full">
                                    {t(`status.${pool.name}`, { defaultValue: pool.name })}
                                </div>
                                <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                                    {pool.count} {t('orders.units.count', { defaultValue: 'Adet' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-slate-400">
                <Info size={14} />
                <span className="text-[10px]">{t('orders.poolAnalysis.heightParams')}</span>
            </div>
        </div>
    );
}
