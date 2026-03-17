import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { OpportunityService } from '../../services/OpportunityService';

interface LostReasonsDistributionProps {
    dateFilter: string;
    customRange: { start: Date | null, end: Date | null };
    selectedOwner: string[];
    selectedTeam: string[];
}

export function LostReasonsDistribution({ dateFilter, customRange, selectedOwner, selectedTeam }: LostReasonsDistributionProps) {
    const { t, i18n } = useTranslation();
    const [mode, setMode] = useState<'revenue' | 'count'>('revenue');
    const [data, setData] = useState<{ items: any[], mode: string, totals: any, other: any } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let startDate: string | undefined;
        let endDate: string | undefined;

        const formatLocalDate = (d: Date) => {
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
        };

        if (dateFilter !== 'all') {
            const now = new Date();
            const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let start = new Date(todayAtMidnight);
            let end = new Date(now);

            switch (dateFilter) {
                case 'today':
                    startDate = formatLocalDate(start);
                    break;
                case 'yesterday':
                    start.setDate(start.getDate() - 1);
                    end = new Date(todayAtMidnight);
                    end.setMilliseconds(-1);
                    startDate = formatLocalDate(start);
                    endDate = formatLocalDate(end);
                    break;
                case 'this_week': {
                    const day = now.getDay() || 7;
                    start.setDate(start.getDate() - (day - 1));
                    startDate = formatLocalDate(start);
                    break;
                }
                case 'last_week': {
                    const day = now.getDay() || 7;
                    start.setDate(start.getDate() - (day - 1) - 7);
                    end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    startDate = formatLocalDate(start);
                    endDate = formatLocalDate(end);
                    break;
                }
                case 'this_month':
                case 'mtd':
                    start.setDate(1);
                    startDate = formatLocalDate(start);
                    break;
                case 'this_quarter': {
                    const quarter = Math.floor(now.getMonth() / 3);
                    start.setMonth(quarter * 3, 1);
                    startDate = formatLocalDate(start);
                    break;
                }
                case 'this_year':
                case 'ytd':
                    start.setMonth(0, 1);
                    startDate = formatLocalDate(start);
                    break;
                case 'custom':
                    if (customRange.start) startDate = formatLocalDate(customRange.start);
                    if (customRange.end) endDate = formatLocalDate(customRange.end);
                    break;
            }
        }

        setLoading(true);
        OpportunityService.getLostReasons(
            startDate,
            endDate,
            selectedOwner.includes('all') ? undefined : selectedOwner,
            selectedTeam.includes('all') ? undefined : selectedTeam.filter(t => t !== 'all'),
            mode
        ).then(res => {
            setData(res);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });

    }, [dateFilter, customRange, selectedOwner, selectedTeam, mode]);

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M₺`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k₺`;
        return `${value}₺`;
    };

    const color = '#f43f5e';
    const lang = i18n.language.startsWith('tr') ? 'tr' : 'en';

    // Build the rendered data array including the 'other' group if present
    const renderedItems = data ? [...data.items] : [];
    if (data?.other) {
        renderedItems.push(data.other);
    }
    const maxValue = data && renderedItems.length > 0 ? Math.max(...renderedItems.map(item => mode === 'count' ? item.count : item.amount), 1) : 1;

    return (
        <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-col gap-3">
                <div className="flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        <AlertCircle size={18} />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                            {t('opportunities.charts.lostReasonsTitle')}
                        </CardTitle>
                    </div>
                    {/* Mode Toggle Button */}
                    <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                        <button 
                            className={cn("px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all", mode === 'revenue' ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white" : "text-slate-500")}
                            onClick={() => setMode('revenue')}
                        >
                            {t('dashboardV2.charts.amountLabel', { defaultValue: 'Ciro' })}
                        </button>
                        <button 
                            className={cn("px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-all", mode === 'count' ? "bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white" : "text-slate-500")}
                            onClick={() => setMode('count')}
                        >
                            {t('dashboardV2.charts.countLabel', { defaultValue: 'Adet' })}
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-500 truncate mt-1 tracking-wider uppercase animate-pulse">{t('performance.analyzing', { defaultValue: 'Yükleniyor...' })}</span>
                    </div>
                )}
                
                <div className="space-y-4 overflow-y-auto pr-2 pb-2 max-h-[280px]">
                    {renderedItems.map((item, idx) => {
                        const val = mode === 'count' ? item.count : item.amount;
                        const percentage = (val / maxValue) * 100;
                        const formattedVal = mode === 'count' ? `${val} Adet` : formatCurrency(val);
                        // item.reasonLabel will exist because we provide it from BFF, or fallback to key
                        // Sometimes the label strings need translation via t() if they come as raw Enums
                        let label = item.reasonLabel?.[lang] || item.reasonKey || 'Unknown';
                        // if label has "Enum.EClosedLostReason", translate it properly
                        // If it's a raw key, try to translate with the enum prefix
                        if (label.startsWith('Enum.')) {
                            label = t(label, { defaultValue: item.reasonLabel?.en || item.reasonKey });
                        } else if (!item.reasonLabel?.[lang] && item.reasonKey) {
                            const translated = t(`Enum.EClosedLostReason.${item.reasonKey}`);
                            if (translated !== `Enum.EClosedLostReason.${item.reasonKey}`) {
                                label = translated;
                            }
                        }

                        return (
                            <div key={item.reasonKey || idx} className="group transition-all flex flex-col gap-1 opacity-100 hover:opacity-90 cursor-default">
                                <div className="px-1">
                                    <span className="text-xs font-bold uppercase tracking-tight truncate transition-colors text-slate-700 dark:text-slate-200">
                                        {label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 w-full">
                                    <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, delay: idx * 0.05 }}
                                            className="h-full rounded-full transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)] relative"
                                            style={{ backgroundColor: color }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    </div>
                                    <span className="text-base font-mono font-bold transition-colors text-right min-w-[70px] text-slate-900 dark:text-white">
                                        {formattedVal}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {!loading && renderedItems.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                            {t('opportunities.noRecords')}
                        </div>
                    )}
                </div>

                <div className="mt-6 p-3 rounded-xl bg-gradient-to-tr from-rose-500/5 to-white/5 dark:from-rose-500/10 dark:to-transparent border border-rose-500/10 flex gap-2.5 items-start">
                    <Info size={14} className="text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                        {t('opportunities.charts.lostReasonsInsight')}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
