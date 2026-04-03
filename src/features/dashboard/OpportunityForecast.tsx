import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, AlertTriangle, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { Deal } from '../../types/crm';
import { cn } from '../../lib/utils'; // Assuming cn exists, based on other files

export interface ForecastFilterDef {
    type: 'older' | 'month';
    date: Date;
}

interface OpportunityForecastProps {
    deals: Deal[];
    onMonthClick: (filter: ForecastFilterDef) => void;
    activeFilterMonth: ForecastFilterDef | null;
}

interface MonthlyData {
    bucketType: 'older' | 'month';
    date: Date; // First day of the month or reference date
    label: string;
    totalValue: number;
    weightedValue: number;
    count: number;
    overdueCount: number;
    isPast: boolean;
    isCurrent: boolean;
}

import { getMappedStageInfo } from './OpportunitiesDashboard';

export function OpportunityForecast({ deals, onMonthClick, activeFilterMonth }: OpportunityForecastProps) {
    const { t } = useTranslation();

    const forecastData = useMemo(() => {
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const months: MonthlyData[] = [];

        const threeMonthsAgo = new Date(currentMonthStart);
        threeMonthsAgo.setMonth(currentMonthStart.getMonth() - 3);

        // 1. "Daha Eski" bucket (Older than 3 months)
        months.push({
            bucketType: 'older',
            date: threeMonthsAgo,
            label: t('opportunities.forecast.older', 'Daha Eski'),
            totalValue: 0,
            weightedValue: 0,
            count: 0,
            overdueCount: 0,
            isPast: true,
            isCurrent: false
        });

        // 2. Past 3 Months (-3 to -1)
        for (let i = -3; i < 0; i++) {
            const date = new Date(currentMonthStart);
            date.setMonth(currentMonthStart.getMonth() + i);
            const monthLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            months.push({
                bucketType: 'month',
                date,
                label: monthLabel,
                totalValue: 0,
                weightedValue: 0,
                count: 0,
                overdueCount: 0,
                isPast: true,
                isCurrent: false
            });
        }

        // 3. Current and Future Months (0 to 11) - Total 12
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentMonthStart);
            date.setMonth(currentMonthStart.getMonth() + i);
            const isCurrentMonth = i === 0;
            const defaultLabel = date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
            const shortMonth = date.toLocaleDateString('tr-TR', { month: 'short' });
            const monthLabel = isCurrentMonth 
                ? `Bu Ay (${shortMonth})` 
                : defaultLabel;

            months.push({
                bucketType: 'month',
                date,
                label: monthLabel,
                totalValue: 0,
                weightedValue: 0,
                count: 0,
                overdueCount: 0,
                isPast: false,
                isCurrent: isCurrentMonth
            });
        }

        // Aggregate deals
        deals.forEach(deal => {
            if (!deal.expectedCloseDate) return;

            // Exclude won and lost deals from forecast
            const mappedStage = getMappedStageInfo(deal.stage).stage;
            const closedStages = ['Kazanıldı', 'Kaybedildi'];
            if (closedStages.includes(mappedStage) || closedStages.includes(deal.stage)) return;

            const closeDate = new Date(deal.expectedCloseDate);
            // Ignore invalid dates
            if (isNaN(closeDate.getTime())) return;

            // If it's strictly older than 3 months ago
            if (closeDate < threeMonthsAgo) {
                months[0].totalValue += deal.value;
                months[0].weightedValue += deal.value * (deal.probability / 100);
                months[0].count += 1;
                return;
            }

            // Find matching month bucket
            const monthIndex = months.findIndex(m =>
                m.bucketType === 'month' &&
                m.date.getFullYear() === closeDate.getFullYear() &&
                m.date.getMonth() === closeDate.getMonth()
            );

            if (monthIndex >= 0) {
                const month = months[monthIndex];
                const isOverdue = closeDate < today;

                month.totalValue += deal.value;
                month.weightedValue += deal.value * (deal.probability / 100);
                month.count += 1;

                if (isOverdue && month.isCurrent) {
                    month.overdueCount += 1;
                }
            }
        });

        return months;
    }, [deals, t]);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `₺${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₺${(val / 1000).toFixed(0)}k`;
        if (val > 0) return `₺${val.toFixed(0)}`;
        return '';
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload as MonthlyData;
            return (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-50">
                    <p className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center justify-between gap-4">
                        {label}
                        {data.overdueCount > 0 && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                                <AlertCircle size={10} />
                                {data.overdueCount} Geciken
                            </span>
                        )}
                        {data.isPast && data.bucketType === 'month' && (
                             <span className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                             Geciken Ay
                         </span>
                        )}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Toplam Tutar: <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(data.totalValue) || '₺0'}</span>
                    </p>

                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Açık Fırsat: <span className="font-bold">{data.count}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, index, value } = props;
        const monthData = forecastData[index];
        if (value === 0) return null; // Don't show labels on empty bars

        const labelColor = monthData.isPast ? '#ef4444' : '#f97316'; // red-500 or orange-500
        const darkLabelColor = monthData.isPast ? 'dark:fill-red-400' : 'dark:fill-orange-400';

        return (
            <g transform={`translate(${x + width / 2},${y - 12})`}>
                <text x={0} y={-8} dy={0} textAnchor="middle" fill={labelColor} fontSize={11} fontWeight={600} className={darkLabelColor}>
                    {formatCurrency(value)}
                </text>
                <text x={0} y={4} dy={0} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight={500}>
                    {monthData.count} Fırsat
                </text>
            </g>
        );
    };

    return (
        <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {t('opportunities.forecast.title', 'Tahmini Kapanış Öngörüsü')}
                            </CardTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('opportunities.forecast.subtitle', 'Önümüzdeki 12 ay ve geçmiş için beklenen açık satış hacmi')}
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={forecastData}
                        margin={{ top: 40, right: 30, left: 10, bottom: 5 }}
                        onClick={(data: any) => {
                            if (data && data.activePayload) {
                                const payload = data.activePayload[0].payload as MonthlyData;
                                onMonthClick({ type: payload.bucketType, date: payload.date });
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="label"
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
                            dataKey="totalValue"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        >
                            <LabelList dataKey="totalValue" content={renderCustomBarLabel} />
                            {forecastData.map((entry, index) => {
                                const isSelected = activeFilterMonth &&
                                    activeFilterMonth.type === entry.bucketType &&
                                    activeFilterMonth.date.getFullYear() === entry.date.getFullYear() &&
                                    activeFilterMonth.date.getMonth() === entry.date.getMonth();

                                const defaultFill = entry.isPast ? '#ef4444' : '#f97316'; // red-500 or orange-500
                                const activeFill = entry.isPast ? '#dc2626' : '#ea580c'; // red-600 or orange-600
                                const strokeColor = entry.isPast ? '#991b1b' : '#9a3412';

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isSelected ? activeFill : defaultFill}
                                        opacity={isSelected ? 1 : 0.85}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                                        stroke={isSelected ? strokeColor : 'transparent'}
                                        strokeWidth={isSelected ? 2 : 0}
                                        onClick={() => onMonthClick({ type: entry.bucketType, date: entry.date })}
                                    />
                                );
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
