import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard, FileText, ShoppingCart,
    CreditCard, Clock, Activity, AlertCircle,
    ChevronRight, TrendingUp, X, Search, ArrowRight,
    Building2, Calendar
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

// --- Types & Mock Data Generators ---

interface DashboardMetric {
    id: string;
    title: string;
    value: string | number;
    subValue: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon: any;
    color: string; // Tailwind class for text/bg base
    gradient: string; // CSS gradient class
    dataKey: string; // Key to identify what data to show in drilldown
}

interface DrillDownRow {
    id: string;
    title: string;
    subtitle: string;
    value: string;
    status: string;
    statusColor: string;
    date: string;
    owner: string;
}

// Enhanced Mock Generator


// --- Components ---

const DrillDownModal = ({ isOpen, onClose, title, data }: { isOpen: boolean, onClose: () => void, title: string, data: DrillDownRow[] }) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity size={20} className="text-indigo-500" />
                                {title} {t('dashboardV2.drilldown.details')}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">{t('dashboardV2.drilldown.showingRecords', { count: data.length })}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('dashboardV2.drilldown.searchPlaceholder')}
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/30 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.drilldown.columns.record')}</th>
                                    <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.drilldown.columns.owner')}</th>
                                    <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.drilldown.columns.dateStatus')}</th>
                                    <th className="p-4 font-semibold text-slate-500 text-right">{t('dashboardV2.drilldown.columns.value')}</th>
                                    <th className="p-4 font-semibold text-slate-500"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {data.map((row) => (
                                    <tr key={row.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer group transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{row.title}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Building2 size={10} />
                                                {row.subtitle}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                    {row.owner.charAt(0)}
                                                </div>
                                                <span className="text-slate-600 dark:text-slate-300">{row.owner}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", row.statusColor)}>
                                                {row.status}
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                <Calendar size={10} /> {row.date}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {row.value}
                                        </td>
                                        <td className="p-4 text-right">
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const InteractiveKPICard = ({ metric, onClick }: { metric: DashboardMetric, onClick: () => void }) => (
    <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
            "relative overflow-hidden rounded-2xl p-6 cursor-pointer border border-white/20 shadow-lg group",
            "bg-white dark:bg-slate-800", // Fallback
            metric.gradient // Specific premium gradient
        )}
    >
        {/* Glow Effect */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/10 shadow-inner")}>
                    <metric.icon size={22} className="text-white" />
                </div>
                {metric.trend && (
                    <div className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border border-white/10 flex items-center gap-1",
                        metric.trend === 'up' ? "bg-emerald-500/20 text-emerald-100" : "bg-white/10 text-white"
                    )}>
                        <TrendingUp size={12} /> {metric.trendValue}
                    </div>
                )}
            </div>

            <div>
                <p className="text-sm font-medium text-white/70 uppercase tracking-widest mb-1">{metric.title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{metric.value}</h3>
                <p className="text-xs text-white/50 font-medium">{metric.subValue}</p>
            </div>
        </div>
    </motion.div>
);

const PipelineStep = ({ title, count, value, index, total }: any) => {
    const { t } = useTranslation();
    const isLast = index === total - 1;
    const isFirst = index === 0;

    // Progress bar colors (getting darker/richer as we move right to imply concentration or simply flow)
    const activeColor = "bg-indigo-50/40 dark:bg-slate-800/60";

    return (
        <div className={cn(
            "relative flex-1 group min-w-[150px] flex flex-col justify-between p-4",
            "border-y border-slate-200 dark:border-slate-700",
            isFirst ? "rounded-l-2xl border-l pl-6" : "pl-8",
            isLast ? "rounded-r-2xl border-r pr-6" : "pr-4",
            "hover:bg-indigo-50/80 dark:hover:bg-slate-700 transition-colors duration-300",
            activeColor
        )}>
            {/* Content */}
            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider group-hover:text-indigo-600 transition-colors">
                        {title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t('dashboardV2.pipeline.step')} {index + 1}
                    </span>
                </div>

                <div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{count}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{t('dashboardV2.pipeline.records')}</span>
                    </div>
                    <div className="h-1 w-12 bg-indigo-500/20 rounded-full my-2 group-hover:w-full group-hover:bg-indigo-500 transition-all duration-500" />
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                        {value}
                    </div>
                </div>
            </div>

            {/* Chevron Separator (SVG) */}
            {!isLast && (
                <div className="absolute top-0 bottom-0 -right-3 w-6 z-20 pointer-events-none hidden md:block" style={{ right: '-12px' }}>
                    <svg className="h-full w-full" viewBox="0 0 24 100" preserveAspectRatio="none">
                        {/* Background match to hide content behind */}
                        <path d="M0,0 L24,50 L0,100" className="fill-slate-50/50 dark:fill-slate-900/50 stroke-none" />
                        {/* Border line */}
                        <path d="M0,0 L24,50 L0,100" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export function ExecutiveDashboardPageV2() {
    const { t } = useTranslation();
    const { deals, quotes, orders, users } = useData();

    // Filters
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedRole, setSelectedRole] = useState<'gm' | 'sales_manager'>('gm');

    // New Advanced Filters
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [selectedOwner, setSelectedOwner] = useState<string>('all');

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });

    // Drilldown State
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    // Derived Lists for Filters
    const sources = useMemo(() => Array.from(new Set(deals.map(d => d.source))), [deals]);
    const owners = useMemo(() => users.filter(u => u.role === 'sales_rep' || u.role === 'manager'), [users]);

    // --- Rich Mock Data (Independent of filters for now, or could filter if dates present) ---
    const { delayedOrders, collections } = useMemo(() => {
        // Enhanced Mock Generator inside component for specific dashboard needs
        const delayReasons = ['Software Waiting', 'UAT Phase', 'Customer Testing', 'P/O Pending', 'SAP Transfer', 'Budget Approval', 'Legal Review'];

        // Generate MORE delayed orders for richness
        const dOrders = Array.from({ length: 45 }).map((_, i) => ({
            id: `ORD-DELAY-${2024000 + i}`,
            customer: ['Mavi Giyim', 'LC Waikiki', 'Defacto', 'Migros', 'CarrefourSA', 'BİM', 'A101', 'Şok'][Math.floor(Math.random() * 8)],
            amount: Math.floor(Math.random() * 500000) + 50000,
            reason: delayReasons[Math.floor(Math.random() * delayReasons.length)],
            daysOpen: Math.floor(Math.random() * 60) + 15,
            owner: ['Ali Yılmaz', 'Ayşe Demir', 'Mehmet Kaya', 'Zeynep Çelik', 'Begüm Hayta'][Math.floor(Math.random() * 5)]
        }));

        // Generate MORE Collection items
        const dCollections = Array.from({ length: 60 }).map((_, i) => {
            const isOverdue = Math.random() > 0.4; // 60% overdue for dramatic effect
            const days = isOverdue ? Math.floor(Math.random() * 45) + 1 : Math.floor(Math.random() * 15);
            return {
                id: `INV-${2024900 + i}`,
                customer: ['Koç Holding', 'Sabancı', 'Eczacıbaşı', 'Doğuş Grubu', 'Yıldız Holding', 'Anadolu Grubu'][Math.floor(Math.random() * 6)],
                amount: Math.floor(Math.random() * 1000000) + 100000,
                dueDate: new Date(Date.now() + (isOverdue ? -1 : 1) * days * 86400000).toISOString(),
                status: isOverdue ? 'Overdue' : 'Pending',
                daysDiff: days
            };
        });

        return { delayedOrders: dOrders, collections: dCollections };
    }, []);

    // --- Data Processing with Filters ---
    const filteredData = useMemo(() => {
        let filteredDeals = [...deals];
        let filteredQuotes = [...quotes];
        let filteredOrders = [...orders];

        // 1. Filter by Date
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (dateFilter === 'this_week') {
            const day = now.getDay() || 7;
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            startDate.setDate(now.getDate() - day + 1);
        } else if (dateFilter === 'this_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (dateFilter === 'ytd') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
            startDate = customRange.start;
            endDate = customRange.end;
        }

        if (startDate) {
            const filterByDate = (dateStr: string) => {
                const d = new Date(dateStr);
                return d >= startDate! && (!endDate || d <= endDate);
            };
            filteredDeals = filteredDeals.filter(d => filterByDate(d.createdAt));
            filteredQuotes = filteredQuotes.filter(q => filterByDate(q.createdAt));
            filteredOrders = filteredOrders.filter(o => filterByDate(o.createdAt));
        }

        // 2. Filter by Source (Team)
        if (selectedSource !== 'all') {
            filteredDeals = filteredDeals.filter(d => d.source === selectedSource);
        }

        // 3. Filter by Owner (Person)
        if (selectedOwner !== 'all') {
            filteredDeals = filteredDeals.filter(d => d.ownerId === selectedOwner);
            filteredQuotes = filteredQuotes.filter(q => q.salesRepId === selectedOwner);
            filteredOrders = filteredOrders.filter(o => o.salesRepId === selectedOwner);
        }

        return { deals: filteredDeals, quotes: filteredQuotes, orders: filteredOrders };
    }, [deals, quotes, orders, dateFilter, customRange, selectedSource, selectedOwner]);

    // Derived Metrics
    const metrics: DashboardMetric[] = useMemo(() => [
        {
            id: 'active_opps',
            title: t('dashboardV2.metrics.activeOpps'),
            value: filteredData.deals.filter(d => !['Won', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage)).length,
            subValue: `+12% ${t('dashboardV2.metrics.vsLastMonth')}`,
            trend: 'up',
            trendValue: '+12%',
            icon: LayoutDashboard,
            color: 'text-indigo-500',
            gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
            dataKey: 'deals'
        },
        {
            id: 'pending_quotes',
            title: t('dashboardV2.metrics.pendingQuotes'),
            value: filteredData.quotes.filter(q => ['Draft', 'Sent'].includes(q.status)).length,
            subValue: `${(filteredData.quotes.reduce((s, q) => s + q.amount, 0) / 1000000).toFixed(1)}M ₺ ${t('dashboardV2.metrics.volume')}`,
            icon: FileText,
            color: 'text-blue-500',
            gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            dataKey: 'quotes'
        },
        {
            id: 'open_orders',
            title: t('dashboardV2.metrics.openOrders'),
            value: filteredData.orders.filter(o => o.status === 'Open').length,
            subValue: `5 ${t('dashboardV2.metrics.criticalActions')}`,
            trend: 'neutral',
            trendValue: 'stable',
            icon: ShoppingCart,
            color: 'text-amber-500',
            gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
            dataKey: 'orders'
        },
        {
            id: 'collection_risk',
            title: t('dashboardV2.metrics.collectionRisk'),
            value: `${(collections.filter(c => c.status === 'Overdue').reduce((s, c) => s + c.amount, 0) / 1000000).toFixed(1)}M ₺`,
            subValue: `${collections.filter(c => c.status === 'Overdue').length} ${t('dashboardV2.metrics.overdueInvoices')}`,
            trend: 'down',
            trendValue: '-5%',
            icon: AlertCircle,
            color: 'text-rose-500',
            gradient: 'bg-gradient-to-br from-rose-500 to-pink-600',
            dataKey: 'collections'
        },
        {
            id: 'avg_collection',
            title: t('dashboardV2.metrics.avgCollectionTime'),
            value: `42 ${t('common.days')}`,
            subValue: `${t('dashboardV2.metrics.target')}: 45 ${t('common.days')} (Good)`,
            trend: 'up',
            trendValue: `3 ${t('common.days')} ${t('dashboardV2.metrics.fast')}`,
            icon: Clock,
            color: 'text-emerald-500',
            gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            dataKey: 'collections_time'
        }
    ], [deals, quotes, orders, collections]);

    // Drilldown Data Preparation
    const getDrillDownData = (metricKey: string | null): DrillDownRow[] => {
        if (!metricKey) return [];

        switch (metricKey) {
            case 'active_opps':
                return deals.filter(d => !['Won', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage)).map(d => ({
                    id: d.id,
                    title: d.title,
                    subtitle: d.customerName,
                    value: `${(d.value / 1000).toFixed(0)}k ₺`,
                    status: d.stage,
                    statusColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                    date: new Date(d.createdAt).toLocaleDateString(),
                    owner: t('opportunities.owner') // Mock
                }));
            case 'collection_risk':
                return collections.filter(c => c.status === 'Overdue').map(c => ({
                    id: c.id,
                    title: c.id,
                    subtitle: c.customer,
                    value: `${(c.amount / 1000).toFixed(0)}k ₺`,
                    status: `Overdue +${c.daysDiff}d`,
                    statusColor: 'bg-rose-100 text-rose-700 border-rose-200',
                    date: new Date(c.dueDate).toLocaleDateString(),
                    owner: 'Finance'
                }));
            case 'open_orders':
                return delayedOrders.map(o => ({
                    id: o.id,
                    title: o.id,
                    subtitle: o.customer,
                    value: `${(o.amount / 1000).toFixed(0)}k ₺`,
                    status: o.reason,
                    statusColor: 'bg-amber-100 text-amber-700 border-amber-200',
                    date: `${o.daysOpen} days open`,
                    owner: o.owner
                }));
            default: return [];
        }
    };

    // Chart Data
    const orderBreakdownData = [
        { name: 'Software Waiting', value: 12, color: '#6366f1' },
        { name: 'UAT Phase', value: 8, color: '#8b5cf6' },
        { name: 'Customer Testing', value: 5, color: '#ec4899' },
        { name: 'P/O Pending', value: 3, color: '#f59e0b' },
        { name: 'SAP Transfer', value: 7, color: '#10b981' },
    ];

    const formatCurr = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M ₺`;
        return `${(val / 1000).toFixed(0)}k ₺`;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 pb-20">
            <div className="max-w-[1600px] mx-auto space-y-8 p-8">

                {/* Header & Filters */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-4xl font-light tracking-tight text-slate-900 dark:text-white mb-2">
                            {t('dashboardV2.title')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg flex items-center gap-2">
                            <Activity size={18} className="text-indigo-500" />
                            {t('dashboardV2.subtitle')}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
                        {/* Role Selector */}
                        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setSelectedRole('gm')}
                                className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", selectedRole === 'gm' ? "bg-indigo-500 text-white shadow" : "text-slate-500 hover:text-slate-700")}
                            >
                                {t('dashboardV2.role.gm')}
                            </button>
                            <button
                                onClick={() => setSelectedRole('sales_manager')}
                                className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-all", selectedRole === 'sales_manager' ? "bg-indigo-500 text-white shadow" : "text-slate-500 hover:text-slate-700")}
                            >
                                {t('dashboardV2.role.salesManager')}
                            </button>
                        </div>

                        {/* Source / Team Filter */}
                        <div className="relative">
                            <select
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl px-4 py-3 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                            >
                                <option value="all">{t('dashboardV2.filters.allTeams')}</option>
                                {sources.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
                        </div>

                        {/* Owner / Person Filter */}
                        <div className="relative">
                            <select
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl px-4 py-3 pr-10 pl-10 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                value={selectedOwner}
                                onChange={(e) => setSelectedOwner(e.target.value)}
                            >
                                <option value="all">{t('dashboardV2.filters.allPersons')}</option>
                                {owners.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={16} />
                        </div>

                        {/* Date Filters */}
                        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 items-center gap-1">
                            {['this_week', 'this_month', 'ytd', 'all'].map(key => (
                                <button
                                    key={key}
                                    onClick={() => setDateFilter(key)}
                                    className={cn(
                                        "px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                                        dateFilter === key
                                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {t(`dateFilters.${key === 'this_week' ? 'thisWeek' : key === 'this_month' ? 'thisMonth' : key === 'ytd' ? 'ytd' : 'all'}`, { defaultValue: key })}
                                </button>
                            ))}
                            <button
                                onClick={() => { setDateFilter('custom'); setShowDatePicker(true); }}
                                className={cn(
                                    "px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1",
                                    dateFilter === 'custom'
                                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <Calendar size={14} />
                                {t('dashboardV2.filters.custom')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Date Picker Modal */}
                {/* Date Picker Modal */}
                {showDatePicker && (
                    <DateRangePicker
                        startDate={customRange.start}
                        endDate={customRange.end}
                        onClose={() => setShowDatePicker(false)}
                        onChange={(start, end) => {
                            setCustomRange({ start, end });
                            if (start && end) {
                                setDateFilter('custom');
                                setShowDatePicker(false);
                            }
                        }}
                    />
                )}

                {/* KPI Grid - Animated & Interactive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {metrics.map((metric) => (
                        <InteractiveKPICard
                            key={metric.id}
                            metric={metric}
                            onClick={() => setSelectedMetric(metric.id)}
                        />
                    ))}
                </div>

                {/* Pipeline Flow - Filtered Data */}
                {/* Pipeline Flow - Filtered Data */}
                <div className="w-full overflow-x-auto pb-4 pt-2 px-2">
                    <div className="flex flex-row w-full min-w-[1000px]">
                        <PipelineStep
                            title={`1. ${t('dashboardV2.pipeline.step1')}`}
                            count={filteredData.deals.filter(d => !['Lost', 'Kaybedildi'].includes(d.stage)).length}
                            value={`${(filteredData.deals.filter(d => !['Lost', 'Kaybedildi'].includes(d.stage)).reduce((s, d) => s + d.value, 0) / 1000000).toFixed(1)}M ₺`}
                            index={0} total={5}
                        />
                        <PipelineStep
                            title={`2. ${t('dashboardV2.pipeline.step2')}`}
                            count={filteredData.quotes.length}
                            value={`${(filteredData.quotes.reduce((s, q) => s + q.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={1} total={5}
                        />
                        <PipelineStep
                            title={`3. ${t('dashboardV2.pipeline.step3')}`}
                            count={filteredData.quotes.filter(q => ['Accepted', 'Approved'].includes(q.status)).length}
                            value={`${(filteredData.quotes.filter(q => ['Accepted', 'Approved'].includes(q.status)).reduce((s, q) => s + q.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={2} total={5}
                        />
                        <PipelineStep
                            title={`4. ${t('dashboardV2.pipeline.step4')}`}
                            count={filteredData.orders.filter(o => o.status === 'Open').length}
                            value={`${(filteredData.orders.filter(o => o.status === 'Open').reduce((s, o) => s + o.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={3} total={5}
                        />
                        <PipelineStep
                            title={`5. ${t('dashboardV2.pipeline.step5')}`}
                            count={filteredData.orders.filter(o => o.status === 'Closed').length}
                            value={`${(filteredData.orders.filter(o => o.status === 'Closed').reduce((s, o) => s + o.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={4} total={5}
                        />
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">

                    {/* Open Order Breakdown */}
                    <Card className="lg:col-span-1 border-none shadow-sm bg-white dark:bg-slate-800 h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                                <ShoppingCart size={20} className="text-amber-500" />
                                {t('dashboardV2.blockers.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-4 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {orderBreakdownData.sort((a, b) => b.value - a.value).map((item, idx) => (
                                    <div key={item.name} className="group relative">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                {item.name}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white block">{item.value} {t('dashboardV2.blockers.orders')}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{(item.value * 1.2).toFixed(1)}M ₺ {t('dashboardV2.blockers.impact')}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar Background */}
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 group-hover:opacity-80"
                                                style={{
                                                    width: `${(item.value / 12) * 100}%`, // 12 is max value in mock data
                                                    backgroundColor: item.color
                                                }}
                                            />
                                        </div>

                                        {idx === 0 && (
                                            <span className="absolute -right-2 -top-2 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                <button className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                                    {t('dashboardV2.blockers.viewDetailed')}
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Collection Intelligence */}
                    <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-800 h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-white">
                                <CreditCard size={20} className="text-rose-500" />
                                {t('dashboardV2.collections.title')}
                            </CardTitle>
                            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                {t('dashboardV2.collections.viewReport')} <ArrowRight size={14} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/80 dark:bg-slate-700/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.collections.table.entity')}</th>
                                        <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.collections.table.invoiceRef')}</th>
                                        <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.collections.table.aging')}</th>
                                        <th className="p-4 font-semibold text-slate-500 text-right">{t('dashboardV2.collections.table.amount')}</th>
                                        <th className="p-4 font-semibold text-slate-500">{t('dashboardV2.collections.table.riskLevel')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {collections.slice(0, 7).map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-white">{item.customer}</div>
                                                <div className="text-xs text-slate-400">{t('dashboardV2.collections.table.premiumAccount')}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{item.id}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full", item.daysDiff > 20 ? "bg-rose-500" : "bg-amber-500")}
                                                            style={{ width: `${Math.min(item.daysDiff * 3, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.daysDiff}d</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                                {formatCurr(item.amount)}
                                            </td>
                                            <td className="p-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border",
                                                    item.daysDiff > 20
                                                        ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400"
                                                        : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                                                )}>
                                                    {item.daysDiff > 20 ? t('dashboardV2.collections.risk.critical') : t('dashboardV2.collections.risk.high')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Drilldown Modal */}
            <DrillDownModal
                isOpen={!!selectedMetric}
                onClose={() => setSelectedMetric(null)}
                title={metrics.find(m => m.id === selectedMetric)?.title || 'Details'}
                data={getDrillDownData(selectedMetric)}
            />
        </div>
    );
}
