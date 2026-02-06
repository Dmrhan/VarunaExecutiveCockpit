import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { Sparkles, Users, Info, Search, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon, MoreHorizontal, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { QuotePoolAnalysis } from './QuotePoolAnalysis';
import { SalesRepPerformance } from './SalesRepPerformance';
import { QuoteProductPerformance } from './QuoteProductPerformance';
import type { Quote, QuoteStatus, ProductGroup } from '../../types/crm';
import { PRODUCT_COLORS } from '../../data/mockData';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
    return value.toString();
};

const calculateQuoteRisk = (quote: Quote) => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Long Open Duration (> 30 Days)
    const created = new Date(quote.createdAt);
    const now = new Date();
    const daysOpen = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
    if (daysOpen > 30 && ['Draft', 'Review', 'Sent'].includes(quote.status)) {
        score += 30;
        reasons.push(`Open for ${daysOpen} days`);
    }

    // 2. Inactivity (> 14 Days)
    if (quote.lastActivityDate) {
        const lastActivity = new Date(quote.lastActivityDate);
        const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24));
        if (daysInactive > 14) {
            score += 20;
            reasons.push(`Inactive for ${daysInactive} days`);
        }
    } else {
        // No activity recorded
        score += 10;
    }

    // 3. High Discount (> 20%)
    if (quote.discount && quote.discount > 20) {
        score += 25;
        reasons.push(`High Discount (${quote.discount}%)`);
    }

    // 4. Competitor Presence
    if (quote.hasCompetitor) {
        score += 25;
        reasons.push('Competitor Presence');
    }

    let level: 'Low' | 'Medium' | 'High' = 'Low';
    if (score >= 60) level = 'High';
    else if (score >= 30) level = 'Medium';

    return { score, level, reasons };
};

