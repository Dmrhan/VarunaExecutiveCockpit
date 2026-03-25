import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Maximize2, Minimize2, FileSpreadsheet, FileText, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import type { DealStage } from '../../types/crm';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Deal } from '../../types/crm';

export const STAGE_CONFIG: { stage: DealStage | string; matchStages: string[]; color: string; probability: number }[] = [
    { stage: 'İlk Temas',           matchStages: ['Lead', 'Aday', 'Konumlama'],                    color: '#bae6fd', probability: 10  },  // sky-200
    { stage: 'İlerletiliyor',        matchStages: ['İlerletiliyor'],                                color: '#7dd3fc', probability: 10  },  // sky-300
    { stage: 'Randevu Alındı',       matchStages: ['Randevu Alındı'],                               color: '#38bdf8', probability: 10  },  // sky-400
    { stage: 'İletişim Kurulamadı',  matchStages: ['İletişim Kurulamadı'],                          color: '#818cf8', probability: 10  },  // indigo-400
    { stage: 'Sunum',                matchStages: ['Sunum'],                                        color: '#6366f1', probability: 30  },  // indigo-500
    { stage: 'Demo',                 matchStages: ['Demo'],                                         color: '#4f46e5', probability: 30  },  // indigo-600
    { stage: 'Teknik Analiz',        matchStages: ['Teknik Analiz'],                                color: '#4338ca', probability: 30  },  // indigo-700
    { stage: 'Teklif',               matchStages: ['Proposal', 'Teklif'],                           color: '#3730a3', probability: 60  },  // indigo-800
    { stage: 'Sözleşme Bekleniyor',  matchStages: ['Negotiation', 'Müzakere', 'Sözleşme Bekleniyor'], color: '#312e81', probability: 80 },  // indigo-900
    { stage: 'Kazanıldı',            matchStages: ['Order', 'Kazanıldı', 'Onaylandı'],              color: '#0d9488', probability: 100 },  // teal-600 (unchanged)
];

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

interface FunnelChartProps {
    deals?: Deal[];
}

