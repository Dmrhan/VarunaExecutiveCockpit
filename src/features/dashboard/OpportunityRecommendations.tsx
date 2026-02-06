import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, Plus, CheckCircle2, TrendingUp, BarChart3, Clock } from 'lucide-react';
import type { Recommendation, RecommendationType, ConfidenceLevel } from '../../services/ProductRecommendationService';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/Card';

interface OpportunityRecommendationsProps {
    recommendations: Recommendation[];
}

const TYPE_STYLES: Record<RecommendationType, { bg: string, text: string, icon: any }> = {
    'Cross-sell': { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: Plus },
    'Upsell': { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', icon: TrendingUp },
    'Gap': { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: BarChart3 },
    'Benchmark': { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', icon: CheckCircle2 },
    'Reactivation': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', icon: Clock },
};

const TYPE_MAPPING: Record<RecommendationType, string> = {
    'Cross-sell': 'crossSell',
    'Upsell': 'upsell',
    'Gap': 'gap',
    'Benchmark': 'benchmark',
    'Reactivation': 'reactivation'
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
    'High': 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20',
    'Medium': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20',
    'Low': 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700',
};

export function OpportunityRecommendations({ recommendations }: OpportunityRecommendationsProps) {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleAdd = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    if (recommendations.length === 0) {
        return (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 italic">Şu an için yeni bir öneri bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('recommendations.title')}</h3>
                </div>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">{t('recommendations.aiPowered')}</span>
            </div>

            <div className="flex flex-col gap-3">
                {recommendations.map((rec) => {
                    const style = TYPE_STYLES[rec.type];
                    const isExpanded = expandedId === rec.id;
                    const isAdded = addedIds.has(rec.id);

                    return (
                        <Card
                            key={rec.id}
                            className={cn(
                                "group cursor-pointer transition-all duration-300 border-l-4",
                                isExpanded ? "border-indigo-500 ring-2 ring-indigo-500/10" : "hover:border-indigo-500/50",
                                rec.type === 'Cross-sell' && "border-l-emerald-500",
                                rec.type === 'Upsell' && "border-l-blue-500",
                                rec.type === 'Benchmark' && "border-l-indigo-500",
                                rec.type === 'Reactivation' && "border-l-rose-500",
                            )}
                            onClick={() => toggleExpand(rec.id)}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight", style.bg, style.text)}>
                                                {t('recommendations.types.' + TYPE_MAPPING[rec.type], { defaultValue: rec.type })}
                                            </span>
                                            <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight", CONFIDENCE_STYLES[rec.confidence])}>
                                                {t('recommendations.confidence.' + rec.confidence.toLowerCase(), { defaultValue: 'Güven: ' + rec.confidence })}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {rec.productName}
                                            <span className="text-[10px] text-slate-400 font-normal">Etki: {rec.impact}</span>
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {rec.reason}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleAdd(rec.id, e)}
                                            disabled={isAdded}
                                            className={cn(
                                                "p-2 rounded-xl transition-all",
                                                isAdded
                                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                                            )}
                                        >
                                            {isAdded ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                                        </button>
                                        <div className="text-slate-400">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-600/50 animate-in slide-in-from-top-2">
                                        <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-2">{t('recommendations.detailedAnalysis')}</h5>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                            "{rec.detailedReason}"
                                        </p>
                                        <div className="mt-4 flex items-center gap-2 text-indigo-500 text-xs font-semibold group-hover:gap-3 transition-all">
                                            Teklif senaryosu oluştur <ArrowRight size={14} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <p className="text-[10px] text-center text-slate-400 italic mt-4">
                "Öneriler, mevcut fırsat bağlamı, sektör verileri ve müşteri segmenti analizine dayanmaktadır."
            </p>
        </div>
    );
}
