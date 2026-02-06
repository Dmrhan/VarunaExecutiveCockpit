import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Contract, CollectionAnalysisResult } from '../../types/crm';
import { PaymentPlanTable } from './PaymentPlanTable';
import { CollectionAnalysisCard } from './CollectionAnalysisCard';
import { RenewalHistoryWidget, PaymentDisciplineWidget } from './EnrichedDetailWidgets';
import { analyzeCollectionRisk } from '../../services/CollectionAnalysisService';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Calendar, CreditCard, FileText, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';

interface ContractDetailViewProps {
    contractId: string;
    onBack?: () => void;
}

export const ContractDetailView = ({ contractId, onBack }: ContractDetailViewProps) => {
    const { contracts } = useData();
    const { t } = useTranslation();
    const contract = contracts.find((c: Contract) => c.id === contractId);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<CollectionAnalysisResult | undefined>(undefined);

    if (!contract) return <div>{t('common.notFound', { defaultValue: 'Contract not found' })}</div>;

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeCollectionRisk(contract);
            setAnalysis(result);
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-2">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-light text-slate-900 dark:text-white tracking-tight">
                        {contract.customerName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-mono">{contract.id}</span>
                        <span>•</span>
                        <span>{contract.productGroup}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${contract.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {t(`status.${contract.status}`)}
                    </span>
                </div>
            </div>

            {/* Top Cards: Summary & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contract Terms Summary */}
                <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5">
                        <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} />
                            {t('contracts.details.termsTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">{t('contracts.details.totalValue')}</p>
                            <p className="text-lg font-mono font-medium text-slate-900 dark:text-white">
                                {formatCurrency(contract.totalValue, contract.currency)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">{t('contracts.details.startDate')}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Calendar size={14} className="text-slate-400" />
                                {formatDate(contract.startDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">{t('contracts.details.billingFreq')}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <CreditCard size={14} className="text-slate-400" />
                                {t(`period.${contract.billingCadence}`, { defaultValue: contract.billingCadence })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">{t('contracts.details.renewal')}</p>
                            <p className={`text-sm font-bold flex items-center gap-1 ${contract.daysToRenewal < 90 ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                {contract.daysToRenewal} {t('common.days', { defaultValue: 'Days' })}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* AI Analysis */}
                <CollectionAnalysisCard
                    analysis={analysis}
                    onAnalyze={handleAnalyze}
                    isLoading={isAnalyzing}
                />
            </div>

            {/* Enrichment: History & Discipline (Control Tower Ext) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[300px]">
                <RenewalHistoryWidget contract={contract} />
                <PaymentDisciplineWidget contract={contract} />
            </div>

            {/* Payment Schedule */}
            <div className="h-[500px]">
                <PaymentPlanTable installments={contract.paymentPlan || []} />
            </div>
        </div>
    );
};
