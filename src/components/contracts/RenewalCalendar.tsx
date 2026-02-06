import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Contract } from '../../types/crm';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const RenewalCalendar = () => {
    const { contracts } = useData();
    const { t } = useTranslation();

    const calendarData = useMemo(() => {
        const months = [];
        const today = new Date();

        for (let i = 0; i < 12; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthKey = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

            let value = 0;
            let count = 0;
            let highRiskCount = 0;

            contracts.filter(c => c.status === 'Active').forEach(c => {
                const renewalDate = new Date(c.renewalDate);
                if (renewalDate >= monthStart && renewalDate <= monthEnd) {
                    value += c.totalValueTL;
                    count++;
                    if (c.riskLevel === 'High') highRiskCount++;
                }
            });

            months.push({
                name: monthKey,
                value,
                count,
                highRiskCount
            });
        }
        return months;
    }, [contracts]);

    const getBarColor = (data: any) => {
        if (data.highRiskCount > 0) return '#EF4444'; // Red if high risk exists
        if (data.value > 1000000) return '#F59E0B'; // Amber if high value
        return '#6366F1'; // Indigo default
    };

    return (
        <Card className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <CalendarClock size={18} />
                </div>
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {t('contracts.calendar.title') || "Renewal Calendar (Next 12M)"}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calendarData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-slate-800 text-white p-2 rounded text-xs shadow-xl border border-slate-700">
                                            <p className="font-bold mb-1">{data.name}</p>
                                            <p>{t('contracts.calendar.contracts', { defaultValue: 'Contracts' })}: {data.count}</p>
                                            <p>{t('contracts.calendar.target', { defaultValue: 'Target' })}: {formatCurrency(data.value)}</p>
                                            {data.highRiskCount > 0 && <p className="text-red-400 flex items-center gap-1"><AlertTriangle size={10} /> {data.highRiskCount} {t('contracts.calendar.highRisk', { defaultValue: 'High Risk' })}</p>}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                            {calendarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
