import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, Copy, Check, RefreshCw, MessageSquare, Lightbulb, User } from 'lucide-react';
import type { Deal } from '../../types/crm';
import { cn } from '../../lib/utils';
import { getRecommendationsForDeal } from '../../services/ProductRecommendationService';
import { OpportunityRecommendations } from './OpportunityRecommendations';

interface OpportunityDetailModalProps {
    deal: Deal | null;
    isOpen: boolean;
    onClose: () => void;
}

export function OpportunityDetailModal({ deal, isOpen, onClose }: OpportunityDetailModalProps) {
    const { t } = useTranslation();

    const TONES = [
        { id: 'formal', label: t('opportunityModal.tones.formal'), icon: '👔' },
        { id: 'persuasive', label: t('opportunityModal.tones.persuasive'), icon: '🔥' },
        { id: 'friendly', label: t('opportunityModal.tones.friendly'), icon: '🤝' },
        { id: 'urgent', label: t('opportunityModal.tones.urgent'), icon: '⏰' },
    ];

    const [activeTab, setActiveTab] = useState<'assistant' | 'recommendations'>('recommendations');
    const [tone, setTone] = useState('formal');
    const [generatedText, setGeneratedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const recommendations = deal ? getRecommendationsForDeal(deal) : [];

    useEffect(() => {
        if (isOpen) {
            setGeneratedText('');
            setIsGenerating(false);
            setCopied(false);
        }
    }, [isOpen, deal]);

    const generateResponse = () => {
        if (!deal) return;
        setIsGenerating(true);

        // Mock AI Generation delay
        setTimeout(() => {
            const customer = deal.customerName;
            const product = deal.product;
            const value = deal.value.toLocaleString();

            let text = '';

            switch (tone) {
                case 'formal':
                    text = `Sayın ${customer} Yetkilisi,\n\n${product} projesi için göndermiş olduğumuz teklifimizin detaylarını inceleme fırsatınız oldu mu? ${value}$ tutarındaki bu yatırımın firmanıza katacağı değer konusunda oldukça heyecanlıyız. Sorularınız olursa yanıtlamaktan memnuniyet duyarız.\n\nSaygılarımla,`;
                    break;
                case 'persuasive':
                    text = `Merhaba,\n\n${customer} için hazırladığımız ${product} çözümünün, süreçlerinizi %40 oranında hızlandıracağını öngörüyoruz. Rakiplerinizin önüne geçmek ve bu avantajı hemen kullanmaya başlamak için teklifimizi tekrar gözden geçirmenizi rica ederim. Dönüşünüzü bekliyorum!`;
                    break;
                case 'friendly':
                    text = `Selamlar,\n\n${product} ile ilgili son görüşmemizden sonra aklınıza takılan bir şey oldu mu diye merak ettim. Size yardımcı olabileceğim bir konu varsa lütfen çekinmeyin. ${deal.title} konusunda birlikte çalışmayı çok isteriz.\n\nSevgiler,`;
                    break;
                case 'urgent':
                    text = `Merhabalar,\n\n${product} için sunduğumuz özel fiyatlandırmanın geçerlilik süresi dolmak üzere. ${value}$ tutarındaki bu teklifi kaçırmamanız için en kısa sürede dönüşünüzü rica ediyorum. Süreci hızlandırmak adına yapabileceğim bir şey var mı?`;
                    break;
                default:
                    text = `Merhaba, ${deal.title} hakkında görüşmek isteriz.`;
            }

            setGeneratedText(text);
            setIsGenerating(false);
        }, 1500);
    };

    const handleCopy = () => {
        if (!generatedText) return;
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!deal) return null;

    // Direct implementation of Modal if Dialog component is not robust or we want custom styling for this feature
    // Using a fixed overlay for simplicity based on the "Shell" context usually present
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-600 flex justify-between items-start bg-white dark:bg-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{deal.customerName}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{deal.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-slate-100 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 flex gap-6">
                    <button
                        onClick={() => setActiveTab('recommendations')}
                        className={cn(
                            "py-4 text-sm font-bold transition-all relative",
                            activeTab === 'recommendations'
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Lightbulb size={16} />
                            {t('opportunityModal.smartRecommendations')}
                        </div>
                        {activeTab === 'recommendations' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('assistant')}
                        className={cn(
                            "py-4 text-sm font-bold transition-all relative",
                            activeTab === 'assistant'
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} />
                            {t('opportunityModal.aiAssistant')}
                        </div>
                        {activeTab === 'assistant' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'recommendations' ? (
                        <OpportunityRecommendations recommendations={recommendations} />
                    ) : (
                        <>
                            {/* Tone Selection */}
                            <div className="mb-6">
                                <label className="text-xs font-bold uppercase text-slate-500 mb-3 block tracking-wider">{t('opportunityModal.communicationTone')}</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {TONES.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTone(t.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-sm gap-2",
                                                tone === t.id
                                                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900"
                                                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                            )}
                                        >
                                            <span className="text-xl">{t.icon}</span>
                                            <span className="font-medium">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generation Area */}
                            <div className="relative">
                                <div className={cn(
                                    "w-full min-h-[200px] p-5 rounded-2xl border text-sm leading-relaxed transition-all",
                                    generatedText
                                        ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                                        : "bg-slate-50 dark:bg-slate-700/50 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400"
                                )}>
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center gap-3 animate-pulse">
                                            <Sparkles className="animate-spin text-indigo-500" size={24} />
                                            <span>{t('opportunityModal.generating')}</span>
                                        </div>
                                    ) : generatedText ? (
                                        <div className="whitespace-pre-wrap">{generatedText}</div>
                                    ) : (
                                        <div className="text-center">
                                            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>{t('opportunityModal.placeholder')}</p>
                                        </div>
                                    )}
                                </div>

                                {generatedText && (
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                                            title="Kopyala"
                                        >
                                            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-600 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-700/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        {t('common.close')}
                    </button>
                    {activeTab === 'assistant' && (
                        <button
                            onClick={generateResponse}
                            disabled={isGenerating}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {generatedText ? <><RefreshCw size={16} /> {t('common.regenerate')}</> : <><Sparkles size={16} /> {t('opportunityModal.generateResponse')}</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
