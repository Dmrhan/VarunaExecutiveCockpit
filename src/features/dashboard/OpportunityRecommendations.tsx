import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp, Plus, CheckCircle2, TrendingUp, BarChart3, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Recommendation, RecommendationType, ConfidenceLevel } from '../../services/ProductRecommendationService';
import { cn } from '../../lib/utils';

interface OpportunityRecommendationsProps {
    recommendations: Recommendation[];
}

const TYPE_CONFIG: Record<RecommendationType, { label: string; icon: any }> = {
    'Cross-sell': { label: 'crossSell', icon: Plus },
    'Upsell': { label: 'upsell', icon: TrendingUp },
    'Gap': { label: 'gap', icon: BarChart3 },
    'Benchmark': { label: 'benchmark', icon: CheckCircle2 },
    'Reactivation': { label: 'reactivation', icon: Clock },
};

const CONFIDENCE_STYLES: Record<ConfidenceLevel, string> = {
    'High': 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30',
    'Medium': 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600/50 border-slate-200 dark:border-slate-500/30',
    'Low': 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600/30',
};

const CAROUSEL_INTERVAL = 10000;

export function OpportunityRecommendations({ recommendations }: OpportunityRecommendationsProps) {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [isHovered, setIsHovered] = useState(false);

    const total = recommendations.length;

    const goTo = useCallback((index: number) => {
        setCurrentIndex(((index % total) + total) % total);
        setIsExpanded(false);
    }, [total]);

    const goPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        goTo(currentIndex - 1);
    };

    const goNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        goTo(currentIndex + 1);
    };

    useEffect(() => {
        if (total <= 1 || isHovered || isExpanded) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % total);
        }, CAROUSEL_INTERVAL);
        return () => clearInterval(timer);
    }, [total, isHovered, isExpanded]);

    const handleAdd = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    if (total === 0) {
        return (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 italic">Şu an için yeni bir öneri bulunmuyor.</p>
            </div>
        );
    }

    const rec = recommendations[currentIndex];
    const { icon: TypeIcon } = TYPE_CONFIG[rec.type];
    const isAdded = addedIds.has(rec.id);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-indigo-500 animate-pulse" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('recommendations.title')}
                    </h3>
                </div>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                    {t('recommendations.aiPowered')}
                </span>
            </div>

            {/* Carousel Card */}
            <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsExpanded(v => !v)}
            >
                <div className={cn(
                    "rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/60 transition-all duration-300",
                    isExpanded
                        ? "ring-2 ring-indigo-500/20 border-indigo-300 dark:border-indigo-500/50"
                        : "hover:border-indigo-300 dark:hover:border-indigo-500/40"
                )}>
                    {/* Accent top bar */}
                    <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-indigo-500 to-indigo-400" />

                    <div className="p-5">
                        {/* Type + Confidence badges */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-600/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-500/40">
                                <TypeIcon size={11} />
                                {t('recommendations.types.' + TYPE_CONFIG[rec.type].label, { defaultValue: rec.type })}
                            </span>
                            <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border",
                                CONFIDENCE_STYLES[rec.confidence]
                            )}>
                                {t('recommendations.confidence.' + rec.confidence.toLowerCase(), { defaultValue: rec.confidence })}
                            </span>
                            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Etki: {rec.impact}
                            </span>
                        </div>

                        {/* Product name */}
                        <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-1.5">
                            {rec.productName}
                        </h4>

                        {/* Reason */}
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {rec.reason}
                        </p>

                        {/* Expanded detail */}
                        {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-600/50 animate-in slide-in-from-top-1 duration-200">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    {t('recommendations.detailedAnalysis')}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                                    "{rec.detailedReason}"
                                </p>
                                <div className="mt-4 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold group-hover:gap-2.5 transition-all">
                                    Teklif senaryosu oluştur <ArrowRight size={13} />
                                </div>
                            </div>
                        )}

                        {/* Footer row */}
                        <div className="flex items-center justify-between mt-4">
                            <button
                                onClick={(e) => handleAdd(rec.id, e)}
                                disabled={isAdded}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                                    isAdded
                                        ? "bg-slate-100 dark:bg-slate-600/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-500/40"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                                )}
                            >
                                {isAdded ? <><CheckCircle2 size={13} /> Eklendi</> : <><Plus size={13} /> Fırsata Ekle</>}
                            </button>

                            <div className="text-slate-400 dark:text-slate-500">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prev / Next buttons — only show when hovered and multiple items */}
                {total > 1 && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </>
                )}
            </div>

            {/* Dot navigation + counter */}
            {total > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {recommendations.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={cn(
                                "rounded-full transition-all duration-300",
                                i === currentIndex
                                    ? "w-5 h-1.5 bg-indigo-500"
                                    : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-indigo-300 dark:hover:bg-indigo-500/50"
                            )}
                        />
                    ))}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-mono">
                        {currentIndex + 1}/{total}
                    </span>
                </div>
            )}

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 italic">
                Öneriler, fırsat bağlamı ve müşteri segmenti analizine dayanmaktadır.
            </p>
        </div>
    );
}
