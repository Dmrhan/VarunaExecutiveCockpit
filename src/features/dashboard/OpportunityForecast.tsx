import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, AlertTriangle, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import type { Deal } from '../../types/crm';
import { cn } from '../../lib/utils'; // Assuming cn exists, based on other files

interface OpportunityForecastProps {
    deals: Deal[];
    onMonthClick: (date: Date) => void;
    activeFilterMonth: Date | null;
}

interface MonthlyData {
    date: Date; // First day of the month
    label: string; // e.g. "Oct 2023"
    totalValue: number;
    weightedValue: number;
    count: number;
    overdueCount: number;
    isPast: boolean;
    isCurrent: boolean;
}

export function OpportunityForecast({ deals, onMonthClick, activeFilterMonth }: OpportunityForecastProps) {
    const { t } = useTranslation();

    const forecastData = useMemo(() => {
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const months: MonthlyData[] = [];

        // Generate next 12 months (including current)
        for (let i = 0; i < 13; i++) {
            const date = new Date(currentMonthStart);
            date.setMonth(currentMonthStart.getMonth() + i);

            const monthLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }); // You might want to use i18n here more dynamically

            months.push({
                date,
                label: monthLabel,
                totalValue: 0,
                weightedValue: 0,
                count: 0,
                overdueCount: 0,
                isPast: false,
                isCurrent: i === 0
            });
        }

        // Aggregate deals
        deals.forEach(deal => {
            if (!deal.expectedCloseDate) return;

            const closeDate = new Date(deal.expectedCloseDate);
            // Ignore invalid dates
            if (isNaN(closeDate.getTime())) return;

            // Check for overdue (Close date < Today and NOT Won/Lost)
            const isOverdue = closeDate < today && !['Kazanıldı', 'Kaybedildi', 'Order', 'Lost', 'Onaylandı'].includes(deal.stage);

            // Find matching month bucket
            const monthIndex = months.findIndex(m =>
                m.date.getFullYear() === closeDate.getFullYear() &&
                m.date.getMonth() === closeDate.getMonth()
            );

            if (monthIndex >= 0) {
                const month = months[monthIndex];

                // Only count towards value if not Lost/Won (usually forecast implies open pipeline + won in period? 
                // Requirement says "Monitor opportunities by their expected close dates"
                // Usually "Forecast" includes Closed Won for the period, but excludes Closed Lost.
                // However, "Forward-looking" usually implies Open Pipeline.
                // Let's include OPEN deals mostly, maybe Won too? 
                // "This extension is for planning and forecasting". 
                // Let's include everything that ISN'T Lost.
                if (!['Kaybedildi', 'Lost'].includes(deal.stage)) {
                    month.totalValue += deal.value;
                    month.weightedValue += deal.value * (deal.probability / 100);
                    month.count += 1;
                }

                if (isOverdue && month.isCurrent) {
                    // If it's in the current month bucket but technically the specific date is passed
                    month.overdueCount += 1;
                }
            } else if (isOverdue) {
                // Deal is in a PAST month not in our 12-month window.
                // We should probably add these to the "Current Month" bucket as "Overdue" or handle them separately.
                // For a "Future Forecast", overdue deals are usually pushed to "Current Month" conceptually or shown as a warning.
                // Let's add them to Current Month for visibility but mark as overdue.
                months[0].totalValue += deal.value;
                months[0].weightedValue += deal.value * (deal.probability / 100);
                months[0].count += 1;
                months[0].overdueCount += 1;
            }
        });

        return months;
    }, [deals, t]);

    const maxTotalValue = Math.max(...forecastData.map(d => d.totalValue), 1);

    return (
        <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {t('opportunities.forecast.title', 'Tahmini Kapanış Öngörüsü')}
                            </CardTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('opportunities.forecast.subtitle', 'Önümüzdeki 12 ay için beklenen satış hacmi (Toplam Değer)')}
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 overflow-x-auto">
                <div className="flex gap-4 min-w-[800px] pb-4">
                    {forecastData.map((month, idx) => {
                        const isSelected = activeFilterMonth &&
                            activeFilterMonth.getMonth() === month.date.getMonth() &&
                            activeFilterMonth.getFullYear() === month.date.getFullYear();

                        return (
                            <motion.div
                                key={month.label}
                                className={cn(
                                    "relative flex flex-col justify-end w-full min-w-[80px] h-[220px] rounded-xl p-3 cursor-pointer transition-all border",
                                    isSelected
                                        ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20"
                                        : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700"
                                )}
                                onClick={() => onMonthClick(month.date)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                {/* Overdue Badge */}
                                {month.overdueCount > 0 && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                                        <AlertCircle size={10} />
                                        {month.overdueCount}
                                    </div>
                                )}

                                {/* Single Bar (Total Value) */}
                                <div className="flex items-end justify-center h-full mb-3 px-3 w-full">
                                    <div className="w-full max-w-[24px] bg-slate-100 dark:bg-slate-700 rounded-t-lg h-full relative overflow-hidden">
                                        <motion.div
                                            className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(month.totalValue / maxTotalValue) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                                        {month.label}
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {(month.totalValue / 1000000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} Mn ₺
                                    </div>
                                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                        {month.count} Fırsat
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
