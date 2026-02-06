import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, X, Minimize2, Maximize2, FileSpreadsheet, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { cn } from '../../lib/utils';
import type { ProductGroup } from '../../types/crm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper for formatting currency in Millions
const formatCurrencyMillions = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
};

// Simulated trend data (since we don't have historical data yet)
const TRENDS: Record<string, { value: number; isUp: boolean }> = {
    'EnRoute': { value: 4, isUp: false },
    'Stokbar': { value: 1, isUp: false },
    'Unidox': { value: 18, isUp: true },
    'ServiceCore': { value: 15, isUp: true },
    'Quest': { value: 3, isUp: false },
    'Varuna': { value: 20, isUp: true },
};

export function MarketIntelligence() {
    const { deals, users } = useData();
    const [selectedProduct, setSelectedProduct] = useState<ProductGroup | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // ESC Key Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedProduct(null);
                setIsFullScreen(false);
            }
        };

        if (selectedProduct) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedProduct]);

    // Aggregate data by product
    const productStats = useMemo(() => {
        const products: ProductGroup[] = ['EnRoute', 'Stokbar', 'Unidox', 'ServiceCore', 'Quest', 'Varuna'];

        return products.map(product => {
            const productDeals = deals.filter(d => d.product === product);
            const totalValue = productDeals.reduce((sum, d) => sum + d.value, 0);

            return {
                name: product,
                value: totalValue,
                count: productDeals.length,
                trend: TRENDS[product] || { value: 0, isUp: true }
            };
        }).sort((a, b) => b.value - a.value);
    }, [deals]);

    // Filter deals for selected product
    const selectedDeals = useMemo(() => {
        if (!selectedProduct) return [];
        return deals.filter(d => d.product === selectedProduct);
    }, [deals, selectedProduct]);

    const exportToExcel = () => {
        try {
            const data = selectedDeals.map(d => ({
                'Müşteri': d.customerName,
                'Satıcı': users.find(u => u.id === d.ownerId)?.name || d.ownerId,
                'Fırsat Adı': d.topic,
                'Oluşturma Tarihi': new Date(d.createdAt).toLocaleDateString('tr-TR'),
                'Beklenen Gelir': d.value,
                'Açık Gün': d.aging
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, selectedProduct || 'Deals');
            XLSX.writeFile(wb, `${selectedProduct}_Deals_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Excel export error:', error);
            alert('Excel dosyası oluşturulurken bir hata oluştu.');
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const tableData = selectedDeals.map(d => [
                d.customerName,
                users.find(u => u.id === d.ownerId)?.name || d.ownerId,
                d.topic,
                new Date(d.createdAt).toLocaleDateString('tr-TR'),
                `$${d.value.toLocaleString()}`,
                `${d.aging}`
            ]);

            // @ts-ignore
            doc.autoTable({
                head: [['Müşteri', 'Satıcı', 'Fırsat Adı', 'Oluşturma', 'Gelir', 'Açık Gün']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] }
            });

            doc.save(`${selectedProduct}_Deals_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
            alert('PDF oluşturulurken bir hata oluştu.');
        }
    };

    return (
        <Card className="col-span-1 lg:col-span-3 bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 overflow-hidden h-full flex flex-col">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package size={18} className="text-indigo-500" />
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        Sectoral Insight
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {productStats.map((item) => (
                        <div
                            key={item.name}
                            onClick={() => setSelectedProduct(item.name)}
                            className="bg-white dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-md relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300">
                                    <Package size={16} />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                    item.trend.isUp
                                        ? "text-emerald-600 bg-emerald-500/10"
                                        : "text-rose-600 bg-rose-500/10"
                                )}>
                                    {item.trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    %{item.trend.value}
                                </div>
                            </div>

                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{item.name}</h3>
                            <div className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {formatCurrencyMillions(item.value)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                                {item.count} aktif fırsat
                            </div>

                            {/* Hover Effect Background */}
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    ))}
                </div>
            </CardContent>

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
                                onClick={() => { setSelectedProduct(null); setIsFullScreen(false); }}
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
                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 flex-shrink-0">
                                                    <Package size={20} />
                                                </div>
                                                <h2 className="text-lg md:text-2xl font-light text-slate-900 dark:text-white">
                                                    Ürün Detayları: <span className="font-bold">{selectedProduct}</span>
                                                </h2>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs pl-12">
                                                Toplam {selectedDeals.length} fırsat listeleniyor
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
                                                onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); setIsFullScreen(false); }}
                                                className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/10"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-black/20 p-4 md:p-6 w-full">
                                    <table className="w-full text-left border-separate border-spacing-y-2">
                                        <thead className="sticky top-0 bg-transparent z-10">
                                            <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                                                <th className="px-4 pb-4">Müşteri</th>
                                                <th className="px-4 pb-4">Satıcı</th>
                                                <th className="px-4 pb-4">Fırsat Adı</th>
                                                <th className="px-4 pb-4">Oluşturma</th>
                                                <th className="px-4 pb-4 text-right">Beklenen Gelir</th>
                                                <th className="px-4 pb-4 text-right">Açık Gün</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedDeals.map((deal) => {
                                                const owner = users.find(u => u.id === deal.ownerId);
                                                return (
                                                    <tr key={deal.id} className="group transition-all hover:translate-x-1">
                                                        <td className="bg-white dark:bg-white/5 p-4 first:rounded-l-2xl border-y border-l border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white leading-tight block">{deal.customerName}</span>
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
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                                {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
                                                            </span>
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

                                {/* Footer */}
                                <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-700 text-center border-t border-slate-200 dark:border-white/5 z-20 relative">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">ESC veya dışarı tıklayarak kapatabilirsiniz</span>
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
