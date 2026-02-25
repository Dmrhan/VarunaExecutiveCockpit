import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Deal } from '../../types/crm';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

const CHART_COLORS = [
    '#6366f1', '#8b5cf6', '#a78bfa', '#ec4899', '#f43f5e',
    '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#84cc16'
];

interface CustomerPotentialChartProps {
    deals: Deal[];
}

export function CustomerPotentialChart({ deals }: CustomerPotentialChartProps) {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        // Only include open deals for "Potential"
        const openDeals = deals.filter(d => !['Won', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage));

        const grouped = openDeals.reduce((acc, deal) => {
            const customer = deal.customerName || 'Unknown';
            if (!acc[customer]) {
                acc[customer] = { customer, amount: 0, count: 0 };
            }
            acc[customer].amount += deal.value;
            acc[customer].count += 1;
            return acc;
        }, {} as Record<string, { customer: string; amount: number; count: number }>);

        return Object.values(grouped)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10); // Show top 10
    }, [deals]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between gap-4 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t('dashboardV2.customerPotential.potential')}:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {formatCurrency(data.amount)}₺
                            </span>
                        </div>
                        <div className="flex justify-between gap-4 text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t('dashboardV2.customerPotential.dealCount')}:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {data.count}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0 border-b border-slate-100 dark:border-slate-700/50 pb-4 bg-white/50 dark:bg-slate-800/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <Users size={16} className="text-indigo-500" />
                            {t('dashboardV2.customerPotential.title')}
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                            <TrendingUp size={10} />
                            {t('dashboardV2.customerPotential.subtitle')}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col min-h-[300px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-700" opacity={0.5} />
                            <XAxis
                                type="number"
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                tick={{ fill: 'currentColor', className: 'text-slate-500 dark:text-slate-400' }}
                                tickLine={false}
                                axisLine={false}
                                style={{ fontSize: '11px' }}
                            />
                            <YAxis
                                dataKey="customer"
                                type="category"
                                tick={{ fill: 'currentColor', fontWeight: 600, fontSize: '11px' }}
                                tickLine={false}
                                axisLine={false}
                                width={100}
                                interval={0}
                                className="text-slate-700 dark:text-slate-300"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm text-center">
                        {t('dashboardV2.productBalance.empty')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
