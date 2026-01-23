import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import type { DealStage } from '../../types/crm';

const STAGE_ORDER: DealStage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Order'];

export function FunnelChart() {
    const { deals } = useData();

    const data = useMemo(() => {
        // Count deals currently in each stage OR PASSED through each stage
        // A deal in 'Negotiation' counts for Lead, Qualified, Proposal, Negotiation.

        const counts: Record<string, number> = {};
        STAGE_ORDER.forEach(stage => counts[stage] = 0);

        deals.forEach(deal => {
            // Find index of current stage
            const currentIndex = STAGE_ORDER.indexOf(deal.stage);
            if (currentIndex === -1) {
                // If Lost, we assume it dropped at 'Lost' stage, but for funnel we usually track active flow.
                // For simplicity, let's just count active deals by their current stage for a "Snapshot Funnel"
                // Or strictly hierarchical if we want "Conversion Funnel".
                // Let's do a Snapshot Funnel first (Volume by Stage) as it's easier to verify with mock data.
                return;
            }

            // Hierarchical accumulation: A deal in Negotiation passed through previous stages
            for (let i = 0; i <= currentIndex; i++) {
                counts[STAGE_ORDER[i]]++;
            }

            // If deal is Won ('Order'), it passed all.
            // If deal is Lost, we might want to know where it was lost.
            // But for now, let's just show the count of ACTIVE + WON deals passing through.
        });

        return STAGE_ORDER.map((stage, idx) => {
            const value = counts[stage];
            const prevValue = idx > 0 ? counts[STAGE_ORDER[idx - 1]] : value;
            const conversion = prevValue > 0 ? Math.round((value / prevValue) * 100) : 0;

            return {
                name: stage,
                value,
                conversion: idx === 0 ? 100 : conversion,
                dropoff: idx === 0 ? 0 : 100 - conversion
            };
        });
    }, [deals]);

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Funnel Progression</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
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
                                            <p className="font-semibold">{d.name}</p>
                                            <p className="text-sm">Volume: <span className="font-mono">{d.value}</span></p>
                                            <p className="text-xs text-slate-500">Conv. Rate: {d.conversion}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#10b981' : '#6366f1'} opacity={0.8 - (index * 0.1)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