const statusColors = {
    'Draft': "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
    'Review': "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    'Sent': "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    'Accepted': "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    'Approved': "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    'Rejected': "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    'Denied': "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

const statusSolidColors = {
    'Draft': "bg-slate-400",
    'Review': "bg-indigo-400",
    'Sent': "bg-blue-500",
    'Accepted': "bg-emerald-500",
    'Approved': "bg-emerald-600",
    'Rejected': "bg-rose-500",
    'Denied': "bg-rose-600",
};

const DashboardGridCard = ({ title, data, dataKey, color, icon: Icon, insight, className = "" }: any) => {
    const maxValue = Math.max(...data.map((item: any) => item[dataKey]), 1);

    return (
        <Card className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col h-full ${className}`}>
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3">
                {Icon && (
                    <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                        <Icon size={18} />
                    </div>
                )}
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {title}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                    {data.map((item: any, idx: number) => {
                        const percentage = (item[dataKey] / maxValue) * 100;
                        return (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-tight truncate max-w-[70%]">
                                        {item.name}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(item[dataKey])}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}% ` }}
                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                        className="h-full rounded-full transition-all group-hover:brightness-110 shadow-[0_0_8px_rgba(0,0,0,0.05)]"
                                        style={{ backgroundColor: color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {insight && (
                    <div className="mt-6 p-3 rounded-xl bg-gradient-to-tr from-indigo-500/5 to-white/5 dark:from-indigo-500/10 dark:to-transparent border border-indigo-500/10 flex gap-2.5 items-start">
                        <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                            {insight}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const StatCard = ({ label, value, colorClass }: { label: string; value: string; colorClass: string }) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-bold mb-2">
            {label}
        </span>
        <span className={`text - xl lg: text - 2xl font - light tracking - tight ${colorClass} `}>
            {value}
        </span>
    </div>
);

export function QuotesDashboard() {
    const { t } = useTranslation();
    const { quotes } = useData();

    // Filter State
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Advanced Filtering & Sorting State
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Quote | 'customerName'; direction: 'asc' | 'desc' } | null>(null);

    const [columnFilters, setColumnFilters] = useState({
        title: '',
        customer: '',
        product: '',
        status: 'all',
        minValue: '',
        maxValue: '',
        risk: 'all',
    });

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [columnFilters, viewMode]); // Added viewMode to dependencies to reset page when switching views

    const handleSort = (key: keyof Quote | 'customerName') => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // --- Data processing ---

    // 1. Base Filter (Date, Customer, Value) - Used for Pool Analysis to keep all columns visible
    const baseQuotes = useMemo(() => {
        let result = quotes;

        // Date Filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            result = result.filter(quote => {
                const quoteDate = new Date(quote.createdAt).getTime();
                switch (dateFilter) {
                    case 'today': return quoteDate >= todayAtMidnight;
                    case 'week': {
                        const day = now.getDay() || 7;
                        const monday = new Date(now);
                        monday.setHours(-24 * (day - 1), 0, 0, 0);
                        return quoteDate >= monday.getTime();
                    }
                    case 'month':
                    case 'mtd':
                        return new Date(quote.createdAt).getMonth() === new Date().getMonth() && new Date(quote.createdAt).getFullYear() === new Date().getFullYear();
                    case 'quarter': {
                        const currentMonth = now.getMonth();
                        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
                        const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
                        return quoteDate >= quarterStart.getTime();
                    }
                    case 'ytd':
                        return new Date(quote.createdAt).getFullYear() === new Date().getFullYear();
                    case 'custom': {
                        if (!customRange.start || !customRange.end) return true;
                        const start = new Date(customRange.start);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(customRange.end);
                        end.setHours(23, 59, 59, 999);
                        return quoteDate >= start.getTime() && quoteDate <= end.getTime();
                    }
                    default: return true;
                }
            });
        }

        // Column Filters (Detailed)
        if (columnFilters.title) {
            result = result.filter(q => q.title.toLowerCase().includes(columnFilters.title.toLowerCase()));
        }

        if (columnFilters.customer) {
            result = result.filter(q => q.customerName.toLowerCase().includes(columnFilters.customer.toLowerCase()));
        }

        if (columnFilters.product) {
            result = result.filter(q =>
                q.product.toLowerCase().includes(columnFilters.product.toLowerCase())
            );
        }



        if (columnFilters.minValue) {
            result = result.filter(q => q.amount >= Number(columnFilters.minValue));
        }
        if (columnFilters.maxValue) {
            result = result.filter(q => q.amount <= Number(columnFilters.maxValue));
        }

        if (columnFilters.risk !== 'all') {
            result = result.filter(q => calculateQuoteRisk(q).level === columnFilters.risk);
        }

        return result;
    }, [dateFilter, customRange, quotes, columnFilters]);

    // 2. Final Filter (Base + Status) - Used for Lists and Metrics
    const filteredQuotes = useMemo(() => {
        if (columnFilters.status === 'all') return baseQuotes;
        return baseQuotes.filter(q => q.status === columnFilters.status);
    }, [baseQuotes, columnFilters.status]);

    // Metrics Calculation
    const metrics = useMemo(() => {
        const totalCount = filteredQuotes.length;
        const totalValue = filteredQuotes.reduce((s, q) => s + q.amount, 0);
        const wonValue = filteredQuotes.filter(q => ['Accepted', 'Approved'].includes(q.status)).reduce((s, q) => s + q.amount, 0);
        const lostValue = filteredQuotes.filter(q => ['Rejected', 'Denied'].includes(q.status)).reduce((s, q) => s + q.amount, 0);
        const openValue = totalValue - wonValue - lostValue;

        return { totalCount, totalValue, wonValue, lostValue, openValue };
    }, [filteredQuotes]);

    // Chart Data
    const charts = useMemo(() => {
        const statusRev: Record<string, number> = {};
        const customerRev: Record<string, number> = {};
        const statusCount: Record<string, number> = {};

        // Calculate Status Charts using BASE quotes (unfiltered by status)
        baseQuotes.forEach(q => {
            statusRev[q.status] = (statusRev[q.status] || 0) + q.amount;
            statusCount[q.status] = (statusCount[q.status] || 0) + 1;
        });

        // Calculate Customer/Other Charts using FILTERED quotes (filtered by status)
        filteredQuotes.forEach(q => {
            customerRev[q.customerName] = (customerRev[q.customerName] || 0) + q.amount;
        });

        const toChart = (rec: Record<string, number>, key: 'revenue' | 'count') =>
            Object.entries(rec).map(([name, value]) => ({ name, [key]: value })).sort((a, b) => (b[key] as number) - (a[key] as number));

        return {
            statusRev: toChart(statusRev, 'revenue'),
            statusCount: toChart(statusCount, 'count'),
            customer: toChart(customerRev, 'revenue').slice(0, 8),
        };
    }, [baseQuotes, filteredQuotes]);

    const uniqueStatuses = useMemo(() => {
        // Ensure a consistent order for kanban columns
        const order: QuoteStatus[] = ['Draft', 'Review', 'Sent', 'Accepted', 'Approved', 'Rejected', 'Denied'];
        const existingStatuses = Array.from(new Set(quotes.map(q => q.status)));
        return order.filter(status => existingStatuses.includes(status)).concat(
            existingStatuses.filter(status => !order.includes(status))
        );
    }, [quotes]);

    const sortedQuotes = useMemo(() => {
        let result = [...filteredQuotes];

        if (sortConfig) {
            result.sort((a, b) => {
                let aVal: any;
                let bVal: any;

                if (sortConfig.key === 'customerName') {
                    aVal = a.customerName.toLowerCase();
                    bVal = b.customerName.toLowerCase();
                } else {
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [filteredQuotes, sortConfig]);

    const paginatedQuotes = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedQuotes.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedQuotes, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(sortedQuotes.length / itemsPerPage);




    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header / Global Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">
                        {t('quotes.title', { defaultValue: 'Teklifler' })}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                        {t('quotes.subtitle', { defaultValue: 'Teklif süreçlerini ve satış performansını analiz edin' })}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5">
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
            </div>

            {/* Custom Date Picker Modal */}
            {showDatePicker && dateFilter === 'custom' && (
                <DateRangePicker
                    startDate={customRange.start}
                    endDate={customRange.end}
                    onChange={(start, end) => setCustomRange({ start, end })}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label={t('quotes.kpis.totalCount')} value={metrics.totalCount.toString()} colorClass="text-slate-600 dark:text-white" />
                <StatCard label={t('quotes.kpis.lost')} value={formatCurrency(metrics.lostValue)} colorClass="text-rose-500" />
                <StatCard label={t('quotes.kpis.won')} value={formatCurrency(metrics.wonValue)} colorClass="text-emerald-500" />
                <StatCard label={t('quotes.kpis.open')} value={formatCurrency(metrics.openValue)} colorClass="text-indigo-500" />
                <StatCard label={t('quotes.kpis.totalPotential')} value={formatCurrency(metrics.totalValue)} colorClass="text-indigo-500" />
            </div>



            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 h-[400px]">
                    <QuotePoolAnalysis
                        data={charts.statusRev as { name: string; revenue: number }[]}
                        countData={charts.statusCount as { name: string; count: number }[]}
                        selectedStatus={columnFilters.status}
                        onStatusSelect={(status) => setColumnFilters(prev => ({ ...prev, status: status || 'all' }))}
                    />
                </div>
                <div className="xl:col-span-1 h-[400px]">
                    <SalesRepPerformance quotes={filteredQuotes} />
                </div>
                <div className="xl:col-span-1 lg:col-span-2 xl:col-span-1 h-[400px]">
                    <DashboardGridCard
                        title={t('quotes.charts.customerRevenue')}
                        data={charts.customer}
                        dataKey="revenue"
                        color="#0ea5e9"
                        icon={Users}
                        insight={t('quotes.charts.insights.customer')}
                        className="h-full"
                    />
                </div>
            </div>

            {/* Product Group Performance */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">{t('orders.productPerformance', { defaultValue: 'Ürün Grubu Performansı' })}</h3>
                <QuoteProductPerformance quotes={filteredQuotes} />
            </div>

            {/* Bottom Row - List & Recommendations */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Quote List/Board */}
                <Card className="xl:col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold flex items-center gap-2">
                                {t('quotes.list.title')}
                            </h3>
                            <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        viewMode === 'list'
                                            ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                    title={t('quotes.list.listView')}
                                >
                                    <ListIcon size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        viewMode === 'kanban'
                                            ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                    title={t('quotes.list.boardView')}
                                >
                                    <LayoutGrid size={14} />
                                </button>
                            </div>
                        </div>

                    </div>

                    <CardContent className="p-0">
                        {viewMode === 'list' ? (
                            <>
                                <div className="overflow-x-auto min-h-[400px]">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
                                                <th
                                                    className="text-left py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleSort('title')}
                                                >
                                                    {t('quotes.table.name')}
                                                </th>
                                                <th
                                                    className="text-left py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleSort('customerName')}
                                                >
                                                    {t('quotes.table.customer')}
                                                </th>
                                                <th
                                                    className="text-left py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleSort('product')}
                                                >
                                                    {t('quotes.table.product', { defaultValue: 'Product' })}
                                                </th>
                                                <th
                                                    className="text-center py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleSort('status')}
                                                >
                                                    {t('quotes.table.status')}
                                                </th>
                                                <th
                                                    className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                                                    onClick={() => handleSort('amount')}
                                                >
                                                    {t('quotes.table.amount')}
                                                </th>
                                                <th
                                                    className="text-center py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500"
                                                >
                                                    RISK
                                                </th>
                                                <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                                    {t('quotes.table.actions')}
                                                </th>
                                            </tr>
                                            {/* Column Filters Row */}
                                            <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/30">
                                                <th className="px-6 py-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                                        <input
                                                            type="text"
                                                            placeholder="Filter name..."
                                                            value={columnFilters.title}
                                                            onChange={(e) => setColumnFilters(prev => ({ ...prev, title: e.target.value }))}
                                                            className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                                        <input
                                                            type="text"
                                                            placeholder="Filter customer..."
                                                            value={columnFilters.customer}
                                                            onChange={(e) => setColumnFilters(prev => ({ ...prev, customer: e.target.value }))}
                                                            className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-2">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                                        <input
                                                            type="text"
                                                            placeholder="Filter product..."
                                                            value={columnFilters.product}
                                                            onChange={(e) => setColumnFilters(prev => ({ ...prev, product: e.target.value }))}
                                                            className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-2">
                                                    <select
                                                        value={columnFilters.status}
                                                        onChange={(e) => setColumnFilters(prev => ({ ...prev, status: e.target.value }))}
                                                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                    >
                                                        <option value="all">All</option>
                                                        {uniqueStatuses.map(status => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                </th>
                                                <th className="px-6 py-2">
                                                    <div className="flex gap-1 items-center justify-end">
                                                        <input
                                                            type="number"
                                                            placeholder="Min"
                                                            value={columnFilters.minValue}
                                                            onChange={(e) => setColumnFilters(prev => ({ ...prev, minValue: e.target.value }))}
                                                            className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500 text-right"
                                                        />
                                                        <span className="text-slate-400">-</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Max"
                                                            value={columnFilters.maxValue}
                                                            onChange={(e) => setColumnFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                                                            className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500 text-right"
                                                        />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-2">
                                                    <select
                                                        value={columnFilters.risk}
                                                        onChange={(e) => setColumnFilters(prev => ({ ...prev, risk: e.target.value }))}
                                                        className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                    >
                                                        <option value="all">All</option>
                                                        <option value="High">High</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="Low">Low</option>
                                                    </select>
                                                </th>
                                                <th className="px-6 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                            {paginatedQuotes.map((quote) => (
                                                <motion.tr
                                                    key={quote.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{quote.title}</span>
                                                            <span className="text-[10px] text-slate-500">ID: {quote.id.split('-')[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                {quote.customerName[0]}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{quote.customerName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span
                                                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                                                            style={{ backgroundColor: PRODUCT_COLORS[quote.product as ProductGroup] || '#64748b' }}
                                                        >
                                                            {quote.product}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex justify-center">
                                                            <span className={cn(
                                                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                                statusColors[quote.status as keyof typeof statusColors] || "bg-slate-100 text-slate-500 border-slate-200"
                                                            )}>
                                                                {t(`quotes.status.${quote.status} `, { defaultValue: quote.status })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                                                            {formatCurrency(quote.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {(() => {
                                                            const { level, reasons } = calculateQuoteRisk(quote);
                                                            return (
                                                                <div className="flex items-center gap-2 group/risk relative">
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border",
                                                                        level === 'High' && "bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
                                                                        level === 'Medium' && "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
                                                                        level === 'Low' && "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                                                                    )}>
                                                                        {level === 'High' && <AlertTriangle size={12} />}
                                                                        {level === 'Medium' && <AlertTriangle size={12} />}
                                                                        {level === 'Low' && <CheckCircle size={12} />}
                                                                    </div>

                                                                    <div className="flex flex-col">
                                                                        <span className={cn(
                                                                            "text-[10px] font-bold uppercase tracking-wider",
                                                                            level === 'High' && "text-rose-600 dark:text-rose-400",
                                                                            level === 'Medium' && "text-amber-600 dark:text-amber-400",
                                                                            level === 'Low' && "text-emerald-600 dark:text-emerald-400"
                                                                        )}>
                                                                            {level} Risk
                                                                        </span>
                                                                        {reasons.length > 0 && (
                                                                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={reasons.join(', ')}>
                                                                                {reasons[0]}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Tooltip for details */}
                                                                    {reasons.length > 0 && (
                                                                        <div className="absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl opacity-0 invisible group-hover/risk:opacity-100 group-hover/risk:visible transition-all z-50 border border-slate-700">
                                                                            <div className="font-bold mb-1.5 pb-1.5 border-b border-white/10 flex justify-between items-center">
                                                                                <span>Risk Factors</span>
                                                                                <span className={cn(
                                                                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                                                                    level === 'High' && "bg-rose-500 text-white",
                                                                                    level === 'Medium' && "bg-amber-500 text-black",
                                                                                    level === 'Low' && "bg-emerald-500 text-white"
                                                                                )}>{level}</span>
                                                                            </div>
                                                                            <ul className="space-y-1">
                                                                                {reasons.map((r, i) => (
                                                                                    <li key={i} className="flex items-start gap-1.5">
                                                                                        <span className="mt-0.5 text-slate-400">•</span>
                                                                                        <span className="text-slate-200">{r}</span>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all">
                                                            <Sparkles size={14} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        {t('quotes.list.showing')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedQuotes.length)} / {sortedQuotes.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-4 overflow-x-auto">
                                <div className="flex gap-4 min-w-max pb-4">
                                    {uniqueStatuses.map(status => {
                                        const statusQuotes = sortedQuotes.filter(q => q.status === status);
                                        return (
                                            <div key={status} className="w-[280px] flex flex-col gap-3">
                                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", statusSolidColors[status as keyof typeof statusSolidColors] || 'bg-slate-400')} />
                                                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                                                            {t(`quotes.status.${status} `, { defaultValue: status })}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-400">{statusQuotes.length}</span>
                                                </div>
                                                <div className="flex flex-col gap-3">
                                                    {statusQuotes.map(quote => (
                                                        <div key={quote.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2">{quote.title}</h4>
                                                                <button className="text-slate-300 hover:text-indigo-500 transition-colors">
                                                                    <MoreHorizontal size={14} />
                                                                </button>
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 mb-3">{quote.customerName}</div>
                                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                                                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                    {formatCurrency(quote.amount)}
                                                                </span>
                                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                    {new Date(quote.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {statusQuotes.length === 0 && (
                                                        <div className="h-24 rounded-xl border-2 border-dashed border-slate-100 dark:border-white/5 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                                                            No quotes
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
