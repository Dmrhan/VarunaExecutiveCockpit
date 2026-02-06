import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { Share2, Info, Users, Sparkles, Calendar, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const STAGE_COLORS: Record<string, string> = {
    'Lead': '#6366f1',
    'Qualified': '#8b5cf6',
    'Proposal': '#d946ef',
    'Negotiation': '#f43f5e',
    'Order': '#10b981',
    'Lost': '#64748b'
};

import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { PipelineAIInsightPanel } from './PipelineAIInsightPanel';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { FunnelChart } from './FunnelChart';
import { GamifiedLeaderboard } from './GamifiedLeaderboard';
import { ProductPerformance } from './ProductPerformance';

import type { Deal } from '../../types/crm';

// --- Sub-components & Helpers from OpportunityDashboard ---

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};



const DashboardGridCard = ({ title, data, dataKey, color, icon: Icon, insight, className = "" }: any) => {
    const maxValue = Math.max(...data.map((item: any) => item[dataKey]), 1);

    return (
        <Card className={`bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col h-full ${className}`}>
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
                                        {dataKey === 'revenue' ? formatCurrency(item[dataKey]) : item[dataKey]}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
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
    <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-600 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-bold mb-2">
            {label}
        </span>
        <span className={`text-xl lg:text-2xl font-light tracking-tight ${colorClass}`}>
            {value}
        </span>
    </div>
);


export function OpportunitiesDashboard() {
    const { t } = useTranslation();
    const { deals, users } = useData();
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    // Filter State
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // AI Response Modal State
    const [selectedDealForResponse, setSelectedDealForResponse] = useState<Deal | null>(null);
    const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

    // Advanced Filtering & Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Deal | 'ownerName'; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState({
        customer: '',
        stage: 'all',
        owner: '',
        minValue: '',
        maxValue: '',
        minProb: '',
        maxProb: '',
    });

    const handleSort = (key: keyof Deal | 'ownerName') => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleOpenResponseModal = (deal: Deal) => {
        setSelectedDealForResponse(deal);
        setIsResponseModalOpen(true);
    };


    // --- Data processing ---

    const filteredDeals = useMemo(() => {
        let result = deals;

        // 1. Date Filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            result = result.filter(deal => {
                const dealDate = new Date(deal.createdAt).getTime();
                switch (dateFilter) {
                    case 'today': return dealDate >= todayAtMidnight;
                    case 'yesterday': return dealDate >= (todayAtMidnight - 86400000) && dealDate < todayAtMidnight;
                    case 'this_week': {
                        const day = now.getDay() || 7;
                        const monday = new Date(now);
                        monday.setHours(-24 * (day - 1), 0, 0, 0);
                        return dealDate >= monday.getTime();
                    }
                    case 'last_week': {
                        const day = now.getDay() || 7;
                        const lastMonday = new Date(now);
                        lastMonday.setDate(now.getDate() - day - 6);
                        lastMonday.setHours(0, 0, 0, 0);
                        const lastSunday = new Date(now);
                        lastSunday.setDate(now.getDate() - day);
                        lastSunday.setHours(23, 59, 59, 999);
                        return dealDate >= lastMonday.getTime() && dealDate <= lastSunday.getTime();
                    }
                    case 'this_month':
                        return new Date(deal.createdAt).getMonth() === new Date().getMonth() && new Date(deal.createdAt).getFullYear() === new Date().getFullYear();
                    case 'this_year':
                        return new Date(deal.createdAt).getFullYear() === new Date().getFullYear();
                    case 'custom':
                        if (!customRange.start || !customRange.end) return true;
                        const start = new Date(customRange.start);
                        start.setHours(0, 0, 0, 0);
                        const end = new Date(customRange.end);
                        end.setHours(23, 59, 59, 999);
                        return dealDate >= start.getTime() && dealDate <= end.getTime();
                    default: return true;
                }
            });
        }

        // 2. Column Filters
        if (columnFilters.customer) {
            const search = columnFilters.customer.toLowerCase();
            result = result.filter(d =>
                d.customerName.toLowerCase().includes(search) ||
                d.title.toLowerCase().includes(search)
            );
        }

        if (columnFilters.stage !== 'all') {
            result = result.filter(d => d.stage === columnFilters.stage);
        }

        if (columnFilters.owner) {
            const search = columnFilters.owner.toLowerCase();
            result = result.filter(d => {
                const ownerName = users.find(u => u.id === d.ownerId)?.name.toLowerCase() || '';
                return ownerName.includes(search);
            });
        }

        if (columnFilters.minValue) {
            result = result.filter(d => d.value >= Number(columnFilters.minValue));
        }
        if (columnFilters.maxValue) {
            result = result.filter(d => d.value <= Number(columnFilters.maxValue));
        }

        if (columnFilters.minProb) {
            result = result.filter(d => d.probability >= Number(columnFilters.minProb));
        }
        if (columnFilters.maxProb) {
            result = result.filter(d => d.probability <= Number(columnFilters.maxProb));
        }

        return result;
    }, [dateFilter, customRange, deals, columnFilters, users]);

    const metrics = useMemo(() => {
        const count = filteredDeals.length;
        const lost = filteredDeals.filter(d => ['Kaybedildi', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        const won = filteredDeals.filter(d => ['Kazanıldı', 'Order'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        const open = filteredDeals.filter(d => !['Kazanıldı', 'Kaybedildi', 'Order', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        const total = won + open + lost;

        return { count, lost, won, open, total };
    }, [filteredDeals]);

    const chartData = useMemo(() => {
        const dataMaps: Record<string, Record<string, number>> = {
            sourceCount: {}, sourceRev: {}, customerRev: {}, ownerRev: {}, topicRev: {}, statusRev: {}
        };

        filteredDeals.forEach(d => {
            dataMaps.sourceCount[d.source] = (dataMaps.sourceCount[d.source] || 0) + 1;
            dataMaps.sourceRev[d.source] = (dataMaps.sourceRev[d.source] || 0) + d.value;
            dataMaps.customerRev[d.customerName] = (dataMaps.customerRev[d.customerName] || 0) + d.value;
            const ownerName = users.find(u => u.id === d.ownerId)?.name || 'Unknown';
            dataMaps.ownerRev[ownerName] = (dataMaps.ownerRev[ownerName] || 0) + d.value;
            dataMaps.topicRev[d.topic] = (dataMaps.topicRev[d.topic] || 0) + d.value;
            dataMaps.statusRev[d.stage] = (dataMaps.statusRev[d.stage] || 0) + d.value;
        });

        const sortAndLimit = (map: Record<string, number>, key: string) =>
            Object.entries(map)
                .map(([name, val]) => ({ name, [key]: val }))
                .sort((a, b) => (b[key] as number) - (a[key] as number))
                .slice(0, 8);

        return {
            sourceCount: sortAndLimit(dataMaps.sourceCount, 'count'),
            sourceRev: sortAndLimit(dataMaps.sourceRev, 'revenue'),
            customerRev: sortAndLimit(dataMaps.customerRev, 'revenue'),
            ownerRev: sortAndLimit(dataMaps.ownerRev, 'revenue'),
            topicRev: sortAndLimit(dataMaps.topicRev, 'revenue'),
            statusRev: sortAndLimit(dataMaps.statusRev, 'revenue'),
        };
    }, [filteredDeals, users]);

    // Use filteredDeals for List/Kanban
    const sortedDeals = useMemo(() => {
        let result = [...filteredDeals];

        if (sortConfig) {
            result.sort((a, b) => {
                let aVal: any;
                let bVal: any;

                if (sortConfig.key === 'ownerName') {
                    aVal = users.find(u => u.id === a.ownerId)?.name || '';
                    bVal = users.find(u => u.id === b.ownerId)?.name || '';
                } else {
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort by date desc
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [filteredDeals, sortConfig, users]);


    const statusColors: Record<string, string> = {
        'Onaylandı': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Lead': 'bg-blue-50 text-blue-700 border-blue-200',
        'Qualified': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Proposal': 'bg-purple-50 text-purple-700 border-purple-200',
        'Negotiation': 'bg-amber-50 text-amber-700 border-amber-200',
        'Order': 'bg-emerald-500 text-white border-emerald-600',
        'Lost': 'bg-slate-100 text-slate-500 border-slate-200',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">{t('opportunities.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('opportunities.subtitle')}</p>
                </div>

                <div className="flex flex-col md:flex-row gap-2">
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
            </div>

            {/* AI Insight & KPIs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <PipelineAIInsightPanel
                    currentDeals={filteredDeals}
                    allDeals={deals}
                    dateFilter={dateFilter}
                    customRange={customRange}
                    className="lg:col-span-1 min-h-[300px]"
                />
                <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-2 gap-4">
                    <StatCard label={t('opportunities.count')} value={metrics.count.toString()} colorClass="text-slate-900 dark:text-white font-medium" />
                    <StatCard label={t('opportunities.lostDeals')} value={formatCurrency(metrics.lost)} colorClass="text-rose-600 dark:text-rose-400 font-medium" />
                    <StatCard label={t('opportunities.wonDeals')} value={formatCurrency(metrics.won)} colorClass="text-emerald-600 dark:text-emerald-400 font-medium" />
                    <StatCard label={t('opportunities.pipelineRevenue')} value={formatCurrency(metrics.open)} colorClass="text-sky-600 dark:text-sky-400 font-medium" />
                </div>
            </div>

            {/* Charts & Pipeline */}
            <div className="space-y-6">
                {/* Pipeline & Leaderboard Row */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="xl:col-span-1 h-[600px]">
                        <FunnelChart deals={filteredDeals} />
                    </div>
                    <div className="xl:col-span-1 h-[600px]">
                        <GamifiedLeaderboard deals={filteredDeals} />
                    </div>
                </div>

                {/* Product Performance Section */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">{t('opportunities.productPerformance')}</h3>
                    <ProductPerformance deals={filteredDeals} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardGridCard
                        title={t('opportunities.charts.sourceTitle')}
                        data={chartData.sourceCount}
                        dataKey="count"
                        color="#818cf8"
                        icon={Share2}
                        insight={t('opportunities.charts.sourceInsight')}
                    />
                    <DashboardGridCard
                        title={t('opportunities.charts.customerPotentialTitle')}
                        data={chartData.customerRev}
                        dataKey="revenue"
                        color="#0ea5e9"
                        icon={Users}
                        insight={t('opportunities.charts.customerPotentialInsight')}
                    />
                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-600 my-8"></div>

            {/* Content Area (List/Kanban) */}
            {
                viewMode === 'list' ? (
                    <Card className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                        <CardHeader className="py-2 border-b border-slate-100 dark:border-white/5">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('opportunities.opportunityList')}</CardTitle>
                                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl items-center">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                        >{t('opportunities.listView')}</button>
                                        <button
                                            onClick={() => setViewMode('kanban')}
                                            className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        >{t('opportunities.kanbanView')}</button>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-mono font-bold uppercase">{filteredDeals.length} Kayıt</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-auto h-[600px]">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10 border-b border-slate-200">
                                    <tr>
                                        {[
                                            { label: t('opportunities.customer') + ' / ' + t('opportunities.title'), key: 'title' as const },
                                            { label: t('opportunities.stage'), key: 'stage' as const },
                                            { label: t('opportunities.probability'), key: 'probability' as const },
                                            { label: t('opportunities.value'), key: 'value' as const },
                                            { label: t('opportunities.owner'), key: 'ownerName' as const }
                                        ].map(col => (
                                            <th
                                                key={col.label}
                                                className="p-4 font-medium text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors"
                                                onClick={() => handleSort(col.key)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {col.label}
                                                    {sortConfig?.key === col.key && (
                                                        sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="p-4 font-medium text-slate-500 text-center">{t('common.actions', { defaultValue: 'AI İşlem' })}</th>
                                        <th className="p-4 font-medium text-slate-500 text-right cursor-pointer hover:text-indigo-600" onClick={() => handleSort('healthScore')}>
                                            <div className="flex items-center justify-end gap-1">
                                                {t('opportunities.risk')}
                                                {sortConfig?.key === 'healthScore' && (
                                                    sortConfig.direction === 'asc' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />
                                                )}
                                            </div>
                                        </th>
                                    </tr>
                                    <tr className="bg-white dark:bg-slate-700/80 border-b border-slate-100 dark:border-white/5">
                                        <th className="p-2 border-r border-slate-100 dark:border-white/5">
                                            <input
                                                type="text"
                                                placeholder={t('common.search')}
                                                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                value={columnFilters.customer}
                                                onChange={e => setColumnFilters(prev => ({ ...prev, customer: e.target.value }))}
                                            />
                                        </th>
                                        <th className="p-2 border-r border-slate-100 dark:border-white/5">
                                            <select
                                                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                value={columnFilters.stage}
                                                onChange={e => setColumnFilters(prev => ({ ...prev, stage: e.target.value }))}
                                            >
                                                <option value="all">{t('dateFilters.all')}</option>
                                                {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Order', 'Lost'].map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </th>
                                        <th className="p-2 border-r border-slate-100 dark:border-white/5">
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    placeholder="%"
                                                    className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-1 py-1 text-[10px] outline-none"
                                                    value={columnFilters.minProb}
                                                    onChange={e => setColumnFilters(prev => ({ ...prev, minProb: e.target.value }))}
                                                />
                                            </div>
                                        </th>
                                        <th className="p-2 border-r border-slate-100 dark:border-white/5">
                                            <div className="flex gap-1">
                                                <input
                                                    type="number"
                                                    placeholder="Min"
                                                    className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-1 py-1 text-[10px] outline-none"
                                                    value={columnFilters.minValue}
                                                    onChange={e => setColumnFilters(prev => ({ ...prev, minValue: e.target.value }))}
                                                />
                                            </div>
                                        </th>
                                        <th className="p-2 border-r border-slate-100 dark:border-white/5">
                                            <input
                                                type="text"
                                                placeholder="Sahibi..."
                                                className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-indigo-500/50"
                                                value={columnFilters.owner}
                                                onChange={e => setColumnFilters(prev => ({ ...prev, owner: e.target.value }))}
                                            />
                                        </th>
                                        <th className="p-2"></th>
                                        <th className="p-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sortedDeals.map(deal => {
                                        const user = users.find(u => u.id === deal.ownerId);
                                        return (
                                            <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 group">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{deal.title}</div>
                                                    <div className="text-slate-500 dark:text-slate-500">{deal.customerName}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={cn("px-2.5 py-1 rounded text-[10px] uppercase font-bold border", statusColors[deal.stage] || 'bg-slate-100 border-slate-200 text-slate-600')}>
                                                        {deal.stage}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500" style={{ width: `${deal.probability}%` }}></div>
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-400 font-mono">%{Math.round(deal.probability)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                                                    ${(deal.value).toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                                            {user?.name.charAt(0) || '?'}
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-400">{user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenResponseModal(deal)}
                                                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors group/ai"
                                                        title="AI Yanıt Oluştur"
                                                    >
                                                        <Sparkles size={16} className="group-hover/ai:scale-110 transition-transform" />
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {deal.healthScore < 50 ? (
                                                        <div className="flex items-center justify-end gap-1 text-rose-500" title="Riskli">
                                                            <AlertCircle size={14} />
                                                            <span className="text-[10px] font-bold">RİSK</span>
                                                        </div>
                                                    ) : deal.healthScore > 80 ? (
                                                        <div className="flex items-center justify-end gap-1 text-emerald-500" title="İyi">
                                                            <CheckCircle2 size={14} />
                                                            <span className="text-[10px] font-bold">İYİ</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1 text-amber-500" title="Normal">
                                                            <Clock size={14} />
                                                            <span className="text-[10px] font-bold">NORMAL</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Fırsat Pano Görünümü</h3>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl items-center">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:text-slate-700"
                                    >List</button>
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                    >Pano</button>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-mono font-bold uppercase">{filteredDeals.length} Kayıt</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Order', 'Lost'].map(stage => {
                                const stageDeals = sortedDeals.filter(d => d.stage === stage || (stage === 'Order' && d.stage === 'Kazanıldı') || (stage === 'Lost' && d.stage === 'Kaybedildi'));
                                const totalVal = stageDeals.reduce((s, d) => s + d.value, 0);

                                return (
                                    <div key={stage} className="flex flex-col gap-3 min-w-[300px] w-[300px] shrink-0">
                                        <div className="p-3 rounded-xl border border-slate-200 dark:border-white/5 sticky top-0 z-10 backdrop-blur-sm" style={{ backgroundColor: `${STAGE_COLORS[stage]}15` }}>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">{stage}</h3>
                                                </div>
                                                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100 dark:border-white/5">{stageDeals.length}</span>
                                            </div>
                                            <div className="text-[11px] font-mono font-bold" style={{ color: STAGE_COLORS[stage] }}>${totalVal.toLocaleString()}</div>
                                        </div>

                                        <div className="space-y-3 h-[500px] overflow-y-auto pr-1">
                                            {stageDeals.length === 0 && (
                                                <div className="h-20 border-2 border-dashed border-slate-100 dark:border-slate-600 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                                    Kayıt Yok
                                                </div>
                                            )}
                                            {stageDeals.map(deal => (
                                                <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-all border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 group">
                                                    <CardContent className="p-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug">{deal.title}</div>
                                                            {deal.healthScore < 50 && <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1"></div>}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mb-3">{deal.customerName}</div>
                                                        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-600">
                                                            <div className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">${(deal.value / 1000).toFixed(0)}k</div>
                                                            <div className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">{deal.probability}%</div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenResponseModal(deal);
                                                            }}
                                                            className="w-full mt-3 py-1.5 flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Sparkles size={12} />
                                                            AI Yanıt
                                                        </button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }



            {/* Opportunity Response Modal */}
            <OpportunityDetailModal
                deal={selectedDealForResponse}
                isOpen={isResponseModalOpen}
                onClose={() => setIsResponseModalOpen(false)}
            />
        </div>
    );
}
