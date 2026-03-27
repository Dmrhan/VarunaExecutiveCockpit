import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { Sparkles, Users, Search, Calendar, ArrowUpRight, ArrowDownRight, LayoutGrid, List as ListIcon, X } from 'lucide-react';
import { OrdersAIInsightPanel } from './OrdersAIInsightPanel';
import { OrderPoolAnalysis } from './OrderPoolAnalysis';
import { OrderProductPerformance } from './OrderProductPerformance';
import { GamifiedLeaderboard } from './GamifiedLeaderboard';
import { HorizontalBarChart } from '../../components/ui/HorizontalBarChart';
import type { Order } from '../../types/crm';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M ₺`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k ₺`;
    return `${value} ₺`;
};

const StatCard = ({ label, value, colorClass }: any) => (
    <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-600 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-bold mb-2">
            {label}
        </span>
        <span className={`text-xl lg:text-2xl font-light tracking-tight ${colorClass}`}>
            {value}
        </span>
    </Card>
);

// Removed DashboardGridCard


export function OrdersDashboard() {
    const { t } = useTranslation();
    const { orders } = useData();

    // Filter State
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

    // Chart Drilldown State
    const [selectedTopCustomer, setSelectedTopCustomer] = useState<string | null>(null);

    // Advanced Filtering & Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState({
        title: '',
        customer: '',
        status: 'all',
        minValue: '',
        maxValue: '',
    });
    const hasActiveFilters = columnFilters.title || columnFilters.customer || columnFilters.status !== 'all' || columnFilters.minValue || columnFilters.maxValue;
    const clearAllFilters = () => setColumnFilters({ title: '', customer: '', status: 'all', minValue: '', maxValue: '' });

    const handleSort = (key: keyof Order) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // --- Data processing ---

    const currentDateRangeStr = useMemo(() => {
        const formatLocalDate = (d: Date) => {
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
        };
        const now = new Date();
        const todayStr = formatLocalDate(now);

        let startStr = '';
        let endStr = todayStr;

        if (dateFilter !== 'all') {
            switch (dateFilter) {
                case 'today':
                    startStr = todayStr;
                    break;
                case 'week': {
                    const day = now.getDay() || 7;
                    const monday = new Date(now);
                    monday.setDate(monday.getDate() - (day - 1));
                    startStr = formatLocalDate(monday);
                    break;
                }
                case 'month':
                case 'mtd': {
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    startStr = formatLocalDate(firstDayOfMonth);
                    break;
                }
                case 'quarter': {
                    const quarter = Math.floor(now.getMonth() / 3);
                    const firstDayOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                    startStr = formatLocalDate(firstDayOfQuarter);
                    break;
                }
                case 'ytd': {
                    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
                    startStr = formatLocalDate(firstDayOfYear);
                    break;
                }
                case 'custom':
                    if (customRange.start) startStr = formatLocalDate(customRange.start);
                    if (customRange.end) endStr = formatLocalDate(customRange.end);
                    break;
            }
        }

        return { start: startStr || null, end: endStr || null };
    }, [dateFilter, customRange.start, customRange.end]);

    const baseOrders = useMemo(() => {
        let result = orders;

        // 1. Date Filter
        if (dateFilter !== 'all') {
            const { start: startStr, end: endStr } = currentDateRangeStr;

            if (startStr) {
                result = result.filter(order => {
                    // Kapalı siparişlerde fatura tarihi, açık/iptal olanlarda oluşturma tarihi
                    const refDate = (order.status === 'Closed' && order.invoiceDate)
                        ? order.invoiceDate
                        : order.createdAt;
                    const orderDateStr = refDate ? refDate.substring(0, 10) : '';
                    if (!orderDateStr) return false;

                    if (dateFilter === 'custom' && (!customRange.end || !endStr)) {
                        return orderDateStr >= startStr;
                    }
                    if (dateFilter === 'custom' && (!customRange.start || !startStr)) {
                        return endStr ? orderDateStr <= endStr : false;
                    }
                    return endStr ? (orderDateStr >= startStr && orderDateStr <= endStr) : orderDateStr >= startStr;
                });
            }
        }

        // 2. Column Filters (Except Status)
        if (columnFilters.title) {
            const search = columnFilters.title.toLowerCase();
            result = result.filter(o => o.title.toLowerCase().includes(search));
        }
        if (columnFilters.customer) {
            const search = columnFilters.customer.toLowerCase();
            result = result.filter(o => o.customerName.toLowerCase().includes(search));
        }

        if (columnFilters.minValue) {
            result = result.filter(o => o.amount >= Number(columnFilters.minValue));
        }
        if (columnFilters.maxValue) {
            result = result.filter(o => o.amount <= Number(columnFilters.maxValue));
        }

        return result;
    }, [dateFilter, customRange, orders, columnFilters.title, columnFilters.customer, columnFilters.minValue, columnFilters.maxValue]);

    const filteredOrders = useMemo(() => {
        if (columnFilters.status === 'all') return baseOrders;
        return baseOrders.filter(o => o.status === columnFilters.status);
    }, [baseOrders, columnFilters.status]);

    const finalOrders = useMemo(() => {
        if (!selectedTopCustomer) return filteredOrders;
        return filteredOrders.filter(o => o.customerName === selectedTopCustomer);
    }, [filteredOrders, selectedTopCustomer]);

    // Metrics Calculation
    const metrics = useMemo(() => {
        const totalCount = finalOrders.length;
        const totalValue = finalOrders.reduce((s, o) => s + o.amount, 0);
        const closedValue = finalOrders.filter(o => o.status === 'Closed').reduce((s, o) => s + o.amount, 0);
        const canceledValue = finalOrders.filter(o => o.status === 'Canceled').reduce((s, o) => s + o.amount, 0);
        const openValue = totalValue - closedValue - canceledValue;

        return { totalCount, totalValue, closedValue, canceledValue, openValue };
    }, [finalOrders]);

    // Chart Data
    const charts = useMemo(() => {
        const statusMap: Record<string, number> = {};
        const statusCountMap: Record<string, number> = {};
        const customerMap: Record<string, number> = {};

        // Calculate Status from BASE (unfiltered by status)
        baseOrders.forEach(o => {
            statusMap[o.status] = (statusMap[o.status] || 0) + o.amount;
            statusCountMap[o.status] = (statusCountMap[o.status] || 0) + 1;
        });

        // Calculate Customer from FILTERED (filtered by status)
        filteredOrders.forEach(o => {
            customerMap[o.customerName] = (customerMap[o.customerName] || 0) + o.amount;
        });

        const toChart = (rec: Record<string, number>, key: 'amount' | 'count' | 'revenue') =>
            Object.entries(rec).map(([name, value]) => ({
                name,
                [key]: value
            })).sort((a, b) => (b[key] as number) - (a[key] as number));

        return {
            status: toChart(statusMap, 'revenue') as { name: string; revenue: number }[],
            statusCount: toChart(statusCountMap, 'count') as { name: string; count: number }[],
            customer: toChart(customerMap, 'amount'),
        };
    }, [baseOrders, filteredOrders]);

    const sortedOrders = useMemo(() => {
        let result = [...finalOrders];

        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal === undefined || bVal === undefined) return 0;

                if ((aVal as any) < (bVal as any)) return sortConfig.direction === 'asc' ? -1 : 1;
                if ((aVal as any) > (bVal as any)) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [finalOrders, sortConfig]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Custom Date Picker Modal */}
            {showDatePicker && (
                <DateRangePicker
                    startDate={customRange.start}
                    endDate={customRange.end}
                    onChange={(s, e) => {
                        setCustomRange({ start: s, end: e });
                        if (s && e) {
                            setDateFilter('custom');
                        }
                    }}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {/* Header & Date Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                        {t('orders.title', { defaultValue: 'Siparişler' })}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                        {t('orders.subtitle', { defaultValue: 'Satış operasyonlarını ve teslimat süreçlerini yönetin' })}
                    </p>
                </div>



                {/* Date Filter Buttons */}
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl items-center gap-1 overflow-x-auto scrollbar-hide">
                    {[
                        { label: t('dateFilters.today'), value: 'today' },
                        { label: t('dateFilters.thisWeek'), value: 'week' },
                        { label: t('dateFilters.thisMonth'), value: 'month' },
                        { label: t('dateFilters.thisQuarter'), value: 'quarter' },
                        { label: t('dateFilters.ytd'), value: 'ytd' },
                        { label: t('dateFilters.mtd'), value: 'mtd' },
                        { label: t('dateFilters.all'), value: 'all' }
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setDateFilter(f.value)}
                            className={cn(
                                "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                                dateFilter === f.value
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowDatePicker(true)}
                        className={cn(
                            "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap flex items-center gap-1",
                            dateFilter === 'custom'
                                ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <Calendar size={12} />
                        {t('dateFilters.custom')}
                    </button>
                </div>

            </div>


            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Toplam Sipariş Hacmi — Hero card (col-span-2) */}
                <div className="col-span-2 bg-indigo-50/80 dark:bg-indigo-900/30 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/40 shadow-md shadow-indigo-500/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center min-h-[100px]">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-indigo-500 dark:text-indigo-400 font-bold mb-2">
                        Toplam Sipariş Hacmi
                    </span>
                    <span className="text-3xl lg:text-4xl font-light tracking-tight text-indigo-600 dark:text-indigo-300">
                        {formatCurrency(metrics.totalValue)}
                    </span>
                    <span className="text-[10px] text-indigo-400 dark:text-indigo-500 mt-1.5">
                        {metrics.totalCount} Adet Sipariş
                    </span>
                </div>
                <StatCard label={t('orders.kpis.totalCount')} value={metrics.totalCount.toString()} colorClass="text-slate-900 dark:text-white font-medium" />
                <StatCard label={t('orders.kpis.pendingAmount')} value={formatCurrency(metrics.openValue)} colorClass="text-sky-600 dark:text-sky-400 font-medium" />
                <StatCard label={t('orders.kpis.completedAmount')} value={formatCurrency(metrics.closedValue)} colorClass="text-emerald-600 dark:text-emerald-400 font-medium" />
            </div>

            {/* AI Insight Strip */}
            <OrdersAIInsightPanel
                currentOrders={filteredOrders}
                allOrders={orders}
                dateFilter={dateFilter}
                customRange={customRange}
                className="w-full"
            />

            {/* Charts Row — Pool Analysis + Product Treemap */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <OrderPoolAnalysis
                    data={charts.status}
                    countData={charts.statusCount}
                    onStatusSelect={(status: string | null) => setColumnFilters(prev => ({ ...prev, status: status || 'all' }))}
                    selectedStatus={columnFilters.status === 'all' ? null : columnFilters.status}
                />
                <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl p-4 flex flex-col h-[500px]">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex-shrink-0">
                        {t('orders.productPerformance', { defaultValue: 'Ürün Performansı' })}
                    </h3>
                    <div className="flex-1 min-h-0">
                        <OrderProductPerformance orders={filteredOrders} />
                    </div>
                </div>
            </div>

            {/* Charts Row 2 — Sales Rep Performance + Customer Volume */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <GamifiedLeaderboard dateRange={currentDateRangeStr} />
                <HorizontalBarChart
                    title={t('orders.charts.customerVolume', { defaultValue: 'Müşteri Bazlı Sipariş Hacmi' })}
                    data={charts.customer.map((item: any) => ({
                        id: item.name,
                        name: item.name,
                        value: item.amount,
                        formattedValue: formatCurrency(item.amount)
                    }))}
                    color="#0ea5e9"
                    icon={Users}
                    insight={t('orders.charts.customerInsight', { defaultValue: 'En yüksek sipariş hacmine sahip müşteriler' })}
                    activeId={selectedTopCustomer}
                    onBarClick={(item) => setSelectedTopCustomer(prev => prev === item.id ? null : item.id)}
                />
            </div>

            {/* Bottom Row - List & Recommendations */}
            <div className="flex flex-col gap-6">
                {/* Order List */}
                {/* Orders List / Board View */}
                {viewMode === 'list' ? (
                    <Card className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">
                        <CardHeader className="py-2 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                    {t('orders.list.title')}
                                </CardTitle>
                                <div className="flex gap-2 items-center">
                                    {hasActiveFilters && (
                                        <button onClick={clearAllFilters} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                                            <X size={12} /> Filtreleri Temizle
                                        </button>
                                    )}
                                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg items-center gap-1">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                            )}
                                        >
                                            <ListIcon size={14} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('board')}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            )}
                                        >
                                            <LayoutGrid size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md z-10">
                                    {/* Header Row */}
                                    <tr className="border-b border-slate-200 dark:border-white/10">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('title')}>
                                            <div className="flex items-center gap-1">
                                                {t('orders.list.orderName')}
                                                {sortConfig?.key === 'title' && (
                                                    sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('customerName')}>
                                            <div className="flex items-center gap-1">
                                                {t('orders.list.customer')}
                                                {sortConfig?.key === 'customerName' && (
                                                    sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                                            {t('orders.list.status')}
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('amount')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('orders.list.amount')}
                                                {sortConfig?.key === 'amount' && (
                                                    sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('createdAt')}>
                                            <div className="flex items-center justify-center gap-1">
                                                {t('orders.list.createdAt', { defaultValue: 'Sipariş Tarihi' })}
                                                {sortConfig?.key === 'createdAt' && (
                                                    sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('invoiceDate' as keyof Order)}>
                                            <div className="flex items-center justify-center gap-1">
                                                {t('orders.list.invoiceDate', { defaultValue: 'Fatura Tarihi' })}
                                                {sortConfig?.key === ('invoiceDate' as keyof Order) && (
                                                    sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                                            {t('orders.list.actions')}
                                        </th>
                                    </tr>
                                    {/* Filter Row */}
                                    <tr className="border-b border-slate-200/60 dark:border-white/5 bg-slate-100/50 dark:bg-slate-900/30">
                                        <th className="px-4 py-2">
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Ara..."
                                                    value={columnFilters.title}
                                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full pl-7 pr-2 py-1 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 rounded text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </th>
                                        <th className="px-4 py-2">
                                            <div className="relative">
                                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Ara..."
                                                    value={columnFilters.customer}
                                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, customer: e.target.value }))}
                                                    className="w-full pl-7 pr-2 py-1 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 rounded text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </th>
                                        <th className="px-4 py-2">
                                            <select
                                                value={columnFilters.status}
                                                onChange={(e) => setColumnFilters(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-2 py-1 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 rounded text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                            >
                                                <option value="all">{t('orders.list.allStatuses', { defaultValue: 'Tümü' })}</option>
                                                <option value="Open">{t('status.Open')}</option>
                                                <option value="Closed">{t('status.Closed')}</option>
                                                <option value="Canceled">{t('status.Canceled')}</option>
                                            </select>
                                        </th>
                                        <th className="px-4 py-2">
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    value={columnFilters.minValue}
                                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, minValue: e.target.value }))}
                                                    className="w-1/2 px-2 py-1 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 rounded text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Max"
                                                    value={columnFilters.maxValue}
                                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                                                    className="w-1/2 px-2 py-1 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 rounded text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                                                />
                                            </div>
                                        </th>
                                        <th className="px-4 py-2" />
                                        <th className="px-4 py-2" />
                                        <th className="px-4 py-2 text-right">
                                            {hasActiveFilters && (
                                                <button onClick={clearAllFilters} className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 transition-all" title="Filtreleri Temizle">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {sortedOrders.map((order) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{order.title}</span>
                                                    <span className="text-[10px] text-slate-500">{t('orders.list.ref')}: {order.id.split('-')[0]}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                        {order.customerName[0]}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{order.customerName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider",
                                                        order.status === 'Closed' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                                                            order.status === 'Canceled' ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20" :
                                                                "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                    )}>
                                                        {t(`status.${order.status}`)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(order.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {order.invoiceDate ? (
                                                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        {new Date(order.invoiceDate).toLocaleDateString('tr-TR')}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                                                    <Sparkles size={14} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : (
                    /* KANBAN BOARD VIEW */
                    <div className="flex flex-col gap-4 h-full min-h-[500px]">
                        {/* Board Header */}
                        <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 p-2 rounded-2xl shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-4 px-2">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                    {t('orders.list.title')}
                                </CardTitle>
                            </div>
                            <div className="flex gap-2 items-center">
                                {/* View Toggle */}
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg items-center gap-1 mr-2">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-all",
                                            "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        <ListIcon size={14} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('board')}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-all",
                                            "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                        )}
                                    >
                                        <LayoutGrid size={14} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={t('orders.list.searchPlaceholder')}
                                        value={columnFilters.customer}
                                        onChange={(e) => setColumnFilters(prev => ({ ...prev, customer: e.target.value }))}
                                        className="pl-9 pr-3 py-1.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none w-48 transition-all"
                                    />
                                </div>
                                <select
                                    value={columnFilters.status}
                                    onChange={(e) => setColumnFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="all">{t('orders.list.allStatuses')}</option>
                                    <option value="Open">{t('status.Open')}</option>
                                    <option value="Closed">{t('status.Closed')}</option>
                                    <option value="Canceled">{t('status.Canceled')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                            {[
                                { id: 'Open', label: 'Open', color: 'sky' },
                                { id: 'Closed', label: 'Closed', color: 'emerald' },
                                { id: 'Canceled', label: 'Canceled', color: 'rose' }
                            ].map(col => {
                                const colOrders = sortedOrders.filter(o => o.status === col.id);
                                const totalAmount = colOrders.reduce((sum, o) => sum + o.amount, 0);

                                return (
                                    <div key={col.id} className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5">
                                        {/* Column Header */}
                                        <div className={cn(
                                            "flex items-center justify-between mb-4 pb-3 border-b-2",
                                            col.color === 'sky' && "border-sky-500/30",
                                            col.color === 'emerald' && "border-emerald-500/30",
                                            col.color === 'rose' && "border-rose-500/30"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    col.color === 'sky' && "bg-sky-500",
                                                    col.color === 'emerald' && "bg-emerald-500",
                                                    col.color === 'rose' && "bg-rose-500"
                                                )} />
                                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                    {t(`status.${col.label}`, { defaultValue: col.label })}
                                                </h3>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-500">
                                                    {colOrders.length}
                                                </span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                                                {formatCurrency(totalAmount)}
                                            </div>
                                        </div>

                                        {/* Cards */}
                                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-hide max-h-[600px]">
                                            {colOrders.map(order => (
                                                <div key={order.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-mono font-medium text-slate-400">
                                                            #{order.id.split('-')[0]}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="mb-2">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {order.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                                            {order.customerName}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-white/5">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded",
                                                            col.color === 'sky' && "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300",
                                                            col.color === 'emerald' && "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
                                                            col.color === 'rose' && "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300"
                                                        )}>
                                                            {t(`status.${order.status}`, { defaultValue: order.status })}
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                                                            {formatCurrency(order.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {colOrders.length === 0 && (
                                                <div className="text-center py-10 opacity-50">
                                                    <p className="text-xs text-slate-400 italic">{t('common.noData', { defaultValue: 'Veri yok' })}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
