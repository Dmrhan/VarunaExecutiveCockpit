
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import type { Contract, ContractStatus } from '../../types/crm';
import {
    FileText, AlertTriangle, CheckCircle, Clock, ShieldAlert,
    DollarSign, Filter, Search, MoreHorizontal, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, BarChart as BarChartIcon
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Legend, LabelList
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

import { ContractDetailView } from '../../components/contracts/ContractDetailView';
import { RenewalRiskAnalysis } from '../../components/contracts/RenewalRiskAnalysis'; // New component
import { LayoutDashboard, List, Users } from 'lucide-react';

import { ContractService } from '../../services/ListingServices';
import { ContractOwnershipPanel } from '../../components/contracts/ContractOwnershipPanel';
import { ContractStatusDistribution } from '../../components/contracts/ContractStatusDistribution';
import { ProductContractHealth } from '../../components/contracts/ProductContractHealth';
import { RenewalCalendar } from '../../components/contracts/RenewalCalendar';

// Internal component for the overview stats and charts
const DashboardOverview = ({ onSelectContract }: { onSelectContract: (id: string) => void }) => {
    const { t } = useTranslation();
    const { contracts } = useData(); // Keep for list filtering
    const [filters, setFilters] = useState({
        asOfDate: new Date().toISOString().split('T')[0],
        salesRepId: '',
        accountId: '',
        status: 'All'
    });
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [trendMetric, setTrendMetric] = useState<'amount' | 'count'>('amount');

    const fetchDashboard = async () => {
        setIsLoading(true);
        const data = await ContractService.getDashboardAnalytics({
            asOfDate: filters.asOfDate,
            salesRepId: filters.salesRepId || undefined,
            accountId: filters.accountId || undefined,
            statuses: filters.status !== 'All' ? [parseInt(filters.status)] : undefined
        });
        if (data) setDashboardData(data);
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchDashboard();
    }, [filters.asOfDate, filters.salesRepId, filters.accountId, filters.status]); // Depend on individual filter values

    // --- Filtered List (for the table at the bottom) ---
    const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm]);

    const filteredContracts = useMemo(() => {
        return contracts.filter((c: Contract) => {
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        }).sort((a: Contract, b: Contract) => a.daysToRenewal - b.daysToRenewal); // Sort by urgency
    }, [contracts, statusFilter, searchTerm]);


    if (isLoading && !dashboardData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const { kpis, deltaKpis, statusBreakdown, accountBreakdown, repBreakdown, trendData } = dashboardData || {};

    const getDelta = (current: number, previous: number) => {
        if (!previous || previous === 0) return 0; // Avoid division by zero
        return ((current - previous) / previous) * 100;
    };

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, value } = props;
        if (!value) return null;

        return (
            <g transform={`translate(${x + width / 2},${y - 10})`}>
                <text x={0} y={0} dy={0} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight={700}>
                    {trendMetric === 'amount' ? formatCurrency(value) : value}
                </text>
            </g>
        );
    };

    // Helper component for KPI cards with delta
    const StatCard = ({ label, value, delta, colorClass, subtext }: { label: string; value: string; delta: number; colorClass: string; subtext: string; }) => (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
                <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</div>
                <div className="flex items-baseline gap-2">
                    <div className={cn("text-2xl font-bold", colorClass)}>{value}</div>
                    {delta !== 0 && (
                        <span className={cn("text-[10px] font-bold", delta > 0 ? "text-emerald-500" : "text-red-500")}>
                            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
                        </span>
                    )}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</div>
            </CardContent>
        </Card>
    );

    // Helper for status badge (re-used from original code)
    const StatusBadge = ({ status }: { status: ContractStatus }) => {
        const statusColors = {
            'Active': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            'Negotiation': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            'Draft': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
            'Expired': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'Archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            'Terminated': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'Renewed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
        return (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", statusColors[status])}>
                {t(`status.${status}`)}
            </span>
        );
    };

    // Helper for risk badge (re-used from original code)
    const RiskBadge = ({ level }: { level: 'Low' | 'Medium' | 'High' }) => {
        const riskColors = {
            'Low': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            'Medium': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            'High': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        const riskIcons = {
            'Low': <CheckCircle size={12} />,
            'Medium': <AlertTriangle size={12} />,
            'High': <ShieldAlert size={12} />,
        };
        return (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", riskColors[level])}>
                {riskIcons[level]} {level}
            </span>
        );
    };

    // Helper for product badge (re-used from original code)
    const getProductBadgeColor = (productGroup: string) => {
        switch (productGroup) {
            case 'ERP': return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'CRM': return 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'BI': return 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300';
        }
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header & Filter Bar */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
                            {t('contracts.title', { defaultValue: 'Gelir Güvencesi & Sözleşmeler' })}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {t('contracts.subtitle', { defaultValue: 'Sözleşme portföyü, risk analizi ve gelir projeksiyonları.' })}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('contracts.statusDate', 'Durum Tarihi')}</label>
                            <input
                                type="date"
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={filters.asOfDate}
                                onChange={(e) => setFilters({ ...filters, asOfDate: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('contracts.filters.salesOwner', 'Satış Temsilcisi')}</label>
                            <select
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]"
                                value={filters.salesRepId}
                                onChange={(e) => setFilters({ ...filters, salesRepId: e.target.value })}
                            >
                                <option value="">{t('common.all', 'Tümü')}</option>
                                {/* We would ideally fetch these from a user list, but for now we'll use active selection */}
                                {repBreakdown?.map((rep: any) => (
                                    <option key={rep.repId} value={rep.repId}>{rep.repName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('contracts.filters.customer', 'Müşteri')}</label>
                            <select
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]"
                                value={filters.accountId}
                                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                            >
                                <option value="">{t('common.all', 'Tümü')}</option>
                                {accountBreakdown?.map((acc: any) => (
                                    <option key={acc.accountId} value={acc.accountId}>{acc.accountName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('contracts.filters.status', 'Sözleşme Durumu')}</label>
                            <select
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="all">{t('common.all', 'Tümü')}</option>
                                <option value="1">{t('contracts.status.rejected', 'Reddedildi')}</option>
                                <option value="2">{t('contracts.status.pendingApproval', 'Onay Bekliyor')}</option>
                                <option value="3">{t('contracts.status.approved', 'Onaylandı')}</option>
                                <option value="4">{t('contracts.status.univeraSigned', 'Univera İmzasında')}</option>
                                <option value="5">{t('contracts.status.customerSigned', 'Müşteri İmzasında')}</option>
                                <option value="6">{t('contracts.status.completed', 'Tamamlandı')}</option>
                                <option value="7">{t('contracts.status.noMaintenance', 'Bakıma Devir Olmadı')}</option>
                                <option value="8">{t('contracts.status.archived', 'Arşivlendi')}</option>
                                <option value="9">{t('contracts.status.cancelled', 'Fesih / İptal')}</option>
                                <option value="10">{t('contracts.status.renewedExpired', 'Yenilendi / Süresi Doldu')}</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchDashboard}
                            className="mt-auto p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                        >
                            <Search size={16} />
                        </button>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Cards - Grid 3x2 for GM balance */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    label={t('contracts.kpis.totalContracts', 'Toplam Sözleşme')}
                    value={kpis?.totalCount?.toString() || '0'}
                    delta={getDelta(kpis?.totalCount, deltaKpis?.totalCount)}
                    colorClass="text-slate-900 dark:text-white"
                    subtext={formatCurrency(kpis?.totalAmount || 0)}
                />
                <StatCard
                    label={t('contracts.kpis.activePortfolio', 'Aktif Portföy')}
                    value={kpis?.activeCount?.toString() || '0'}
                    delta={getDelta(kpis?.activeCount, deltaKpis?.activeCount)}
                    colorClass="text-emerald-600 dark:text-emerald-400"
                    subtext={formatCurrency(kpis?.activeAmount || 0)}
                />
                <StatCard
                    label={t('contracts.kpis.riskNegotiation', 'Riskli / Müzakere')}
                    value={kpis?.riskCount?.toString() || '0'}
                    delta={getDelta(kpis?.riskCount, deltaKpis?.riskCount)}
                    colorClass="text-amber-600 dark:text-amber-400"
                    subtext={formatCurrency(kpis?.riskAmount || 0)}
                />
                <StatCard
                    label={t('contracts.kpis.archivedCancelled', 'Arşivlendi / İptal')}
                    value={kpis?.archiveCount?.toString() || '0'}
                    delta={getDelta(kpis?.archiveCount, deltaKpis?.archiveCount)}
                    colorClass="text-slate-500"
                    subtext={formatCurrency(kpis?.archiveAmount || 0)}
                />
                <StatCard
                    label={t('contracts.kpis.expired', 'Süresi Dolan')}
                    value={kpis?.expiredCount?.toString() || '0'}
                    delta={getDelta(kpis?.expiredCount, deltaKpis?.expiredCount)}
                    colorClass="text-red-500"
                    subtext={formatCurrency(kpis?.expiredAmount || 0)}
                />
                <StatCard
                    label={t('contracts.kpis.totalValue', 'Toplam Bedel (TL)')}
                    value={formatCurrency(kpis?.totalAmount || 0)}
                    delta={0}
                    colorClass="text-indigo-600 dark:text-indigo-400"
                    subtext={t('contracts.kpis.allContracts', 'Tüm sözleşmeler')}
                />
            </div>

            {/* Breakdown Sections (3rd Row Idea - Tabs or Side-by-Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Status Breakdown */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <BarChartIcon size={14} /> {t('contracts.charts.statusDistribution', 'Durum Dağılımı')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {statusBreakdown?.map((item: any) => (
                                <div key={item.statusLabel} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.statusLabel}</span>
                                        <span className="text-[10px] text-slate-400">{item.count} {t('common.unit', { defaultValue: 'Adet' })}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Customer Breakdown */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Users size={14} /> {t('contracts.charts.top10Customers', 'En Büyük 10 Müşteri')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {accountBreakdown?.map((item: any) => (
                                <div key={item.accountId} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{item.accountName}</span>
                                        <span className="text-[10px] text-slate-400">{item.count} {t('navigation.contracts')} / {item.activeCount} {t('status.Active')}</span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Sales Rep Breakdown */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Search size={14} /> {t('gamification.title', 'Satış Temsilcisi Performansı')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {repBreakdown?.map((item: any) => (
                                <div key={item.repId} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.repName}</span>
                                        <span className="text-[10px] text-slate-400">{item.count} {t('activities.charts_extended.activity')} / {item.riskCount} {t('common.risk')}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                                            {formatCurrency(item.amount)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Insights Row 1 - Product & Ownership Side-by-Side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4 items-stretch min-h-[440px]">
                <div className="flex flex-col h-full">
                    <ProductContractHealth />
                </div>
                <div className="flex flex-col h-full">
                    <ContractOwnershipPanel />
                </div>
            </div>

            {/* Insights Row 2 - Charts & Distributions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4 items-stretch min-h-[380px]">
                <div className="xl:col-span-2">
                    <Card className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5 bg-white/5">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {t('contracts.charts.trendTitle', 'Sözleşme Trendi (Son 12 Ay)')}
                            </CardTitle>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTrendMetric('amount')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${trendMetric === 'amount' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t('common.amount', 'TUTAR')}
                                </button>
                                <button
                                    onClick={() => setTrendMetric('count')}
                                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${trendMetric === 'count' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t('common.count', 'ADET')}
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        dy={10}
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        hide
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            borderRadius: '12px',
                                            border: 'none',
                                            color: '#fff',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                        }}
                                        itemStyle={{ color: '#fff', fontSize: '11px' }}
                                        formatter={(value: any) => trendMetric === 'amount' ? formatCurrency(value) : value}
                                    />
                                    <Bar
                                        dataKey={trendMetric}
                                        fill={trendMetric === 'amount' ? '#6366f1' : '#10b981'}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    >
                                        <LabelList dataKey={trendMetric} content={renderCustomBarLabel} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
                <div className="xl:col-span-1">
                    <ContractStatusDistribution />
                </div>
            </div>

            {/* Insights Row 3 - Risk & Planning */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4 items-stretch min-h-[380px]">
                <RenewalRiskAnalysis />
                <RenewalCalendar />
            </div>


            {/* Intelligent Contract List */}
            <Card className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <CardHeader className="py-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                {t('contracts.list.header.customerTitle')}
                            </CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder={t('contracts.list.filters.searchPlaceholder')}
                                    className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="text-slate-400" size={14} />
                                <select
                                    className="bg-transparent border-none text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                >
                                    <option value="All">{t('contracts.list.filters.allStatuses')}</option>
                                    <option value="Active">{t('status.Active')}</option>
                                    <option value="Negotiation">{t('status.Negotiation')}</option>
                                    <option value="Draft">{t('status.Draft')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.customerTitle')}</th>
                                <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.product')}</th>
                                <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.status')}</th>
                                <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.salesOwner', { defaultValue: 'Sorumlu' })}</th> {/* New Column */}
                                <th className="px-4 py-3 text-right font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.value')}</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.renewalIn')}</th>
                                <th className="px-4 py-3 font-medium text-slate-500 uppercase tracking-wider">{t('contracts.list.header.risk')}</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredContracts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((contract: Contract) => (
                                <tr
                                    key={contract.id}
                                    onClick={() => onSelectContract(contract.id)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">{contract.customerName}</div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{contract.title}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getProductBadgeColor(contract.productGroup)}`}>
                                            {contract.productGroup}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={contract.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                                                {contract.ownerName ? contract.ownerName.charAt(0) : '?'}
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">{contract.ownerName || t('common.unassigned', 'Atanmamış')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                        {formatCurrency(contract.totalValueTL)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className={`font-mono font-bold ${contract.daysToRenewal < 90 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {contract.daysToRenewal}d
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <RiskBadge level={contract.riskLevel} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-700/30">
                    <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                        {t('contracts.pagination.showing')} <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {t('contracts.pagination.to')} <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredContracts.length)}</span> {t('contracts.pagination.of')} <span className="font-medium">{filteredContracts.length}</span> {t('contracts.pagination.results')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="First Page"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 px-2">
                            {t('contracts.pagination.page')} {currentPage} / {Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredContracts.length / ITEMS_PER_PAGE), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Next Page"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.ceil(filteredContracts.length / ITEMS_PER_PAGE))}
                            disabled={currentPage >= Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Last Page"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            </Card>
        </div >
    );
};

// --- Empty State Component ---
const EmptyDetailView = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <FileText size={48} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                {t('contracts.emptyState.title', { defaultValue: 'Sözleşme Detayı Görüntüle' })}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8">
                {t('contracts.emptyState.desc', { defaultValue: 'Detaylarını incelemek ve tahsilat analizi yapmak için soldaki listeden bir müşteri seçiniz.' })}
            </p>
        </div>
    );
};

export const ContractsDashboard = () => {
    const { t } = useTranslation();
    const { contracts } = useData();
    const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredList = useMemo(() => {
        return contracts.filter(c =>
            c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contracts, searchTerm]);

    // Auto-open sidebar when entering detail view
    React.useEffect(() => {
        if (selectedContractId) {
            setViewMode('details');
            setSidebarOpen(true);
        }
    }, [selectedContractId]);

    const handleSidebarToggle = () => {
        if (isSidebarOpen) {
            setSidebarOpen(false);
        } else {
            setSidebarOpen(true);
            if (viewMode === 'overview') {
                setViewMode('details');
            }
        }
    };

    const handleOverviewClick = () => {
        setViewMode('overview');
        setSidebarOpen(false); // Close sidebar for full width overview
        setSelectedContractId(null); // Clear selection
    };

    const handleDetailsClick = () => {
        setViewMode('details');
        setSidebarOpen(true);
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] -mt-4 -mx-4 overflow-hidden">
            {/* Sidebar */}
            <div className={`
                border-r border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800 flex flex-col transition-all duration-300
                ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
            `}>
                <div className="p-4 border-b border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Users size={16} /> {t('contracts.sidebar.customers')}
                        </h3>
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">
                            {contracts.length}
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder={t('contracts.sidebar.searchPlaceholder')}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredList.map(contract => (
                        <div
                            key={contract.id}
                            onClick={() => setSelectedContractId(contract.id)}
                            className={`
                                p-3 rounded-xl cursor-pointer transition-all border
                                ${selectedContractId === contract.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20'
                                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold text-sm ${selectedContractId === contract.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {contract.customerName}
                                </span>
                                {contract.riskLevel === 'High' && (
                                    <ShieldAlert size={14} className="text-red-500" />
                                )}
                            </div>
                            <div className="text-xs text-slate-500 truncate mb-2">{contract.title}</div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${contract.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {t(`status.${contract.status}`)}
                                </span>
                                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                                    {formatCurrency(contract.totalValue, contract.currency)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
                {/* Toolbar */}
                <div className="h-14 border-b border-slate-200 dark:border-white/5 flex items-center px-4 bg-white dark:bg-slate-800 justify-between">
                    <button
                        onClick={handleSidebarToggle}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"
                    >
                        {isSidebarOpen ? <ChevronsLeft size={20} /> : <List size={20} />}
                    </button>

                    <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                        <button
                            onClick={handleOverviewClick}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'overview' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LayoutDashboard size={14} />
                            {t('contracts.viewMode.overview')}
                        </button>
                        <button
                            onClick={handleDetailsClick}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'details' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <FileText size={14} />
                            {t('contracts.viewMode.details')}
                        </button>
                    </div>
                </div>

                {/* View Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {viewMode === 'overview' ? (
                        <DashboardOverview onSelectContract={(id) => setSelectedContractId(id)} />
                    ) : (
                        selectedContractId ? (
                            <ContractDetailView
                                contractId={selectedContractId}
                                onBack={handleOverviewClick}
                            />
                        ) : (
                            <EmptyDetailView />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Subcomponents ---

const StatCard = ({ label, value, colorClass, subtext }: { label: string; value: string; colorClass: string, subtext?: string }) => (
    <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-600 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-bold mb-2">
            {label}
        </span>
        <span className={`text-xl lg:text-2xl font-light tracking-tight ${colorClass}`}>
            {value}
        </span>
        {subtext && (
            <span className="text-[10px] text-slate-400 mt-2 font-medium">
                {subtext}
            </span>
        )}
    </div>
);

const StatusBadge = ({ status }: { status: ContractStatus }) => {
    const { t } = useTranslation();
    const styles = {
        Active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
        Negotiation: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800",
        Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        Archived: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-500 border-gray-200 dark:border-gray-700",
        Terminated: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800",
        Expired: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800"
    };

    return (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-medium ${styles[status] || styles.Draft}`}>
            {t(`status.${status}`)}
        </span>
    );
};

const RiskBadge = ({ level }: { level: string }) => {
    const { t } = useTranslation();
    if (level === 'Low') {
        return <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium"><CheckCircle size={14} className="mr-1" /> {t('risk.low', { defaultValue: 'Düşük' })}</span>;
    }
    if (level === 'Medium') {
        return <span className="flex items-center text-amber-600 dark:text-amber-400 text-xs font-medium"><AlertTriangle size={14} className="mr-1" /> {t('risk.medium', { defaultValue: 'Orta' })}</span>;
    }
    return <span className="flex items-center text-red-600 dark:text-red-400 text-xs font-medium"><ShieldAlert size={14} className="mr-1" /> {t('risk.high', { defaultValue: 'Yüksek' })}</span>;
};


const getProductBadgeColor = (product: string) => {
    const map: Record<string, string> = {
        'EnRoute': 'bg-red-50 text-red-700 border border-red-100',
        'Stokbar': 'bg-blue-50 text-blue-700 border border-blue-100',
        'Quest': 'bg-green-50 text-green-700 border border-green-100',
        'ServiceCore': 'bg-purple-50 text-purple-700 border border-purple-100',
        'Varuna': 'bg-yellow-50 text-yellow-700 border border-yellow-100',
        'Hosting': 'bg-slate-100 text-slate-700 border border-slate-200'
    };
    return map[product] || 'bg-gray-100 text-gray-700 border border-gray-200';
};
