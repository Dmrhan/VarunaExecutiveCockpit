import { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import type { Order } from '../../types/crm';
import { cn } from '../../lib/utils';

interface OrdersAIInsightPanelProps {
    currentOrders: Order[];
    allOrders: Order[];
    dateFilter: string;
    customRange: { start: Date | null, end: Date | null };
    className?: string;
}

export function OrdersAIInsightPanel({ currentOrders, allOrders, dateFilter, customRange, className }: OrdersAIInsightPanelProps) {
    const { t } = useTranslation();

    const insights = useMemo(() => {
        // Mock Comparison Logic (similar to PipelineAIInsightPanel)
        // ideally this would compare against real historical data

        const currentTotal = currentOrders.reduce((s, o) => s + o.amount, 0);
        // Mock previous value as 90% of current for demo purposes if no real filtering history
        const prevTotal = currentTotal * 0.9;

        const revChange = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100;

        // Findings
        const topCustomer = currentOrders.reduce((acc, o) => {
            acc[o.customerName] = (acc[o.customerName] || 0) + o.amount;
            return acc;
        }, {} as Record<string, number>);

        const bestCustomer = Object.entries(topCustomer).sort((a, b) => b[1] - a[1])[0];

        // "Stalled" or "Issues" for orders could be Canceled ones or pending for a long time
        // Using "Canceled" count for this insight
        const issueCount = currentOrders.filter(o => o.status === 'Canceled').length;

        let narrative = "";
        if (revChange > 0) {
            narrative = t('orders.aiPanel.volumeUp', { value: revChange.toFixed(0) });
        } else {
            narrative = t('orders.aiPanel.volumeDown', { value: Math.abs(revChange).toFixed(0) });
        }

        if (bestCustomer) {
            narrative += " " + t('orders.aiPanel.topBuyer', { name: bestCustomer[0] });
        }

        if (issueCount > 0) {
            narrative += " " + t('orders.aiPanel.canceledCount', { count: issueCount });
        }

        return { narrative, revChange, issueCount, bestCustomer };
    }, [currentOrders, allOrders, dateFilter, customRange, t]);

    return (
        <Card className={cn(
            "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 dark:from-indigo-600 dark:via-purple-700 dark:to-indigo-800 text-white border-0 shadow-xl relative overflow-hidden flex flex-col justify-between",
            className
        )}>
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center gap-2 text-indigo-100 mb-2">
                    <Sparkles size={14} className="text-yellow-300" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{t('orders.aiPanel.title')}</span>
                </div>
                <CardTitle className="text-lg md:text-xl text-white font-light leading-tight">
                    {insights.narrative}
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                    {insights.revChange >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-white/50 tracking-wider">{t('orders.aiPanel.volumeChange')}</span>
                        <span className="text-xs font-semibold">{insights.revChange >= 0 ? '+' : ''}{insights.revChange.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-xl border border-white/10 backdrop-blur-md">
                    <Package size={14} className="text-indigo-300" />
                    <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-bold text-white/50 tracking-wider">{t('orders.aiPanel.topCustomer')}</span>
                        <span className="text-xs font-semibold truncate max-w-[120px]">{insights.bestCustomer?.[0] || '---'}</span>
                    </div>
                </div>

                {insights.issueCount > 0 && (
                    <div className="flex items-center gap-3 bg-rose-500/20 px-3 py-2 rounded-xl border border-rose-500/20 backdrop-blur-md">
                        <AlertTriangle size={14} className="text-rose-400" />
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold text-white/50 tracking-wider">{t('orders.aiPanel.cancellations')}</span>
                            <span className="text-xs font-semibold">{insights.issueCount} Adet</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
