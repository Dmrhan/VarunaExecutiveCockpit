import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MetricInfo } from '../../components/ui/MetricInfo';

export function ConfidenceWidget() {
    const { metrics } = useData();
    const score = metrics.executionConfidenceScore;

    const data = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];

    const color = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Execution Confidence</CardTitle>
                <MetricInfo
                    description="% of OPEN deals that have had a valid sales activity (Call/Meeting) in the last 14 days."
                    formula="(Deals with Activity < 14 Days) / (Total Open Deals)"
                />
            </CardHeader>
            <CardContent className="flex-1 min-h-[160px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={180}
                            endAngle={0}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={10}
                        >
                            <Cell key="score" fill={color} />
                            <Cell key="bg" fill="#e2e8f0" className="dark:fill-slate-800" />
                        </Pie>
                        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 dark:fill-slate-100 text-3xl font-bold">
                            {score}
                        </text>
                        <text x="50%" y="60%" textAnchor="middle" className="fill-slate-400 text-xs font-medium uppercase">
                            Index Score
                        </text>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-slate-500 px-4">
                    % of active pipeline with engagement in the last 14 days.
                </div>
            </CardContent>
        </Card>
    );
}
