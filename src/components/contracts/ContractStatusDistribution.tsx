import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { formatCurrency } from '../../utils/formatters';
import { Filter } from 'lucide-react';
import type { ContractStatus } from '../../types/crm';

export const ContractStatusDistribution = () => {
    const { t } = useTranslation();
    const { contracts } = useData();

    // Group contracts by status
    const statusData = useMemo(() => {
        const stats: Record<string, { count: number; value: number; color: string }> = {
            'Active': { count: 0, value: 0, color: '#10b981' }, // Emerald 500
            'Negotiation': { count: 0, value: 0, color: '#3b82f6' }, // Blue 500
            'Draft': { count: 0, value: 0, color: '#94a3b8' }, // Slate 400
            'Archived': { count: 0, value: 0, color: '#cbd5e1' }, // Slate 300
            'Terminated': { count: 0, value: 0, color: '#ef4444' }, // Red 500
        };

        contracts.forEach(c => {
            const status = c.status as ContractStatus || 'Draft';
            if (!stats[status]) {
                stats[status] = { count: 0, value: 0, color: '#cbd5e1' };
            }
            stats[status].count += 1;
            stats[status].value += c.totalValueTL;
        });

        return Object.entries(stats)
            .filter(([_, data]) => data.count > 0)
            .map(([name, data]) => ({
                name,
                value: data.value,
                count: data.count,
                color: data.color
            }))
            .sort((a, b) => b.value - a.value);
    }, [contracts]);

    return (
        <Card className="xl:col-span-1 bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm h-full max-h-[380px] flex flex-col">
            <CardHeader className="py-3 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3 shrink-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Filter size={18} />
                </div>
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {t('contracts.charts.statusDistribution', { defaultValue: 'Contract Status Distribution' })}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                <div className="flex-1 min-h-0 flex items-center justify-center p-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-medium uppercase block mb-0.5">{t('common.total', { defaultValue: 'Toplam' })}</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white block">
                                {contracts.length}
                            </span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={2}
                                dataKey="count" // Visualizing count as requested "how many contracts"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any, name: any, props: any) => [
                                    `${value} ${t('contracts.calendar.contracts', { defaultValue: 'Contracts' })} (${formatCurrency(props.payload.value)})`,
                                    t(`status.${name}`, { defaultValue: name })
                                ]}
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend Table */}
                <div className="px-4 pb-4 overflow-y-auto max-h-[100px]">
                    <div className="space-y-2">
                        {statusData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        {t(`status.${item.name}`, { defaultValue: item.name })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500 font-bold">{item.count}</span>
                                    <span className="text-slate-400 w-16 text-right">{formatCurrency(item.value)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