export function FunnelChart({ deals: propDeals }: FunnelChartProps) {
    const { t } = useTranslation();
    const { deals: contextDeals, users } = useData();
    const deals = propDeals || contextDeals;
    const [selectedStage, setSelectedStage] = useState<DealStage | string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Filter & Sort State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState({
        topic: '',
        customer: '',
        owner: ''
    });

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // ESC Key Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedStage(null);
                setIsFullScreen(false);
            }
        };

        if (selectedStage) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedStage]);

    const funnelData = useMemo(() => {
        return STAGE_CONFIG.map((config, index) => {
            const stageDeals = deals.filter(d => config.matchStages.includes(d.stage));
            const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return {
                ...config,
                count: stageDeals.length,
                totalValue,
                deals: stageDeals
            };
        }).filter(item => item.count > 0); // Sadece veri olan aşamaları göster
    }, [deals]);

    const handleStageClick = (stage: DealStage | string) => {
        setSelectedStage(stage);
        setIsFullScreen(false);
    };

    const displayedDeals = useMemo(() => {
        if (!selectedStage) return [];
        let result = deals.filter(d => {
            const config = STAGE_CONFIG.find(c => c.stage === selectedStage);
            return config ? config.matchStages.includes(d.stage) : false;
        });

        // 1. Filter
        if (columnFilters.topic) {
            const search = columnFilters.topic.toLowerCase();
            result = result.filter(d => d.topic.toLowerCase().includes(search));
        }
        if (columnFilters.customer) {
            const search = columnFilters.customer.toLowerCase();
            result = result.filter(d => d.customerName.toLowerCase().includes(search));
        }
        if (columnFilters.owner) {
            const search = columnFilters.owner.toLowerCase();
            result = result.filter(d => {
                const name = (d.ownerName || users.find(u => u.id === d.ownerId)?.name || '').toLowerCase();
                return name.includes(search);
            });
        }

        // 2. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                let aVal: any;
                let bVal: any;

                if (sortConfig.key === 'ownerName') {
                    aVal = a.ownerName || users.find(u => u.id === a.ownerId)?.name || '';
                    bVal = b.ownerName || users.find(u => u.id === b.ownerId)?.name || '';
                } else if (sortConfig.key === 'expectedCloseDate') {
                    aVal = new Date(a.expectedCloseDate).getTime();
                    bVal = new Date(b.expectedCloseDate).getTime();
                } else {
                    aVal = (a as any)[sortConfig.key];
                    bVal = (b as any)[sortConfig.key];
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [deals, selectedStage, columnFilters, sortConfig, users]);

    const exportToExcel = () => {
        try {
            const data = displayedDeals.map(d => ({
                [t('opportunities.opportunityName', { defaultValue: 'Fırsat Adı' })]: d.topic,
                [t('opportunities.customer', { defaultValue: 'Müşteri' })]: d.customerName,
                [t('opportunities.owner', { defaultValue: 'Sahibi' })]: d.ownerName || users.find(u => u.id === d.ownerId)?.name || d.ownerId,
                [t('opportunities.closeDate', { defaultValue: 'Kapanış Tarihi' })]: new Date(d.expectedCloseDate).toLocaleDateString('tr-TR'),
                [t('opportunities.value') + ' ($)']: d.value,
                [t('opportunities.daysOpen', { defaultValue: 'Açık Gün' })]: d.aging
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, selectedStage || 'Deals');
            XLSX.writeFile(wb, `${selectedStage}_Deals_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Excel export error:', error);
            alert(t('common.error', { defaultValue: 'Bir hata oluştu.' }));
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const tableData = displayedDeals.map(d => [
                d.topic,
                d.customerName,
                d.ownerName || users.find(u => u.id === d.ownerId)?.name || d.ownerId,
                new Date(d.expectedCloseDate).toLocaleDateString('tr-TR'),
                `$${d.value.toLocaleString()}`,
                `${d.aging}`
            ]);

            // @ts-ignore
            doc.autoTable({
                head: [[
                    t('opportunities.opportunityName'),
                    t('opportunities.customer'),
                    t('opportunities.owner'),
                    t('opportunities.closeDate'),
                    t('opportunities.value'),
                    t('opportunities.daysOpen')
                ]],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] }
            });

            doc.save(`${selectedStage}_Deals_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
            alert(t('common.error', { defaultValue: 'Bir hata oluştu.' }));
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-3 bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden h-full">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {t('funnel.title')}
                    </CardTitle>
                    <p className="text-[10px] text-slate-400">{t('funnel.subtitle')}</p>
                </div>
                {/* Legend — full width, wraps gracefully */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {STAGE_CONFIG.map(s => (
                        <div key={s.stage} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-[8px] text-slate-500 font-bold uppercase whitespace-nowrap">{s.stage}</span>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-full max-w-2xl flex flex-col h-full min-h-[300px] justify-center gap-0.5">
                    {funnelData.map((item, index) => {
                        const n = funnelData.length;
                        // Each step clips at most 20% total width so bottom bar has at least 60% width
                        const maxTotalClip = 20;
                        const step = maxTotalClip / Math.max(1, n);
                        const topOff = index * step;
                        const botOff = (index + 1) * step;
                        const clipPath = `polygon(${topOff}% 0%, ${100 - topOff}% 0%, ${100 - botOff}% 100%, ${botOff}% 100%)`;

                        // Text padding: use the midpoint offset of this row + a small buffer
                        // This keeps text inside the narrowest visible part of the trapezoid
                        const midOff = (topOff + botOff) / 2;
                        const paddingPct = Math.min(midOff + 4, 32);
                        const textPadding = `${paddingPct}%`;

                        return (
                            <motion.div
                                key={item.stage}
                                whileHover={{ scale: 1.01, zIndex: 20 }}
                                onClick={() => handleStageClick(item.stage)}
                                className="relative cursor-pointer w-full flex-1 transition-all min-h-[48px] max-h-[80px]"
                            >
                                {/* Clipped background shape */}
                                <div
                                    className="absolute inset-0"
                                    style={{ clipPath, backgroundColor: item.color }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                                </div>

                                {/* Text — padded to stay inside the trapezoid */}
                                <div
                                    className="absolute inset-0 flex items-center justify-between text-white z-10 overflow-hidden"
                                    style={{ paddingLeft: textPadding, paddingRight: textPadding }}
                                >
                                    <div className="flex flex-col min-w-0 overflow-hidden">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest opacity-90 truncate">{item.stage}</span>
                                        <span className="text-[9px] opacity-60">{t('opportunities.probabilityShort')}: {item.probability}%</span>
                                    </div>
                                    <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                        <span className="text-sm font-bold opacity-90 whitespace-nowrap">{formatCurrency(item.totalValue)}</span>
                                        <span className="text-[10px] uppercase opacity-70 whitespace-nowrap">{item.count} {t('opportunities.opportunityCount', { defaultValue: 'Fırsat' })}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                <div className="mt-6 flex items-center gap-2 text-slate-400">
                    <Info size={14} />
                    <span className="text-[10px] uppercase tracking-wider">{t('funnel.totalVisibility')}: {formatCurrency(deals.reduce((s, d) => s + d.value, 0))}</span>
                </div>
            </CardContent>

            {/* Portal to document.body for true full screen overlay */}
            {createPortal(
                <AnimatePresence>
                    {selectedStage && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => { setSelectedStage(null); setIsFullScreen(false); }}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                            />

                            {/* Modal Container */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: 0,
                                    // Full viewport transition
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
                                        : "w-[95%] max-w-7xl max-h-[90vh] rounded-3xl m-4"
                                )}
                            >
                                {/* Header - Fixed at top of flex container */}
                                <div className="flex-shrink-0 p-4 md:p-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-700 z-20 shadow-sm relative">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: STAGE_CONFIG.find(s => s.stage === selectedStage)?.color }} />
                                                <h2 className="text-lg md:text-2xl font-light text-slate-900 dark:text-white">{t('opportunities.stage')}: {selectedStage}</h2>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('common.total')} {displayedDeals.length} {t('opportunities.opportunityCount', { defaultValue: 'fırsat' })}</p>
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
                                                onClick={(e) => { e.stopPropagation(); setSelectedStage(null); setIsFullScreen(false); }}
                                                className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/10"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Body - Scrollable Area */}
                                <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-black/20 p-4 md:p-6 w-full">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700 z-10">
                                            <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                                                <th className="px-4 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('topic')}>
                                                    <div className="flex items-center gap-1">
                                                        {t('opportunities.opportunityName')} {sortConfig?.key === 'topic' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('customerName')}>
                                                    <div className="flex items-center gap-1">
                                                        {t('opportunities.customer')} {sortConfig?.key === 'customerName' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('ownerName')}>
                                                    <div className="flex items-center gap-1">
                                                        {t('opportunities.owner')} {sortConfig?.key === 'ownerName' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('expectedCloseDate')}>
                                                    <div className="flex items-center gap-1">
                                                        {t('opportunities.closeDate')} {sortConfig?.key === 'expectedCloseDate' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('value')}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {t('opportunities.value')} {sortConfig?.key === 'value' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                                                    </div>
                                                </th>
                                                <th className="px-4 py-4 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('aging')}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {t('opportunities.daysOpen')} {sortConfig?.key === 'aging' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                                                    </div>
                                                </th>
                                            </tr>
                                            <tr className="bg-white dark:bg-slate-700/80 border-b border-slate-100 dark:border-white/5">
                                                <th className="px-2 py-2">
                                                    <div className="relative">
                                                        <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            placeholder={t('common.search')}
                                                            className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg pl-6 pr-2 py-1 text-[9px] outline-none"
                                                            value={columnFilters.topic}
                                                            onChange={e => setColumnFilters(prev => ({ ...prev, topic: e.target.value }))}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t('common.search')}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[9px] outline-none"
                                                        value={columnFilters.customer}
                                                        onChange={e => setColumnFilters(prev => ({ ...prev, customer: e.target.value }))}
                                                    />
                                                </th>
                                                <th className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder={t('common.search')}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[9px] outline-none"
                                                        value={columnFilters.owner}
                                                        onChange={e => setColumnFilters(prev => ({ ...prev, owner: e.target.value }))}
                                                    />
                                                </th>
                                                <th className="px-2 py-2"></th>
                                                <th className="px-2 py-2"></th>
                                                <th className="px-2 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayedDeals.map((deal) => {
                                                const owner = users.find(u => u.id === deal.ownerId);
                                                return (
                                                    <tr key={deal.id} className="group transition-all hover:translate-x-1">
                                                        <td className="bg-white dark:bg-white/5 p-4 first:rounded-l-2xl border-y border-l border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white leading-tight block">{deal.topic}</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs md:text-sm text-slate-600 dark:text-slate-300">{deal.customerName}</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                                                                    {(deal.ownerName || owner?.name || '?').charAt(0)}
                                                                </div>
                                                                <span className="text-xs md:text-sm text-slate-600 dark:text-slate-300">{deal.ownerName || owner?.name || deal.ownerId}</span>
                                                            </div>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                                {new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}
                                                            </span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 text-right shadow-sm">
                                                            <span className="text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(deal.value)}</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 last:rounded-r-2xl border-y border-r border-slate-200 dark:border-white/10 text-right shadow-sm">
                                                            <span className={cn(
                                                                "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                                                                deal.aging > 30 ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
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

                                {/* Footer - Fixed at bottom of flex container */}
                                <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-700 text-center border-t border-slate-200 dark:border-white/5 z-20 relative">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{t('funnel.closeHint')}</span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </Card>
    );
}
