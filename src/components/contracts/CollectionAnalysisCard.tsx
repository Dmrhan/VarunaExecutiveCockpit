import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CollectionAnalysisResult } from '../../types/crm';

interface CollectionAnalysisCardProps {
    analysis?: CollectionAnalysisResult;
    onAnalyze: () => void;
    isLoading: boolean;
}

export const CollectionAnalysisCard = ({ analysis, onAnalyze, isLoading }: CollectionAnalysisCardProps) => {
    const { t } = useTranslation();

    const getRiskColor = (level?: string) => {
        switch (level) {
            case 'High': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800';
            case 'Medium': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
            case 'Low': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
            default: return 'text-slate-600';
        }
    };

    return (
        <Card className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800/50 dark:to-slate-800 border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <CardHeader className="py-4 border-b border-indigo-100 dark:border-white/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 animate-pulse-slow" size={18} />
                    <CardTitle className="text-sm font-bold text-indigo-900 dark:text-indigo-100 uppercase tracking-wider">
                        {t('contracts.analysis.title')}
                    </CardTitle>
                </div>
                {!analysis && !isLoading && (
                    <button
                        onClick={onAnalyze}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-indigo-200 dark:shadow-none"
                    >
                        <RefreshCcw size={12} />
                        {t('contracts.analysis.analyzeBtn')}
                    </button>
                )}
            </CardHeader>

            <CardContent className="p-6 relative min-h-[200px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm z-10">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                            {t('contracts.analysis.analyzing')}
                        </p>
                    </div>
                ) : !analysis ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={24} />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {t('contracts.analysis.emptyStateTitle')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto">
                            {t('contracts.analysis.emptyStateDesc')}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Risk Score */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                                    {t('contracts.analysis.riskScore')}
                                </span>
                                <div className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
                                    {analysis.riskScore}/100
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getRiskColor(analysis.riskLevel)}`}>
                                {analysis.riskLevel} Risk
                            </div>
                        </div>

                        {/* Insights */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                                <TrendingUp size={12} className="text-slate-400" />
                                {t('contracts.analysis.insights')}
                            </h4>
                            <ul className="space-y-1.5">
                                {analysis.insights.map((insight, idx) => (
                                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                        <div className="mt-1 w-1 h-1 rounded-full bg-indigo-500 shrink-0"></div>
                                        {insight}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
                            <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <CheckCircle size={12} />
                                {t('contracts.analysis.recommendations')}
                            </h4>
                            <ul className="space-y-1.5">
                                {analysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-xs text-indigo-700 dark:text-indigo-300/80 flex items-start gap-2">
                                        <span className="text-indigo-400">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
};
