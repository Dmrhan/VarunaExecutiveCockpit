import { useMemo } from 'react';
import { Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';

export function InsightPanel() {
    const { metrics, isLoading } = useData();

    const insight = useMemo(() => {
        if (isLoading) return "Analyzing pipeline data...";

        const { stalledDealsCount, executionConfidenceScore, leakageByStage } = metrics;
        const leakageHigh = (leakageByStage['Proposal'] || 0) > 5;

        let narrative = `Overall execution confidence is at ${executionConfidenceScore}%. `;

        if (stalledDealsCount > 10) {
            narrative += `Attention needed: ${stalledDealsCount} deals are stalled in the pipeline for over 30 days. `;
        }

        if (leakageHigh) {
            narrative += `Significant drop-off detected at the Proposal stage. Consider reviewing pricing strategy or proposal quality. `;
        } else {
            narrative += `Funnel progression looks healthy from Lead to Qualified. `;
        }

        return narrative;
    }, [metrics, isLoading]);

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-800 text-white border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center gap-2 text-indigo-100 mb-1">
                    <Sparkles size={16} className="text-yellow-300" />
                    <span className="text-xs font-medium uppercase tracking-wider">AI Executive Brief</span>
                </div>
                <CardTitle className="text-2xl md:text-3xl text-white font-light leading-snug">
                    {isLoading ? "Generating insights..." : insight}
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pt-4 flex gap-4">
                {metrics.stalledDealsCount > 0 && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                        <AlertTriangle size={16} className="text-amber-300" />
                        <span className="text-sm font-medium">{metrics.stalledDealsCount} Stalled Deals</span>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                    <TrendingUp size={16} className="text-emerald-300" />
                    <span className="text-sm font-medium">Projected Growth: +12%</span>
                </div>
            </CardContent>
        </Card>
    );
}
