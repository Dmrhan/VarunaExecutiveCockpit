import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { cn } from '../../lib/utils';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₺${(value / 1000).toFixed(0)}k`;
    if (value > 0) return `₺${value.toFixed(0)}`;
    return '';
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
        const statusConfig: Record<string, { color: string; label: string }> = {
            'Open': { color: '#0ea5e9', label: t('status.Open', { defaultValue: 'Open' }) },
            'Closed': { color: '#10b981', label: t('status.Closed', { defaultValue: 'Closed' }) },
            'Canceled': { color: '#f43f5e', label: t('status.Canceled', { defaultValue: 'Canceled' }) },
        };

        return data.map(item => {
            const countItem = countData.find(c => c.name === item.name);
            const config = statusConfig[item.name] || { color: '#64748b', label: t(`status.${item.name}`, { defaultValue: item.name }) };

            return {
                ...item,
                count: countItem ? countItem.count : 0,
                color: config.color,
                translatedName: config.label,
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [data, countData, t]);

    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-50">
                    <p className="font-semibold text-slate-800 dark:text-white mb-2">{data.translatedName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Toplam Tutar: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(data.revenue) || '₺0'}</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Sipariş Adedi: <span className="font-bold text-slate-900 dark:text-white">{data.count}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, index, value } = props;
        const itemData = poolData[index];
        if (value === 0) return null;

        return (
            <g transform={`translate(${x + width / 2},${y - 12})`}>
                <text x={0} y={-8} dy={0} textAnchor="middle" fill={itemData.color} fontSize={11} fontWeight={700}>
                    {formatCurrency(value)}
                </text>
                <text x={0} y={4} dy={0} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight={500}>
                    {itemData.count} {t('orders.units.count', { defaultValue: 'Adet' })}
                </text>
            </g>
        );
    };

    return (
        <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {t('orders.poolAnalysis.title', { defaultValue: 'Sipariş Dağılım Analizi' })}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        {t('orders.poolAnalysis.subtitle', { defaultValue: 'Siparişlerin durumlarına göre değer ve adet dağılımı' })}
                    </p>
                </div>
                <div className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    {t('common.filters.today')}: {formatCurrency(totalRevenue)}
                </div>
            </div>

            <div className="flex-1 w-full mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={poolData}
                        margin={{ top: 40, right: 10, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="translatedName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            dx={-10}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                            dataKey="revenue"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={80}
                        >
                            <LabelList dataKey="revenue" content={renderCustomBarLabel} />
                            {poolData.map((entry, index) => {
                                const isSelected = selectedStatus === entry.name;
                                const isDimmed = selectedStatus !== null && selectedStatus !== 'all' && !isSelected;

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        opacity={isDimmed ? 0.3 : 1}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                        onClick={() => onStatusSelect(isSelected ? null : entry.name)}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
