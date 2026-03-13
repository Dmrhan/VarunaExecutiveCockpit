
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
    LabelList, Cell
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

import { ContractDetailView } from '../../components/contracts/ContractDetailView';
import { RenewalRiskAnalysis } from '../../components/contracts/RenewalRiskAnalysis'; // New component
import { LayoutDashboard, List, Users } from 'lucide-react';

import { ContractService, AccountService } from '../../services/ListingServices';
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
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountSearch, setAccountSearch] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [trendMetric, setTrendMetric] = useState<'amount' | 'count'>('amount');
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const accountDropdownRef = React.useRef<HTMLDivElement>(null);

    const handleAccountScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            fetchAccounts();
        }
    };

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
                setIsAccountDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchAccounts = async (reset = false, search = accountSearch) => {
        if (isFetchingAccounts || (!hasMore && !reset)) return;
        setIsFetchingAccounts(true);
        const newPage = reset ? 0 : page;
        const data = await AccountService.getList(50, newPage * 50, search);

        if (data.length < 50) setHasMore(false);
        else setHasMore(true);

        if (reset) {
            setAccounts(data);
            setPage(1);
        } else {
            setAccounts(prev => [...prev, ...data]);
            setPage(newPage + 1);
        }
        setIsFetchingAccounts(false);
    };

    // Debounced search for accounts
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (isAccountDropdownOpen) {
                fetchAccounts(true, accountSearch);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [accountSearch]);

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
        fetchAccounts();
    }, []);

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
        const statusColors: Record<string, string> = {
            'InPreparation': 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
            'SalesWaitingForInfo': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            'PriceNegotiation': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            'TextNegotiation': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            'AwaitingLegalApproval': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'AwaitingSalesApproval': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'ApprovedByLegalAndSales': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
            'SentToCustomer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'CustomerFeedback': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            'AwaitingCustomerSignature': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            'AwaitingUniveraSignature': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            'Signed': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            'OnHold': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'Expired': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", statusColors[status] || statusColors['InPreparation'])}>
                {t(`status.${status}`, status)}
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



    // Status color map
    const STATUS_COLORS: Record<string, string> = {
        'İmzalandi': '#10b981',
        'Signed': '#10b981',
        'İptal': '#f43f5e',
        'Cancelled': '#f43f5e',
        'Süresi Doldu': '#f59e0b',
        'Expired': '#f59e0b',
        'Hazırlanmakta': '#94a3b8',
        'InPreparation': '#94a3b8',
        'Müzakere': '#818cf8',
        'PriceNegotiation': '#818cf8',
        'TextNegotiation': '#818cf8',
        'Aşatidı': '#60a5fa',
        'AwaitingLegalApproval': '#60a5fa',
        'AwaitingSalesApproval': '#60a5fa',
        'Onaylandı': '#34d399',
        'ApprovedByLegalAndSales': '#34d399',
        'Müşteriye Gönderildi': '#a78bfa',
        'SentToCustomer': '#a78bfa',
        'AwaitingCustomerSignature': '#f472b6',
        'AwaitingUniveraSignature': '#f472b6',
        'Beklemede': '#9ca3af',
        'OnHold': '#9ca3af',
    };

    const formatBarCurrency = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
        return String(v);
    };

    // Color palette for customer / rep bars
    const PALETTE = ['#6366f1','#10b981','#f59e0b','#3b82f6','#f43f5e','#a78bfa','#34d399','#60a5fa','#fb923c','#e879f9'];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
                <div>
                    <h2 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
                        {t('contracts.title', { defaultValue: 'Gelir Güvencesi & Sözleşmeler' })}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                        {t('contracts.subtitle', { defaultValue: 'Sözleşme portföyü, risk analizi ve gelir projeksiyonları.' })}
                    </p>
                </div>

                {/* ── Filters ─────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* As-Of Date */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <Clock size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">{t('contracts.statusDate', 'As-Of')}:</span>
                            <input
                                type="date"
                                value={filters.asOfDate}
                                onChange={(e) => setFilters({ ...filters, asOfDate: e.target.value })}
                                className="bg-transparent text-[11px] font-mono font-bold border-none focus:ring-0 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Sales Rep */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">{t('contracts.filters.salesOwner', 'Temsilci')}</span>
                            <select
                                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer outline-none min-w-[100px] truncate"
                                value={filters.salesRepId}
                                onChange={(e) => setFilters({ ...filters, salesRepId: e.target.value })}
                            >
                                <option value="">{t('common.all', 'Tümü')}</option>
                                {repBreakdown?.map((rep: any) => (
                                    <option key={rep.repId} value={rep.repId}>{rep.repName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Customer searchable dropdown */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5 relative" ref={accountDropdownRef}>
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer min-w-[120px]"
                            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                        >
                            <span className="text-[10px] font-bold uppercase text-slate-500">{t('contracts.filters.customer', 'Müşteri')}</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                {filters.accountId ? (accounts.find(a => a.Id === filters.accountId)?.Title || accounts.find(a => a.Id === filters.accountId)?.Name || t('common.all','Tümü')) : t('common.all', 'Tümü')}
                            </span>
                            <ChevronRight size={12} className={cn('text-slate-400 transition-transform', isAccountDropdownOpen ? 'rotate-90' : '')} />
                        </div>
                        {isAccountDropdownOpen && (
                            <div className="absolute z-50 top-full left-0 mt-1.5 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl py-1 flex flex-col">
                                <div className="px-2 pb-2 pt-1 border-b border-slate-100 dark:border-slate-700/50">
                                    <div className="relative">
                                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/50 dark:text-slate-200"
                                            placeholder={t('common.search', 'Ara...')}
                                            value={accountSearch}
                                            onChange={(e) => setAccountSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-52 overflow-y-auto" onScroll={handleAccountScroll}>
                                    <div className="px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs font-medium" onClick={() => { setFilters({ ...filters, accountId: '' }); setIsAccountDropdownOpen(false); setAccountSearch(''); }}>
                                        {t('common.all', 'Tümü')}
                                    </div>
                                    {accounts.map((acc: any) => (
                                        <div
                                            key={acc.Id}
                                            className={cn('px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-xs truncate', filters.accountId === acc.Id && 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium')}
                                            onClick={() => { setFilters({ ...filters, accountId: acc.Id }); setIsAccountDropdownOpen(false); setAccountSearch(''); }}
                                            title={acc.Title || acc.Name}
                                        >{acc.Title || acc.Name}</div>
                                    ))}
                                    {isFetchingAccounts && <div className="px-3 py-1.5 text-center text-[10px] text-slate-400 italic">{t('common.loading', 'Yükleniyor...')}</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-[10px] font-bold uppercase text-slate-500">{t('contracts.filters.status', 'Durum')}</span>
                            <select
                                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer outline-none min-w-[100px]"
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
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchDashboard}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                        {t('common.refresh', 'Güncelle')}
                    </button>
                </div>
            </div>

            {/* ── KPI Strip ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard label={t('contracts.kpis.totalContracts', 'Toplam Sözleşme')} value={kpis?.totalCount?.toString() || '0'} delta={getDelta(kpis?.totalCount, deltaKpis?.totalCount)} colorClass="text-slate-900 dark:text-white" subtext={formatCurrency(kpis?.totalAmount || 0)} />
                <StatCard label={t('contracts.kpis.activePortfolio', 'Aktif Portföy')} value={kpis?.activeCount?.toString() || '0'} delta={getDelta(kpis?.activeCount, deltaKpis?.activeCount)} colorClass="text-emerald-600 dark:text-emerald-400" subtext={formatCurrency(kpis?.activeAmount || 0)} />
                <StatCard label={t('contracts.kpis.riskNegotiation', 'Riskli / Müzakere')} value={kpis?.riskCount?.toString() || '0'} delta={getDelta(kpis?.riskCount, deltaKpis?.riskCount)} colorClass="text-amber-600 dark:text-amber-400" subtext={formatCurrency(kpis?.riskAmount || 0)} />
                <StatCard label={t('contracts.kpis.archivedCancelled', 'Arşivlendi / İptal')} value={kpis?.archiveCount?.toString() || '0'} delta={getDelta(kpis?.archiveCount, deltaKpis?.archiveCount)} colorClass="text-slate-500" subtext={formatCurrency(kpis?.archiveAmount || 0)} />
                <StatCard label={t('contracts.kpis.expired', 'Süresi Dolan')} value={kpis?.expiredCount?.toString() || '0'} delta={getDelta(kpis?.expiredCount, deltaKpis?.expiredCount)} colorClass="text-red-500" subtext={formatCurrency(kpis?.expiredAmount || 0)} />
                <StatCard label={t('contracts.kpis.totalValue', 'Toplam Bedel')} value={formatCurrency(kpis?.totalAmount || 0)} delta={0} colorClass="text-indigo-600 dark:text-indigo-400" subtext={t('contracts.kpis.allContracts', 'Tüm sözleşmeler')} />
            </div>

            {/* ── Breakdown Charts Row ────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Status Breakdown - Horizontal BarChart */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                        {t('contracts.charts.statusDistribution', 'Durum Dağılımı')}
                    </h3>
                    <div className="flex-1" style={{ minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height={Math.max(280, (statusBreakdown?.length || 6) * 38)}>
                            <BarChart
                                data={statusBreakdown?.map((s: any) => ({ ...s, label: s.statusLabel?.length > 14 ? s.statusLabel.substring(0, 14) + '…' : s.statusLabel }))} 
                                layout="vertical"
                                margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
                                barCategoryGap="20%"
                            >
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={110} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
                                                    <p className="font-bold text-slate-200 uppercase tracking-wide">{d.statusLabel}</p>
                                                    <p>{t('common.count','Adet')}: <span className="font-semibold text-indigo-300">{d.count}</span></p>
                                                    <p>{t('common.amount','Tutar')}: <span className="font-semibold text-emerald-400">{formatCurrency(d.amount)}</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={22}>
                                    {statusBreakdown?.map((s: any, i: number) => (
                                        <Cell key={s.statusLabel} fill={STATUS_COLORS[s.statusLabel] || PALETTE[i % PALETTE.length]} />
                                    ))}
                                    <LabelList dataKey="amount" position="right" formatter={(v: any) => formatBarCurrency(Number(v))} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Top Customers - Horizontal BarChart (clickable → filter) */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                        {t('contracts.charts.top10Customers', 'En Büyük 10 Müşteri')}
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-4">{t('common.clickToFilter', 'Bara tıklayarak filtreleyin')}</p>
                    <div className="flex-1" style={{ minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height={Math.max(280, (accountBreakdown?.length || 8) * 30)}>
                            <BarChart
                                data={accountBreakdown?.slice(0, 10).map((a: any) => ({ ...a, label: a.accountName?.length > 16 ? a.accountName.substring(0, 16) + '…' : a.accountName }))}
                                layout="vertical"
                                margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
                                barCategoryGap="20%"
                            >
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
                                                    <p className="font-bold text-slate-200">{d.accountName}</p>
                                                    <p>{t('common.count','Adet')}: <span className="font-semibold text-indigo-300">{d.count}</span></p>
                                                    <p>{t('common.amount','Tutar')}: <span className="font-semibold text-emerald-400">{formatCurrency(d.amount)}</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="amount"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={22}
                                    cursor="pointer"
                                    onClick={(data: any) => {
                                        const id = data?.payload?.accountId;
                                        setFilters(prev => ({ ...prev, accountId: prev.accountId === id ? '' : id }));
                                    }}
                                >
                                    {accountBreakdown?.slice(0, 10).map((a: any, i: number) => (
                                        <Cell
                                            key={a.accountId}
                                            fill={PALETTE[i % PALETTE.length]}
                                            opacity={filters.accountId && filters.accountId !== a.accountId ? 0.3 : 1}
                                        />
                                    ))}
                                    <LabelList dataKey="amount" position="right" formatter={(v: any) => formatBarCurrency(Number(v))} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Sales Rep - Horizontal BarChart (clickable → filter) */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                        {t('gamification.title', 'Satış Temsilcisi Performansı')}
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-4">{t('common.clickToFilter', 'Bara tıklayarak filtreleyin')}</p>
                    <div className="flex-1" style={{ minHeight: '280px' }}>
                        <ResponsiveContainer width="100%" height={Math.max(280, (repBreakdown?.length || 5) * 38)}>
                            <BarChart
                                data={repBreakdown?.map((r: any) => ({ ...r, label: r.repName?.length > 14 ? r.repName.substring(0, 14) + '…' : r.repName }))}
                                layout="vertical"
                                margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
                                barCategoryGap="20%"
                            >
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={110} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const d = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
                                                    <p className="font-bold text-slate-200">{d.repName}</p>
                                                    <p>{t('common.count','Adet')}: <span className="font-semibold text-indigo-300">{d.count}</span></p>
                                                    <p>{t('contracts.kpis.riskNegotiation','Risk')}: <span className="font-semibold text-amber-300">{d.riskCount}</span></p>
                                                    <p>{t('common.amount','Tutar')}: <span className="font-semibold text-emerald-400">{formatCurrency(d.amount)}</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="amount"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={22}
                                    cursor="pointer"
                                    onClick={(data: any) => {
                                        const id = data?.payload?.repId;
                                        setFilters(prev => ({ ...prev, salesRepId: prev.salesRepId === id ? '' : id }));
                                    }}
                                >
                                    {repBreakdown?.map((r: any, i: number) => (
                                        <Cell
                                            key={r.repId}
                                            fill={PALETTE[i % PALETTE.length]}
                                            opacity={filters.salesRepId && filters.salesRepId !== r.repId ? 0.3 : 1}
                                        />
                                    ))}
                                    <LabelList dataKey="amount" position="right" formatter={(v: any) => formatBarCurrency(Number(v))} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Insights Row 1 ────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-h-[440px]">
                <div className="flex flex-col h-full"><ProductContractHealth /></div>
                <div className="flex flex-col h-full"><ContractOwnershipPanel /></div>
            </div>

            {/* ── Trend & Status Distribution ───────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch min-h-[380px]">
                <div className="xl:col-span-2">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {t('contracts.charts.trendTitle', 'Sözleşme Trendi (Son 12 Ay)')}
                            </h3>
                            <div className="bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg flex items-center border border-slate-200 dark:border-white/5">
                                <button
                                    onClick={() => setTrendMetric('amount')}
                                    className={cn('px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all', trendMetric === 'amount' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
                                >{t('common.amount', 'Tutar')}</button>
                                <button
                                    onClick={() => setTrendMetric('count')}
                                    className={cn('px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all', trendMetric === 'count' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}
                                >{t('common.count', 'Adet')}</button>
                            </div>
                        </div>
                        <div className="p-6 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} interval={0} angle={-30} textAnchor="end" height={70} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload?.length) {
                                                return (
                                                    <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
                                                        <p className="font-bold text-slate-200 uppercase tracking-wide">{label}</p>
                                                        <p>{trendMetric === 'amount' ? formatCurrency(payload[0].value as number) : payload[0].value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey={trendMetric} fill={trendMetric === 'amount' ? '#6366f1' : '#10b981'} radius={[6, 6, 0, 0]} maxBarSize={40}>
                                        <LabelList dataKey={trendMetric} content={renderCustomBarLabel} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="xl:col-span-1"><ContractStatusDistribution /></div>
            </div>

            {/* ── Risk & Renewal ────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch min-h-[380px]">
                <RenewalRiskAnalysis />
                <RenewalCalendar />
            </div>

            {/* ── Contract List Table ───────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {t('contracts.list.header.customerTitle')}
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder={t('contracts.list.filters.searchPlaceholder')}
                                className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg flex items-center border border-slate-200 dark:border-white/5">
                            <select
                                className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer outline-none px-2 py-1"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="All">{t('contracts.list.filters.allStatuses')}</option>
                                <option value="Signed">{t('status.Signed', 'Signed')}</option>
                                <option value="PriceNegotiation">{t('status.PriceNegotiation', 'Price Negotiation')}</option>
                                <option value="InPreparation">{t('status.InPreparation', 'In Preparation')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.customerTitle')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.product')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.status')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.salesOwner', { defaultValue: 'Sorumlu' })}</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.value')}</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.renewalIn')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('contracts.list.header.risk')}</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredContracts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((contract: Contract) => (
                                <tr
                                    key={contract.id}
                                    onClick={() => onSelectContract(contract.id)}
                                    className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">{contract.customerName}</div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{contract.title}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getProductBadgeColor(contract.productGroup)}`}>{contract.productGroup}</span>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={contract.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200 dark:border-white/10">
                                                {contract.ownerName ? contract.ownerName.charAt(0) : '?'}
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">{contract.ownerName || t('common.unassigned', 'Atanmamış')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(contract.totalValueTL)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className={`font-mono font-bold text-xs ${ contract.daysToRenewal < 90 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{contract.daysToRenewal}d</div>
                                    </td>
                                    <td className="px-4 py-3"><RiskBadge level={contract.riskLevel} /></td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><MoreHorizontal size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5">
                    <div className="text-[10px] text-slate-500">
                        {t('contracts.pagination.showing')} <span className="font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {t('contracts.pagination.to')} <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredContracts.length)}</span> {t('contracts.pagination.of')} <span className="font-bold">{filteredContracts.length}</span> {t('contracts.pagination.results')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronsLeft size={14} /></button>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronLeft size={14} /></button>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">{currentPage} / {Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredContracts.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage >= Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronRight size={14} /></button>
                        <button onClick={() => setCurrentPage(Math.ceil(filteredContracts.length / ITEMS_PER_PAGE))} disabled={currentPage >= Math.ceil(filteredContracts.length / ITEMS_PER_PAGE)} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><ChevronsRight size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
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
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${contract.status === 'Signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {t(`status.${contract.status}`, contract.status)}
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

const StatCard = ({ label, value, colorClass, subtext, delta }: { label: string; value: string; colorClass: string; subtext?: string; delta?: number }) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-medium mb-2">{label}</span>
        <div className="flex items-baseline justify-center gap-1.5">
            <span className={`text-2xl font-normal tracking-tight ${colorClass}`}>{value}</span>
            {delta !== undefined && delta !== 0 && (
                <span className={cn('text-[10px] font-bold', delta > 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
                </span>
            )}
        </div>
        {subtext && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">{subtext}</span>
        )}
    </div>
);

const StatusBadge = ({ status }: { status: ContractStatus }) => {
    const { t } = useTranslation();
    const styles: Record<string, string> = {
        'InPreparation': 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        'SalesWaitingForInfo': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800',
        'PriceNegotiation': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        'TextNegotiation': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        'AwaitingLegalApproval': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        'AwaitingSalesApproval': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        'ApprovedByLegalAndSales': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
        'SentToCustomer': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800',
        'CustomerFeedback': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800',
        'AwaitingCustomerSignature': 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 border-pink-100 dark:border-pink-800',
        'AwaitingUniveraSignature': 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 border-pink-100 dark:border-pink-800',
        'Signed': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        'OnHold': 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-500 border-gray-200 dark:border-gray-700',
        'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800',
        'Expired': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-medium ${styles[status] || styles['InPreparation']}`}>
            {t(`status.${status}`, status)}
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
