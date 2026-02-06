import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { ArrowUpRight, ArrowDownRight, Package, X, Minimize2, Maximize2, FileSpreadsheet, FileText, Search, Mail, Volume2, Square, Loader2, AlertCircle, Sparkles, Send, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '../../lib/utils';
import type { ProductGroup, Deal } from '../../types/crm';
import { PRODUCT_COLORS } from '../../data/mockData';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AiService } from '../../services/AiService';
import { TtsService } from '../../services/TtsService';

interface ProductPerformanceProps {
    deals?: Deal[];
}

export function ProductPerformance({ deals: propDeals }: ProductPerformanceProps) {
    const { t, i18n } = useTranslation();
    const { deals: contextDeals, users } = useData();
    const deals = propDeals || contextDeals;
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // AI State
    const [aiState, setAiState] = useState<{
        dealId: string | null;
        type: 'risk' | 'email' | null;
        isLoading: boolean;
        result: any | null;
    }>({ dealId: null, type: null, isLoading: false, result: null });

    const [isSpeaking, setIsSpeaking] = useState(false);

    // ESC Key Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (aiState.type) {
                    closeAiPanel();
                } else if (selectedStage) {
                    setSelectedStage(null);
                } else {
                    setSelectedProduct(null);
                    setIsFullScreen(false);
                }
            }
        };

        if (selectedProduct) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            TtsService.stop();
        };
    }, [selectedProduct, selectedStage, aiState.type]);

    const closeAiPanel = () => {
        setAiState({ dealId: null, type: null, isLoading: false, result: null });
        TtsService.stop();
        setIsSpeaking(false);
    };

    const handleAiAction = async (deal: Deal, type: 'risk' | 'email') => {
        if (aiState.dealId === deal.id && aiState.type === type) return;

        setAiState({ dealId: deal.id, type, isLoading: true, result: null });
        TtsService.stop();
        setIsSpeaking(false);

        try {
            if (type === 'risk') {
                const result = await AiService.analyzeRisk(deal);
                setAiState(prev => ({ ...prev, isLoading: false, result }));
            } else {
                const user = users.find(u => u.id === deal.ownerId) || users[0];
                const result = await AiService.generateEmailDraft(deal, user);
                setAiState(prev => ({ ...prev, isLoading: false, result }));
            }
        } catch (error) {
            console.error(error);
            setAiState(prev => ({ ...prev, isLoading: false, result: null }));
        }
    };

    const toggleTts = (text: string) => {
        if (isSpeaking) {
            TtsService.stop();
            setIsSpeaking(false);
        } else {
            TtsService.speak(text);
            setIsSpeaking(true);
        }
    };

    const productStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, growth: number }> = {};

        deals.forEach(deal => {
            if (!stats[deal.product]) {
                stats[deal.product] = { revenue: 0, count: 0, growth: Math.floor(Math.random() * 40) - 10 }; // mocked growth
            }
            stats[deal.product].revenue += deal.value;
            stats[deal.product].count += 1;
        });

        // Ensure we always have the 6 main products even if no deals (optional, but good for UI consistency)
        const products: ProductGroup[] = ['EnRoute', 'Stokbar', 'Hosting', 'ServiceCore', 'Quest', 'Varuna'];
        products.forEach(p => {
            if (!stats[p]) stats[p] = { revenue: 0, count: 0, growth: 0 };
        });

        return Object.entries(stats)
            .filter(([name]) => products.includes(name as ProductGroup)) // Filter to known products
            .sort((a, b) => b[1].revenue - a[1].revenue);
    }, [deals]);

    // All deals for the selected product (used for charts)
    const productDeals = useMemo(() => {
        if (!selectedProduct) return [];
        return deals.filter(d => d.product === selectedProduct);
    }, [deals, selectedProduct]);

    // Deals filtered by stage (used for table view)
    const filteredDeals = useMemo(() => {
        if (!selectedStage) return productDeals;
        return productDeals.filter(d => d.stage === selectedStage);
    }, [productDeals, selectedStage]);

    // Analytics Data
    const analyticsData = useMemo(() => {
        if (!productDeals.length) return { stageData: [], trendData: [] };

        // Stage Distribution (Revenue Based)
        const byStage = productDeals.reduce((acc, deal) => {
            if (!acc[deal.stage]) {
                acc[deal.stage] = { value: 0, count: 0 };
            }
            acc[deal.stage].value += deal.value;
            acc[deal.stage].count += 1;
            return acc;
        }, {} as Record<string, { value: number, count: number }>);

        const stageData = Object.entries(byStage)
            .map(([name, stats]) => ({ name, value: stats.value, count: stats.count }))
            .sort((a, b) => b.value - a.value);

        // Trend Data (Last 6 Months)
        const now = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return {
                date: d,
                label: d.toLocaleDateString(i18n.language, { month: 'short' }),
                value: 0
            };
        }).reverse();

        productDeals.forEach(deal => {
            const d = new Date(deal.createdAt);
            const monthLabel = d.toLocaleDateString(i18n.language, { month: 'short' });
            const monthEntry = last6Months.find(m => m.label === monthLabel);
            if (monthEntry) {
                monthEntry.value += deal.value;
            }
        });

        return { stageData, trendData: last6Months };
    }, [productDeals, i18n.language]);

    const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#10b981', '#f59e0b'];

    const exportToExcel = () => {
        try {
            const data = filteredDeals.map(d => ({
                [t('opportunities.customer')]: d.customerName,
                [t('productPerformance.seller')]: users.find(u => u.id === d.ownerId)?.name || d.ownerId,
                [t('productPerformance.opportunityName')]: d.topic,
                [t('productPerformance.createdAt')]: new Date(d.createdAt).toLocaleDateString(i18n.language),
                [t('productPerformance.expectedRevenue')]: d.value,
                [t('productPerformance.daysOpen')]: d.aging
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, selectedProduct || 'Deals');
            XLSX.writeFile(wb, `${selectedProduct}_Deals_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Excel export error:', error);
            alert(t('common.error', { defaultValue: 'Bir hata oluştu.' }));
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const tableData = filteredDeals.map(d => [
                d.customerName,
                users.find(u => u.id === d.ownerId)?.name || d.ownerId,
                d.topic,
                new Date(d.createdAt).toLocaleDateString('tr-TR'),
                `$${d.value.toLocaleString()}`,
                `${d.aging}`
            ]);

            // @ts-ignore
            doc.autoTable({
                head: [[
                    t('opportunities.customer'),
                    t('productPerformance.seller'),
                    t('productPerformance.opportunityName'),
                    t('productPerformance.createdAt'),
                    t('executiveBrief.kpis.pipelineRevenue'),
                    t('productPerformance.daysOpen')
                ]],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] }
            });

            doc.save(`${selectedProduct}_Deals_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
            alert(t('common.error', { defaultValue: 'Bir hata oluştu.' }));
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {productStats.map(([product, stat]) => {
                    const color = PRODUCT_COLORS[product as ProductGroup] || '#64748b';
                    return (
                        <Card
                            key={product}
                            onClick={() => setSelectedProduct(product)}
                            className="flex flex-col justify-between group hover:border-[--hover-color] transition-all cursor-pointer bg-white dark:bg-slate-700 shadow-sm hover:shadow-md"
                            style={{ '--hover-color': color } as React.CSSProperties}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ backgroundColor: `${color}15`, color: color }}
                                    >
                                        <Package size={16} />
                                    </div>
                                    <div className={cn(
                                        "flex items-center text-xs font-bold",
                                        stat.growth >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {stat.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(stat.growth)}%
                                    </div>
                                </div>

                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{product}</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    ${(stat.revenue / 1000000).toFixed(1)}M
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    {stat.count} {t('performance.activeDeals')}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Portal Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedProduct && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => { setSelectedProduct(null); setIsFullScreen(false); setSelectedStage(null); }}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                            />

                            {/* Modal Container */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: 0,
                                    width: isFullScreen ? "100vw" : "auto",
                                    height: isFullScreen ? "100vh" : "auto"
                                }}
                                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                    "flex flex-col bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative z-10",
                                    isFullScreen
                                        ? "fixed inset-0 rounded-none w-screen h-screen"
                                        : "w-full max-w-6xl max-h-[85vh] rounded-3xl m-4"
                                )}
                            >
                                {/* Header */}
                                <div className="flex-shrink-0 p-4 md:p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-700 z-20 shadow-sm relative">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div
                                                    className="p-2 rounded-lg flex-shrink-0"
                                                    style={{
                                                        backgroundColor: `${PRODUCT_COLORS[selectedProduct as ProductGroup]}15`,
                                                        color: PRODUCT_COLORS[selectedProduct as ProductGroup]
                                                    }}
                                                >
                                                    <Package size={20} />
                                                </div>
                                                <h2 className="text-lg md:text-2xl font-light text-slate-900 dark:text-white">
                                                    {t('performance.productDetails')}: <span className="font-bold">{selectedProduct}</span>
                                                </h2>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs pl-12">
                                                {t('performance.listingDetails', { count: filteredDeals.length })}
                                                {selectedStage && (
                                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold dark:bg-indigo-500/20 dark:text-indigo-400 flex inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-200 transition-colors" onClick={() => setSelectedStage(null)}>
                                                        {selectedStage} <X size={10} />
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {isFullScreen && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); exportToExcel(); }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-bold transition-all border border-emerald-500/20"
                                                    >
                                                        <FileSpreadsheet size={14} />
                                                        <span className="hidden sm:inline">EXCEL</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); exportToPDF(); }}
                                                        className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-bold transition-all border border-rose-500/20"
                                                    >
                                                        <FileText size={14} />
                                                        <span className="hidden sm:inline">PDF</span>
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsFullScreen(!isFullScreen); }}
                                                className="p-2.5 bg-white dark:bg-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 transition-all border border-slate-200 dark:border-white/10"
                                                title={isFullScreen ? "Küçült" : "Tam Ekran"}
                                            >
                                                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); setIsFullScreen(false); setSelectedStage(null); }}
                                                className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/10"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Dashboard */}
                                <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-black/10 border-b border-slate-200 dark:border-white/5">
                                    {/* Trend Chart */}
                                    <div className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-500">
                                                <TrendingUp size={16} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('performance.trendTitle')}</h3>
                                        </div>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analyticsData.trendData}>
                                                    <defs>
                                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(value: any) => [`$${value?.toLocaleString() ?? 0}`, t('productPerformance.expectedRevenue')]}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Distribution Chart */}
                                    <div className="bg-white dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-500">
                                                <PieChartIcon size={16} />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('performance.distributionTitle')}</h3>
                                            {selectedStage && (
                                                <span className="text-[10px] text-slate-400 ml-auto">
                                                    Filter: <span className="font-bold text-indigo-500">{selectedStage}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-48 w-full flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={analyticsData.stageData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={60}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {analyticsData.stageData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                                stroke={selectedStage === entry.name ? "#000" : "none"}
                                                                strokeWidth={2}
                                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => setSelectedStage(selectedStage === entry.name ? null : entry.name)}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: any, name: any, props: any) => [
                                                            `$${value?.toLocaleString() ?? 0} (${props.payload.count} adet)`,
                                                            name
                                                        ]}
                                                    />
                                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-black/20 p-4 md:p-6 w-full relative">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead className="sticky top-0 bg-transparent z-10">
                                            <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                                                <th className="px-4 pb-4">{t('opportunities.customer')}</th>
                                                <th className="px-4 pb-4">{t('productPerformance.seller')}</th>
                                                <th className="px-4 pb-4">{t('productPerformance.opportunityName')}</th>
                                                <th className="px-4 pb-4 text-center">{t('performance.aiAnalysis')}</th>
                                                <th className="px-4 pb-4 text-right">{t('productPerformance.expectedRevenue')}</th>
                                                <th className="px-4 pb-4 text-right">{t('productPerformance.daysOpen')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDeals.map((deal) => {
                                                const owner = users.find(u => u.id === deal.ownerId);
                                                return (
                                                    <tr key={deal.id} className="group transition-all hover:translate-x-1">
                                                        <td className="bg-white dark:bg-white/5 p-4 first:rounded-l-2xl border-y border-l border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white leading-tight block">{deal.customerName}</span>
                                                            <span className="text-[10px] text-slate-400">{new Date(deal.createdAt).toLocaleDateString(i18n.language)}</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                                                                    {owner?.name.charAt(0)}
                                                                </div>
                                                                <span className="text-xs md:text-sm text-slate-600 dark:text-slate-300">{owner?.name || deal.ownerId}</span>
                                                            </div>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{deal.topic}</span>
                                                        </td>

                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleAiAction(deal, 'risk'); }}
                                                                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                                                    title={t('performance.riskAnalysis')}
                                                                >
                                                                    <Search size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleAiAction(deal, 'email'); }}
                                                                    className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                                                                    title={t('performance.emailDraft')}
                                                                >
                                                                    <Mail size={14} />
                                                                </button>
                                                            </div>
                                                        </td>

                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 text-right shadow-sm">
                                                            <span className="text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400">${(deal.value / 1000).toFixed(0)}k</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 last:rounded-r-2xl border-y border-r border-slate-200 dark:border-white/10 text-right shadow-sm">
                                                            <span className={cn(
                                                                "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                                                                deal.aging > 60 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                                            )}>
                                                                {deal.aging} G
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                </div>

                                {/* AI Side Drawer (Right Panel) */}
                                <AnimatePresence>
                                    {aiState.dealId && (
                                        <motion.div
                                            initial={{ x: "100%" }}
                                            animate={{ x: 0 }}
                                            exit={{ x: "100%" }}
                                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                            className="absolute top-0 right-0 bottom-0 z-50 w-full md:w-[450px] bg-white dark:bg-slate-700 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col"
                                        >
                                            <div className="flex-shrink-0 p-4 md:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2.5 rounded-xl shadow-sm", aiState.type === 'risk' ? "bg-indigo-100 text-indigo-600" : "bg-purple-100 text-purple-600")}>
                                                        {aiState.type === 'risk' ? <Sparkles size={18} /> : <Mail size={18} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            {aiState.type === 'risk' ? t('performance.analyzingTitle') : t('performance.emailAssistant')}
                                                        </h3>
                                                        <p className="text-xs text-slate-500">{t('performance.insights')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!aiState.isLoading && aiState.result && (
                                                        <button
                                                            onClick={() => toggleTts(
                                                                aiState.type === 'risk'
                                                                    ? `${aiState.result.analysis} Tavsiye: ${aiState.result.advice}`
                                                                    : aiState.result.body
                                                            )}
                                                            className={cn(
                                                                "p-2 rounded-lg transition-all",
                                                                isSpeaking
                                                                    ? "bg-rose-100 text-rose-600 animate-pulse"
                                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                            )}
                                                            title={t('performance.speak')}
                                                        >
                                                            {isSpeaking ? <Square size={16} className="fill-current" /> : <Volume2 size={16} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={closeAiPanel}
                                                        className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto p-4 md:p-6 relative">
                                                {aiState.isLoading ? (
                                                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                                                        <p className="text-sm font-medium animate-pulse">{t('performance.analyzing')}</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        {aiState.type === 'risk' && aiState.result && (
                                                            <>
                                                                <div className={cn(
                                                                    "p-5 rounded-2xl border flex items-start gap-4 shadow-sm",
                                                                    aiState.result.riskLevel === 'High' ? "bg-rose-50 border-rose-100 text-rose-900" :
                                                                        aiState.result.riskLevel === 'Medium' ? "bg-orange-50 border-orange-100 text-orange-900" :
                                                                            "bg-emerald-50 border-emerald-100 text-emerald-900"
                                                                )}>
                                                                    <AlertCircle size={24} className="flex-shrink-0" />
                                                                    <div>
                                                                        <h4 className="font-bold text-base mb-1">{t('performance.riskLevel')}: {aiState.result.riskLevel === 'High' ? t('recommendations.confidence.high') : aiState.result.riskLevel === 'Medium' ? t('recommendations.confidence.medium') : t('recommendations.confidence.low')}</h4>
                                                                        <p className="text-sm leading-relaxed opacity-90">{aiState.result.analysis}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-500/20">
                                                                    <h4 className="text-indigo-900 dark:text-indigo-300 font-bold text-xs mb-3 uppercase tracking-wider flex items-center gap-2">
                                                                        <Sparkles size={14} />
                                                                        {t('performance.strategicAdvice')}
                                                                    </h4>
                                                                    <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
                                                                        {aiState.result.advice}
                                                                    </p>
                                                                </div>
                                                            </>
                                                        )}

                                                        {aiState.type === 'email' && aiState.result && (
                                                            <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                                                                <div className="bg-slate-50 dark:bg-white/5 px-5 py-3 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('performance.subject')}:</span>
                                                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{aiState.result.subject}</span>
                                                                </div>
                                                                <div className="p-1">
                                                                    <textarea
                                                                        className="w-full h-[400px] bg-transparent border-0 resize-none text-sm text-slate-700 dark:text-slate-300 focus:ring-0 p-5 leading-relaxed font-mono"
                                                                        defaultValue={aiState.result.body}
                                                                    />
                                                                </div>
                                                                <div className="bg-slate-50 dark:bg-white/5 px-5 py-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
                                                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                                                                        <Send size={16} />
                                                                        {t('performance.send')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Footer */}
                                <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-700 text-center border-t border-slate-200 dark:border-white/5 z-20 relative">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('funnel.closeHint')}</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
