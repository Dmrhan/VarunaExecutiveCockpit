import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MetricInfo } from '../../components/ui/MetricInfo';

export function VelocityMeter() {
    const { deals } = useData();

    const data = useMemo(() => {
        // Group by stage and calculate average aging
        const groups: Record<string, { totalDays: number, count: number }> = {};

        deals.forEach(deal => {
            if (['Order', 'Lost'].includes(deal.stage)) return;

            if (!groups[deal.stage]) groups[deal.stage] = { totalDays: 0, count: 0 };
            groups[deal.stage].totalDays += deal.aging;
            groups[deal.stage].count += 1;
        });

        return Object.entries(groups).map(([stage, stats]) => ({
            stage,
            avgDays: Math.round(stats.totalDays / stats.count),
            count: stats.count
        })).sort((a, b) => b.avgDays - a.avgDays); // Sort by slowest stages
    }, [deals]);

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Deal Stagnation (Avg Days)</CardTitle>
                <MetricInfo
                    description="Average number of days deals spend in each stage. Highlights bottlenecks where deals are getting stuck."
                    formula="SUM(Days in Stage) / Count(Deals in Stage)"
                />
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="stage"
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            width={80}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg">
                                            <p className="font-semibold">{d.stage}</p>
                                            <p className="text-sm">Avg Age: <span className="font-mono font-bold text-amber-500">{d.avgDays} days</span></p>
                                            <p className="text-xs text-slate-500">{d.count} deals</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="avgDays" radius={[0, 4, 4, 0]} barSize={24} fill="#f59e0b" name="Avg Days" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
