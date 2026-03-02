import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface FunnelItem {
    id: string;
    label: string;
    amount: number;
    count: number;
}

const COLORS = [
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#a855f7', // purple-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
    '#10b981', // emerald-500
];

export const ScorecardFunnel = ({ data }: { data: FunnelItem[] }) => {
    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₺${(val / 1000).toFixed(0)}k`;
        if (val > 0) return `₺${val.toFixed(0)}`;
        return '';
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        const { t } = useTranslation();
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white mb-1">{label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('scorecard.funnel.amount', 'Tutar')}: <span className="font-bold font-mono">{formatCurrency(data.amount)}</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('scorecard.funnel.count', 'Adet')}: <span className="font-bold font-mono">{data.count}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, index, value } = props;
        const itemData = data[index];
        if (value === 0) return null;

        return (
            <g transform={`translate(${x + width / 2},${y - 12})`}>
                <text x={0} y={-8} dy={0} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={700}>
                    {formatCurrency(value)}
                </text>
            </g>
        );
    };

    const { t } = useTranslation();

    return (
        <Card className="h-full flex flex-col overflow-hidden bg-white/40 dark:bg-slate-700/40 backdrop-blur-md">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2 text-center">
                    {t('scorecard.funnel.title', 'Operasyonel Dönüşüm Hunisi')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 h-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dy={10}
                            interval={0} // Ensure all labels show
                            angle={-20} // Tilt slightly if they are cramped
                            textAnchor="end"
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dx={-10}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            <LabelList dataKey="amount" content={renderCustomBarLabel} />
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
