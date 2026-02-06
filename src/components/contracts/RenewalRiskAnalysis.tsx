import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../lib/utils';

export const RenewalRiskAnalysis = () => {
    const { t } = useTranslation();
    const { contracts } = useData();

    // Process Data for Donut Chart & Critical List
    const { riskDistribution, criticalContracts } = useMemo(() => {
        const distribution = [
            { name: 'High Risk', label: t('risk.High', { defaultValue: 'Yüksek Risk' }), value: 0, count: 0, color: '#f43f5e' }, // Rose 500
            { name: 'Medium Risk', label: t('risk.Medium', { defaultValue: 'Orta Risk' }), value: 0, count: 0, color: '#f59e0b' }, // Amber 500
            { name: 'Low Risk', label: t('risk.Low', { defaultValue: 'Düşük Risk' }), value: 0, count: 0, color: '#10b981' }, // Emerald 500
        ];

        const critical: any[] = [];

        contracts.filter(c => c.status === 'Active').forEach(c => {
            // Determine Risk Logic (Simple Mock Logic based upon mock data or real fields)
            // If paymentDiscipline is poor or manually flagged, or standard "riskLevel" from mock
            // Using the existing 'riskLevel' from mockData if available, or deriving it.
            // Assumption: c.riskLevel exists from previous steps.

            // Fallback risk calculation if field is missing (safe guard)
            let risk = (c as any).riskLevel || 'Low';

            // Map to distribution
            const distIndex = risk === 'High' ? 0 : risk === 'Medium' ? 1 : 2;
            distribution[distIndex].value += c.totalValueTL;
            distribution[distIndex].count += 1;

            // Add to critical list if High/Medium and expiring soon
            if ((risk === 'High' || risk === 'Medium') && c.daysToRenewal <= 90) {
                critical.push({
                    id: c.id,
                    name: c.customerName,
                    value: c.totalValueTL,
                    days: c.daysToRenewal,
                    risk: risk,
                    product: c.productGroup
                });
            }
        });

        // Filter out zero values for chart
        const chartData = distribution.filter(d => d.value > 0);

        // Sort critical list by value desc, take top 4
        const criticalList = critical.sort((a, b) => b.value - a.value).slice(0, 4);

        return { riskDistribution: chartData, criticalContracts: criticalList };
    }, [contracts]);

    const totalRiskValue = riskDistribution.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="xl:col-span-2 bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm h-[380px] flex flex-col">
            <CardHeader className="py-3 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3 shrink-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <ShieldAlert size={18} />
                </div>
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {t('contracts.risk.title') || "Renewal Risk Analysis"}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 grid grid-cols-1 md:grid-cols-2">

                {/* Left: Donut Chart */}
                <div className="p-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-xs text-slate-400 font-medium uppercase block mb-0.5">{t('contracts.risk.totalValue', { defaultValue: 'Total Value' })}</span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white block">
                                {formatCurrency(totalRiskValue / 1000000)}M
                            </span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={riskDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {riskDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => formatCurrency(Number(value))}
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-[-10px]">
                        {riskDistribution.map(d => (
                            <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{d.label} ({formatCurrency(d.value / 1000000)}M)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Critical List */}
                <div className="p-4 flex flex-col">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertTriangle size={12} className="text-rose-500" />
                        {t('contracts.risk.criticalAttention', { defaultValue: 'Critical Attention Needed' })} (Top 4)
                    </h4>
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                        {criticalContracts.map((c) => (
                            <div key={c.id} className="group flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-rose-200 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 transition-colors">{c.name}</span>
                                    <span className="text-[10px] text-slate-400">{c.product} • {c.days} {t('contracts.risk.daysLeft', { defaultValue: 'days left' })}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(c.value)}</span>
                                    <span className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                                        c.risk === 'High' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                                    )}>
                                        {c.risk.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {criticalContracts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                                <CheckCircle size={24} className="text-emerald-500 mb-2 opacity-50" />
                                <span className="text-xs font-medium">{t('contracts.risk.noCritical', { defaultValue: 'No critical risks detected' })}</span>
                            </div>
                        )}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};
