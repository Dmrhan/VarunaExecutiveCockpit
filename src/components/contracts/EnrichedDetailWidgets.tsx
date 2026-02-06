import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { History, CheckCircle, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import type { Contract } from '../../types/crm';

interface EnrichmentProps {
    contract: Contract;
}

export const RenewalHistoryWidget = ({ contract }: EnrichmentProps) => {
    const { t } = useTranslation();
    const history = contract.renewalHistory || [];

    return (
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-full">
            <CardHeader className="py-3 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <History size={14} />
                    {t('contracts.enrichment.renewalHistory') || "Renewal History"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {history.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                        {t('contracts.enrichment.noRenewalHistory', { defaultValue: 'No previous renewal records found.' })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((event, idx) => (
                            <div key={idx} className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 pb-4 last:pb-0">
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-800"></div>
                                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                    {formatDate(event.date)}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {event.action} • <span className={event.priceChangePercentage > 0 ? "text-emerald-600" : "text-slate-500"}>
                                        {event.priceChangePercentage > 0 ? '+' : ''}{event.priceChangePercentage}% {t('contracts.enrichment.priceChange', { defaultValue: 'Price' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export const PaymentDisciplineWidget = ({ contract }: EnrichmentProps) => {
    const { t } = useTranslation();
    const discipline = contract.paymentDiscipline;

    if (!discipline) return null;

    const getTrendIcon = () => {
        if (discipline.trend === 'Improving') return <TrendingUp size={16} className="text-emerald-500" />;
        if (discipline.trend === 'Declining') return <TrendingDown size={16} className="text-red-500" />;
        return <Minus size={16} className="text-slate-400" />;
    };

    return (
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-full">
            <CardHeader className="py-3 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle size={14} />
                    {t('contracts.enrichment.paymentDiscipline') || "Payment Discipline"}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('contracts.enrichment.avgDelay', { defaultValue: 'Avg Delay' })}</div>
                        <div className={`text-xl font-light ${discipline.averageDelayDays > 15 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {discipline.averageDelayDays} <span className="text-xs text-slate-400">{t('common.days', { defaultValue: 'days' })}</span>
                        </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{t('contracts.enrichment.consistency', { defaultValue: 'Consistency' })}</div>
                        <div className="text-xl font-light text-slate-700 dark:text-slate-200">
                            {discipline.consistencyScore}<span className="text-xs text-slate-400">%</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between px-2 bg-slate-50 dark:bg-slate-700/20 py-2 rounded">
                    <span className="text-xs text-slate-500 font-medium">{t('contracts.enrichment.trend', { defaultValue: 'Trend' })}</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {t(`contracts.enrichment.trends.${discipline.trend}`, { defaultValue: discipline.trend })}
                        {getTrendIcon()}
                    </div>
                </div>

                {/* AI Insight Simulation */}
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                            <AlertTriangle size={12} className="text-indigo-500" />
                        </div>
                        <p className="text-[10px] text-indigo-800 dark:text-indigo-200 leading-relaxed italic">
                            "{t('contracts.enrichment.aiInsight', { defaultValue: 'Customer typically pays on time...' })}"
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
