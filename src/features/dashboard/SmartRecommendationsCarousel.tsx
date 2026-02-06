import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RecommendationCard {
    id: string;
    title: string;
    description: string;
    type: 'Cross-sell' | 'Gap' | 'Benchmark' | 'Reactivation';
    context: string;
    actionLabel: string;
}

export function SmartRecommendationsCarousel() {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    // Generate smart recommendations based on deal data
    // In a real app, this would come from an API or advanced logic
    const recommendations = (t('recommendations.items', { returnObjects: true }) as RecommendationCard[]) || [];

    const visibleCards = 1;
    const maxIndex = Math.max(0, recommendations.length - visibleCards);

    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
    };

    const typeStyles: Record<string, string> = {
        'Cross-sell': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
        'Gap': 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
        'Benchmark': 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
        'Reactivation': 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <Lightbulb className="text-indigo-500" size={20} />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('recommendations.title')}
                    </h2>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentIndex === maxIndex}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="relative overflow-hidden flex-1">
                <div
                    className="flex h-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {recommendations.map((rec, index) => (
                        <div
                            key={rec.id || index}
                            className="w-full flex-shrink-0 px-0.5" // px-0.5 to prevent cut-off shadows if any
                        >
                            <div className="h-full bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-white/10 hover:shadow-md transition-all duration-300 group flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                                        {rec.title}
                                    </h3>
                                    <span className={cn(
                                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border whitespace-nowrap",
                                        typeStyles[rec.type] || 'bg-slate-100'
                                    )}>
                                        {rec.type}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                                    {rec.description}
                                </p>

                                <div className="text-xs text-slate-500 dark:text-slate-500 italic border-t border-slate-100 dark:border-white/5 pt-3">
                                    {rec.context}
                                </div>

                                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all group-hover:gap-3 shadow-sm shadow-indigo-200 dark:shadow-none">
                                    {rec.actionLabel}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center">
                <span className="text-xs text-slate-400 font-medium">
                    {currentIndex + 1} / {recommendations.length}
                </span>
            </div>
        </div>
    );
}
