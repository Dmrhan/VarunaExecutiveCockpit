import { useMemo } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, Cell, LabelList
} from 'recharts';
import { useTranslation } from 'react-i18next';

const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return value.toString();
};

const STATUS_COLORS: Record<string, string> = {
    '1': '#94a3b8', // Draft
    '2': '#818cf8', // Review
    '3': '#818cf8', // Review
    '4': '#059669', // Approved
    '5': '#f43f5e', // Rejected
    '6': '#3b82f6', // Sent
    '7': '#10b981', // Accepted
    '8': '#e11d48', // Canceled
    '9': '#475569', // Unknown
    '10': '#10b981', // Order
    Draft: '#94a3b8',
    Review: '#818cf8',
    Sent: '#60a5fa',
    Accepted: '#34d399',
    Approved: '#10b981',
    Rejected: '#f87171',
    Denied: '#ef4444',
};

interface QuotePoolAnalysisProps {
    data: { name: string; revenue: number }[];
    countData: { name: string; count: number }[];
    onStatusSelect: (status: string | null) => void;
    selectedStatus: string | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
            <p className="font-medium text-slate-200 uppercase tracking-wide">{label}</p>
            <p>Ciro: <span className="font-semibold text-emerald-400">{formatCurrency(payload[0]?.value)}</span></p>
            {payload[1] && <p>Adet: <span className="font-semibold text-indigo-300">{payload[1]?.value}</span></p>}
        </div>
    );
};

export function QuotePoolAnalysis({ data, countData, onStatusSelect, selectedStatus }: QuotePoolAnalysisProps) {
    const { t } = useTranslation();

    const chartData = useMemo(() => {
        return data
            .map(item => {
                const countItem = countData.find(c => c.name === item.name);
                return {
                    name: t(`quotes.status.${item.name}`, { defaultValue: item.name }),
                    rawName: item.name,
                    revenue: item.revenue,
                    count: countItem?.count ?? 0,
                };
            })
            .filter(d => d.revenue > 0 || d.count > 0)
            .sort((a, b) => b.revenue - a.revenue);
    }, [data, countData, t]);

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, index, value } = props;
        const itemData = chartData[index];
        if (!itemData || value === 0) return null;

        return (
            <g transform={`translate(${x + width / 2},${y - 10})`}>
                <text x={0} y={-8} dy={0} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={700}>
                    {formatCurrency(value)}
                </text>
                <text x={0} y={2} dy={0} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                    {itemData.count} adet
                </text>
            </g>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col h-full">
            <div className="mb-4">
                <h3 className="text-[11px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {t('quotes.poolAnalysis.title')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                    {t('quotes.poolAnalysis.subtitle')}
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 25, right: 16, left: 0, bottom: 20 }}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            dy={10}
                            height={70}
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                        <Bar
                            dataKey="revenue"
                            radius={[6, 6, 0, 0]}
                            cursor="pointer"
                            maxBarSize={56}
                            onClick={(data: any) => {
                                if (data?.payload?.rawName) {
                                    onStatusSelect(selectedStatus === data.payload.rawName ? null : data.payload.rawName);
                                }
                            }}
                        >
                            {chartData.map((entry) => (
                                <Cell
                                    key={entry.rawName}
                                    fill={STATUS_COLORS[entry.rawName] ?? '#94a3b8'}
                                    opacity={
                                        selectedStatus && selectedStatus !== 'all' && selectedStatus !== entry.rawName
                                            ? 0.3
                                            : 1
                                    }
                                />
                            ))}
                            <LabelList
                                dataKey="revenue"
                                content={renderCustomBarLabel}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
