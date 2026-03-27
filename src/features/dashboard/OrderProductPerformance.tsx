import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { Package, X, Minimize2, Maximize2, FileSpreadsheet, FileText, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Treemap } from 'recharts';
import { cn } from '../../lib/utils';
import type { ProductGroup, Order } from '../../types/crm';
import { PRODUCT_COLORS } from '../../data/mockData';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface OrderProductPerformanceProps {
    orders?: Order[];
}

export function OrderProductPerformance({ orders: propOrders }: OrderProductPerformanceProps) {
    const { t, i18n } = useTranslation();
    const { orders: contextOrders, users } = useData();
    const orders = propOrders || contextOrders;
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
        obs.observe(document.documentElement, { attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    // ESC Key Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedProduct(null);
                setIsFullScreen(false);
                setSelectedStatus(null);
            }
        };

        if (selectedProduct) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedProduct]);

    const productStats = useMemo(() => {
        const stats: Record<string, {
            revenue: number,
            count: number,
            growth: number,
            parentName: string,
            productName: string
        }> = {};

        orders.forEach(order => {
            // Group by Parent Category name if available, otherwise fallback to product name
            const groupName = order.parentGroupName || order.product || 'Diğer';

            if (!stats[groupName]) {
                const growth = Math.floor(Math.random() * 40) - 10;
                stats[groupName] = {
                    revenue: 0,
                    count: 0,
                    growth,
                    parentName: order.parentGroupName || '',
                    productName: order.product || groupName
                };
            }
            stats[groupName].revenue += order.amount || 0;
            stats[groupName].count += 1;
        });

        return Object.entries(stats)
            .filter(([_, stat]) => stat.revenue > 0) // Hide groups with 0 revenue
            .sort((a, b) => b[1].revenue - a[1].revenue);
    }, [orders]);

    // All orders for the selected product (used for charts)
    const selectedOrders = useMemo(() => {
        if (!selectedProduct) return [];
        return orders.filter(o => o.product === selectedProduct || o.parentGroupName === selectedProduct);
    }, [orders, selectedProduct]);

    // Orders filtered by status (used for table view)
    const filteredOrders = useMemo(() => {
        if (!selectedStatus) return selectedOrders;
        return selectedOrders.filter(o => o.status === selectedStatus);
    }, [selectedOrders, selectedStatus]);

    // Analytics Data
    const analyticsData = useMemo(() => {
        if (!selectedOrders.length) return { statusData: [], trendData: [] };

        // Status Distribution (Revenue Based)
        const byStatus = selectedOrders.reduce((acc, order) => {
            if (!acc[order.status]) {
                acc[order.status] = { value: 0, count: 0 };
            }
            acc[order.status].value += order.amount;
            acc[order.status].count += 1;
            return acc;
        }, {} as Record<string, { value: number, count: number }>);

        const statusData = Object.entries(byStatus)
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

        selectedOrders.forEach(order => {
            const d = new Date(order.createdAt);
            const monthLabel = d.toLocaleDateString(i18n.language, { month: 'short' });
            const monthEntry = last6Months.find(m => m.label === monthLabel);
            if (monthEntry) {
                monthEntry.value += order.amount;
            }
        });

        return { statusData, trendData: last6Months };
    }, [selectedOrders, i18n.language]);

    const COLORS = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b'];

    const TREEMAP_COLORS: Record<string, string> = {
        'ENROUTE':              '#e03e3e',
        'STOKBAR':              '#4c8ef7',
        'QUEST':                '#2da868',
        'CallDesk':             '#8b5cf6',
        'HOSTING':              '#6b7280',
        'E-Dönüşüm':           '#f0a732',
        'Varuna':               '#22d3ee',
        'Donanım-Endüstriyel': '#f97316',
        'Outsource - Hizmet':  '#e879f9',
        'Diğer':                '#94a3b8',
    };

    const TREEMAP_COLORS_DARK: Record<string, string> = {
        'ENROUTE':              '#f87171',
        'STOKBAR':              '#60a5fa',
        'QUEST':                '#34d399',
        'CallDesk':             '#a78bfa',
        'HOSTING':              '#9ca3af',
        'E-Dönüşüm':           '#fbbf24',
        'Varuna':               '#67e8f9',
        'Donanım-Endüstriyel': '#fb923c',
        'Outsource - Hizmet':  '#f0abfc',
        'Diğer':                '#cbd5e1',
    };

    const treemapData = useMemo(() => {
        const total = productStats.reduce((s, [, st]) => s + st.revenue, 0);
        return productStats.map(([name, stat]) => ({
            name,
            size: stat.revenue,
            sharePct: total > 0 ? (stat.revenue / total) * 100 : 0,
            count: stat.count,
        }));
    }, [productStats]);

    const TreemapCell = (props: any) => {
        const { x, y, width, height, name, size, sharePct, count } = props;
        const palette = isDark ? TREEMAP_COLORS_DARK : TREEMAP_COLORS;
        const color = palette[name] || PRODUCT_COLORS[name as ProductGroup] || '#64748b';
        if (!width || !height || width < 2 || height < 2) return null;
        return (
            <g style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(name)}>
                <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.88} rx={6} stroke="white" strokeWidth={2} />
                {width > 55 && height > 32 && (
                    <text x={x + 10} y={y + 20} fill="white" fontSize={Math.min(13, width / 8)} fontWeight="700" style={{ pointerEvents: 'none' }}>
                        {name}
                    </text>
                )}
                {width > 55 && height > 50 && (
                    <text x={x + 10} y={y + 36} fill="rgba(255,255,255,0.9)" fontSize={11} fontWeight="600" style={{ pointerEvents: 'none' }}>
                        ₺{(size / 1000000).toFixed(1)}M
                    </text>
                )}
                {width > 55 && height > 66 && (
                    <text x={x + 10} y={y + 50} fill="rgba(255,255,255,0.65)" fontSize={9} style={{ pointerEvents: 'none' }}>
                        %{sharePct?.toFixed(1)} · {count} Sipariş
                    </text>
                )}
            </g>
        );
    };

    const exportToExcel = () => {
        try {
            const data = filteredOrders.map(o => ({
                [t('opportunities.customer')]: o.customerName,
                [t('productPerformance.seller')]: users.find(u => u.id === o.salesRepId)?.name || o.salesRepId,
                [t('orders.list.orderName')]: o.title,
                [t('productPerformance.createdAt')]: new Date(o.createdAt).toLocaleDateString(i18n.language),
                [t('orders.list.amount')]: o.amount,
                [t('orders.list.status')]: t(`status.${o.status}`)
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, selectedProduct || 'Orders');
            XLSX.writeFile(wb, `${selectedProduct}_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Excel export error:', error);
            alert(t('common.error', { defaultValue: 'Bir hata oluştu.' }));
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const tableData = filteredOrders.map(o => [
                o.customerName,
                users.find(u => u.id === o.salesRepId)?.name || o.salesRepId,
                o.title,
                new Date(o.createdAt).toLocaleDateString('tr-TR'),
                `$${o.amount.toLocaleString()}`,
                t(`status.${o.status}`)
            ]);

            // @ts-ignore
            doc.autoTable({
                head: [[
                    t('opportunities.customer'),
                    t('productPerformance.seller'),
                    t('orders.list.orderName'),
                    t('productPerformance.createdAt'),
                    t('orders.list.amount'),
                    t('orders.list.status')
                ]],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] } // Emerald color for Orders
            });

            doc.save(`${selectedProduct}_Orders_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
            alert(t('common.error', { defaultValue: 'Bir hata oluştu.' }));
        }
    };

    return (
        <>
            <div className="h-full relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        key={treemapData.length}
                        data={treemapData}
                        dataKey="size"
                        isAnimationActive={false}
                        content={<TreemapCell />}
                    />
                </ResponsiveContainer>
                <motion.div
                    key={treemapData.length + '-overlay'}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                />
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
                                onClick={() => { setSelectedProduct(null); setIsFullScreen(false); setSelectedStatus(null); }}
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
                                                {t('performance.listingDetails', { count: filteredOrders.length })}
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
                                                title={isFullScreen ? t('common.minimize') : t('common.fullscreen')}
                                            >
                                                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); setIsFullScreen(false); setSelectedStatus(null); }}
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
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(value: any) => [`$${value?.toLocaleString() ?? 0}`, t('orders.list.amount')]}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
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
                                            {selectedStatus && (
                                                <span className="text-[10px] text-slate-400 ml-auto">
                                                    {t('common.filter')}: <span className="font-bold text-indigo-500">{selectedStatus}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-48 w-full flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={analyticsData.statusData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={60}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {analyticsData.statusData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                                stroke={selectedStatus === entry.name ? "#000" : "none"}
                                                                strokeWidth={2}
                                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                                onClick={() => setSelectedStatus(selectedStatus === entry.name ? null : entry.name)}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(value: any, name: any, props: any) => [
                                                            `$${value?.toLocaleString() ?? 0} (${props.payload.count} ${t('common.unit')})`,
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
                                                <th className="px-4 pb-4">{t('orders.list.orderName')}</th>
                                                <th className="px-4 pb-4 text-center">{t('orders.list.status')}</th>
                                                <th className="px-4 pb-4 text-right">{t('orders.list.amount')}</th>
                                                <th className="px-4 pb-4 text-center">{t('orders.list.createdAt', { defaultValue: 'Sipariş Tarihi' })}</th>
                                                <th className="px-4 pb-4 text-center">{t('orders.list.invoiceDate', { defaultValue: 'Fatura Tarihi' })}</th>
                                                <th className="px-4 pb-4 text-right">{t('performance.deliveryDate', { defaultValue: 'Teslim Tarihi' })}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.map((order) => {
                                                const rep = users.find(u => u.id === order.salesRepId);
                                                return (
                                                    <tr key={order.id} className="group transition-all hover:translate-x-1">
                                                        <td className="bg-white dark:bg-white/5 p-4 first:rounded-l-2xl border-y border-l border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white leading-tight block">{order.customerName}</span>
                                                            <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString(i18n.language)}</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                                                    {rep?.name.charAt(0)}
                                                                </div>
                                                                <span className="text-xs md:text-sm text-slate-600 dark:text-slate-300">{rep?.name || order.salesRepId}</span>
                                                            </div>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm">
                                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{order.title}</span>
                                                        </td>

                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 shadow-sm text-center">
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider",
                                                                order.status === 'Closed' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                                                                    order.status === 'Canceled' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" :
                                                                        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                            )}>
                                                                {t(`status.${order.status}`)}
                                                            </span>
                                                        </td>

                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 text-right shadow-sm">
                                                            <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400">${(order.amount / 1000).toFixed(0)}k</span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 text-center shadow-sm">
                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString(i18n.language) : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 border-y border-slate-200 dark:border-white/10 text-center shadow-sm">
                                                            {order.invoiceDate ? (
                                                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                    {new Date(order.invoiceDate).toLocaleDateString(i18n.language)}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                                                            )}
                                                        </td>
                                                        <td className="bg-white dark:bg-white/5 p-4 last:rounded-r-2xl border-y border-r border-slate-200 dark:border-white/10 text-right shadow-sm">
                                                            <span className="text-xs text-slate-500 font-mono">
                                                                {new Date(order.deliveryDate).toLocaleDateString(i18n.language)}
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
