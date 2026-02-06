import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { TrendingUp, AlertTriangle, Target, DollarSign, Activity, Users, ArrowRight, Brain, ShieldAlert, BarChart3, Search, Zap } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { ResponsiveContainer, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart, Line } from 'recharts';
import { getManagementIntelligence } from '../../services/ManagementIntelligenceService';
import { generateExecutiveBrief } from '../../services/ExecutiveBriefService';

// Local mock data for Trend Chart


export function ExecutiveSummaryDashboard() {
    const { deals, metrics, orders } = useData();
    const { t } = useTranslation();



    const formatCurrencyMillions = (value: number) => {
        return `${(value / 1000000).toFixed(1)}M`;
    };

    // Executive Metrics
    const execMetrics = useMemo(() => {
        const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'Closed' ? o.amount : 0), 0);
        const pipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
        const activeDeals = deals.filter(d => !['Won', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage)).length;
        const winRate = orders.filter(o => o.status === 'Closed').length / (orders.length || 1) * 100;

        return {
            totalRevenue,
            pipelineValue,
            activeDeals,
            winRate
        };
    }, [deals, orders]);

    // AI Intelligence Data
    const intelligence = useMemo(() => getManagementIntelligence(deals, t), [deals, t]);
    const { narrativeParams } = useMemo(() => generateExecutiveBrief(deals, t), [deals, t]); // Re-use for base narrative values

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
            {/* Header Section */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
                <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white mb-2">{t('executive.title')}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t('executive.subtitle')}</p>
            </div>

            {/* SECTION 1: AI Executive Brief (Narrative) */}
            <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Brain size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('executiveBrief.title')}</h2>
                    </div>
                    <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 max-w-4xl">
                        <Trans
                            i18nKey="executiveBrief.narrative.part1"
                            values={{ status: t(`executiveBrief.narrative.status.${narrativeParams.status}`) }}
                            components={[<strong className="font-bold text-indigo-600 dark:text-indigo-400" />]}
                        />
                        {" "}
                        <Trans
                            i18nKey="executiveBrief.narrative.part2"
                            values={{ trend: t(`executiveBrief.narrative.trend.${narrativeParams.trend}`) }}
                            components={[<strong className="font-bold text-indigo-600 dark:text-indigo-400" />]}
                        />
                        {" "}
                        <Trans
                            i18nKey="executiveBrief.narrative.part3"
                            values={{ status: t(`executiveBrief.narrative.status.${narrativeParams.lossStatus}`) }}
                            components={[<strong className="font-bold text-indigo-600 dark:text-indigo-400" />]}
                        />
                        {" "}
                        <Trans
                            i18nKey="executiveBrief.narrative.part4"
                            values={{ strength: t(`executiveBrief.narrative.strength.${narrativeParams.pipelineStrength}`) }}
                            components={[<strong className="font-bold text-indigo-600 dark:text-indigo-400" />]}
                        />
                        {" "}
                        <Trans
                            i18nKey="executiveBrief.narrative.part5"
                            values={{ product: narrativeParams.topProduct }}
                            components={[<strong className="font-bold text-indigo-600 dark:text-indigo-400" />]}
                        />
                    </p>
                </div>
            </div>

            {/* SECTION 2: KPI Summary (Preserved but refined) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-800 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-slate-500 uppercase">{t('executive.kpis.totalRevenue')}</p>
                            <DollarSign size={18} className="text-emerald-500" />
                        </div>
                        <div className="flex items-end gap-2">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrencyMillions(execMetrics.totalRevenue)}</h3>
                            <div className="flex items-center text-emerald-600 text-sm mb-1 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                                <TrendingUp size={14} className="mr-1" />
                                +12%
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-slate-500 uppercase">{t('executive.kpis.pipelineValue')}</p>
                            <Activity size={18} className="text-blue-500" />
                        </div>
                        <h3 className="text-3xl font-light text-slate-900 dark:text-white">{formatCurrencyMillions(execMetrics.pipelineValue)}</h3>
                        <p className="text-sm text-slate-400 mt-2">{deals.length} {t('executive.kpis.totalOpportunities')}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-slate-500 uppercase">{t('executive.kpis.activeDeals')}</p>
                            <Target size={18} className="text-amber-500" />
                        </div>
                        <h3 className="text-3xl font-light text-slate-900 dark:text-white">{execMetrics.activeDeals}</h3>
                        <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded w-fit">
                            <AlertTriangle size={12} />
                            <span>{metrics.stalledDealsCount} {t('executive.kpis.stalledDeals')}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-slate-500 uppercase">{t('executive.kpis.winRate')}</p>
                            <Users size={18} className="text-indigo-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">%{execMetrics.winRate.toFixed(1)}</h3>
                        <p className="text-sm text-emerald-600 mt-2 font-medium">{t('executive.kpis.aboveIndustryAvg')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 3: Revenue Trend Section (Target vs Actual) */}
            <Card className="shadow-sm border-none bg-white dark:bg-slate-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-indigo-500" />
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">{t('executive.charts.revenueTrend.title')}</CardTitle>
                        </div>
                        {/* Legend/Context could go here */}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={intelligence.revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value / 1000000}M`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number | undefined) => [`$${((value || 0) / 1000000).toFixed(2)}M`, '']}
                                    labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area
                                    type="monotone"
                                    dataKey="actual"
                                    name={t('executive.charts.revenueTrend.actual')}
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorActual)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    name={t('executive.charts.revenueTrend.target')}
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SECTION 3: Risk & Warning Intelligence */}
                <Card className="lg:col-span-2 border-l-4 border-l-rose-500 shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="text-rose-500" />
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">{t('executive.risk.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {intelligence.risks.map((risk, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50">
                                <div className="mt-1">
                                    <AlertTriangle className="text-rose-600 dark:text-rose-400" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                                        {t(risk.messageKey, risk.messageParams) as string}
                                    </p>
                                </div>
                                {risk.trend && (
                                    <div className={`text-sm font-bold ${risk.trend === 'up' ? 'text-rose-600' : 'text-slate-500'}`}>
                                        {risk.trend === 'up' && '↑'} {risk.change}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* SECTION 4: Performance Distribution (Simplified) */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="text-blue-500" />
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">{t('executive.performance.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {intelligence.performance.map((perf, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {t(perf.messageKey, perf.messageParams) as string}
                                </p>
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                    <span>Top Performer: <span className="font-bold text-slate-800 dark:text-white">{perf.agentName}</span></span>
                                    <span className="font-bold text-emerald-600 text-lg">{perf.value}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECTION 5: Forecast & Confidence */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="text-purple-500" />
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">{t('executive.forecast.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6 mb-6">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                {/* Simple Donut Chart Representation for Confidence */}
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-purple-500" strokeDasharray={`${intelligence.forecast.confidence}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{intelligence.forecast.confidence}%</span>
                                    <span className="text-[10px] uppercase text-slate-400 font-bold">{t('executive.forecast.confidenceScore')}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                    {t(intelligence.forecast.messageKey, intelligence.forecast.messageParams) as string}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                        <div className="text-slate-400 text-xs mb-1">{t('executive.forecast.target')}</div>
                                        <div className="font-bold">{formatCurrencyMillions(intelligence.forecast.target)}</div>
                                    </div>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                                        <div className="text-emerald-600 dark:text-emerald-400 text-xs mb-1">{t('executive.forecast.bestCase')}</div>
                                        <div className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrencyMillions(intelligence.forecast.bestCase)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SECTION 6: Root Cause Analysis */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Search className="text-amber-500" />
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">{t('executive.rootCause.title')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {intelligence.rootCauses.map((rc, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-32 text-sm font-medium text-slate-600 dark:text-slate-400">{t(rc.reason)}</div>
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${rc.percentage}%` }}></div>
                                    </div>
                                    <div className="w-12 text-right text-sm font-bold text-slate-800 dark:text-white">{rc.percentage}%</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 7: AI Suggested Actions (Final & Critical) */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                        <Zap className="text-indigo-300" />
                    </div>
                    <h2 className="text-xl font-bold">{t('executive.actions.title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {intelligence.actions.map((action, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-5 hover:bg-white/20 transition-colors cursor-pointer group">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${action.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                                    {t(`recommendations.types.${action.type.toLowerCase()}`)}
                                </span>
                                <ArrowRight size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t(action.titleKey) as string}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {t(action.descriptionKey, action.params) as string}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
