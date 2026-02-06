import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { generateExecutiveBrief } from '../../services/ExecutiveBriefService';
import { cn } from '../../lib/utils';

import type { Deal, Contract } from '../../types/crm';

interface AIExecutiveBriefProps {
    deals?: Deal[];
    contracts?: Contract[];
}

export function AIExecutiveBrief({ deals: propDeals, contracts: propContracts }: AIExecutiveBriefProps) {
    const { t } = useTranslation();
    const { deals: contextDeals, contracts: contextContracts } = useData();
    const deals = propDeals || contextDeals;
    const contracts = propContracts || contextContracts;
    const { narrativeParams, kpis } = generateExecutiveBrief(deals, contracts, t);

    return (
        <div className="space-y-6">
            {/* AI Narrative Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🧠</span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                            {t('executiveBrief.title')}
                        </h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                            <Trans
                                i18nKey="executiveBrief.narrative.part1"
                                values={{ status: t(`executiveBrief.narrative.status.${narrativeParams.status}`) }}
                                components={{ 1: <strong className="text-slate-900 dark:text-white font-bold" /> }}
                            />
                            {" "}
                            <Trans
                                i18nKey="executiveBrief.narrative.part2"
                                values={{ trend: t(`executiveBrief.narrative.trend.${narrativeParams.trend}`) }}
                                components={{ 1: <strong className="text-emerald-600 dark:text-emerald-400 font-bold" /> }}
                            />
                            {" "}
                            <Trans
                                i18nKey="executiveBrief.narrative.part3"
                                values={{ status: t(`executiveBrief.narrative.status.${narrativeParams.lossStatus}`) }}
                                components={{ 1: <strong className={narrativeParams.lossStatus === 'needsAttention' ? "text-rose-600" : "text-emerald-600"} /> }}
                            />
                            {" "}
                            <Trans
                                i18nKey="executiveBrief.narrative.part4"
                                values={{ strength: t(`executiveBrief.narrative.strength.${narrativeParams.pipelineStrength}`) }}
                                components={{ 1: <strong className="text-indigo-600 dark:text-indigo-400 font-bold" /> }}
                            />
                            {" "}
                            <Trans
                                i18nKey="executiveBrief.narrative.part5"
                                values={{ product: narrativeParams.topProduct }}
                                components={{ 1: <strong className="text-slate-900 dark:text-white font-bold" /> }}
                            />
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-5 gap-4">
                {kpis.map((kpi, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-shadow group"
                        title={kpi.tooltip}
                    >
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {kpi.label}
                            </span>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {kpi.value}
                                </span>
                                <div className={cn(
                                    "flex items-center gap-1 text-xs font-bold",
                                    kpi.trend === 'up' && "text-emerald-600 dark:text-emerald-400",
                                    kpi.trend === 'down' && "text-rose-600 dark:text-rose-400",
                                    kpi.trend === 'neutral' && "text-slate-500 dark:text-slate-400"
                                )}>
                                    {kpi.trend === 'up' && <TrendingUp size={14} />}
                                    {kpi.trend === 'down' && <TrendingDown size={14} />}
                                    {kpi.trend === 'neutral' && <Minus size={14} />}
                                    <span>{kpi.trendValue}</span>
                                </div>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={cn(
                                    "h-full rounded-full transition-all duration-500 group-hover:w-full",
                                    kpi.trend === 'up' && "bg-emerald-500 w-3/4",
                                    kpi.trend === 'down' && "bg-rose-500 w-1/2",
                                    kpi.trend === 'neutral' && "bg-slate-400 w-2/3"
                                )} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
