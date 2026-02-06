
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import type { Contract, ContractStatus } from '../../types/crm';
import {
    FileText, AlertTriangle, CheckCircle, Clock, ShieldAlert,
    DollarSign, Filter, Search, MoreHorizontal, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Legend
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

import { ContractDetailView } from '../../components/contracts/ContractDetailView';
import { RenewalRiskAnalysis } from '../../components/contracts/RenewalRiskAnalysis'; // New component
import { LayoutDashboard, List, Users } from 'lucide-react';

import { ContractOwnershipPanel } from '../../components/contracts/ContractOwnershipPanel';
import { ContractStatusDistribution } from '../../components/contracts/ContractStatusDistribution';
import { ProductContractHealth } from '../../components/contracts/ProductContractHealth';
import { RenewalCalendar } from '../../components/contracts/RenewalCalendar';

// Internal component for the overview stats and charts
const DashboardOverview = ({ onSelectContract }: { onSelectContract: (id: string) => void }) => {
    const { t } = useTranslation();
    const { contracts } = useData();
    const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm]);

    // --- KPIs ---
    const kpis = useMemo(() => {
        const activeContracts = contracts.filter((c: Contract) => c.status === 'Active');
        const renewalRisk = activeContracts.filter((c: Contract) => c.daysToRenewal <= 90);
        const totalValue = activeContracts.reduce((sum: number, c: Contract) => sum + c.totalValueTL, 0);
        const autoRenew = activeContracts.filter((c: Contract) => c.autoRenewal).length;

        return {
            activeCount: activeContracts.length,
            renewalRiskCount: renewalRisk.length,
            totalValue,
            autoRenewCount: autoRenew,
            renewalValue: renewalRisk.reduce((sum: number, c: Contract) => sum + c.totalValueTL, 0)
        };
    }, [contracts]);

    // --- Chart Data ---


    // 2. Revenue Projection (Quarterly)
    const revenueData = useMemo(() => {
        // Mocking quarterly distribution based on active contracts
        const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
        return quarters.map(q => ({
            name: q,
            revenue: Math.floor(kpis.totalValue / 4 * (0.8 + Math.random() * 0.4)),
            billing: Math.floor(kpis.totalValue / 4 * (0.7 + Math.random() * 0.3))
        }));
    }, [kpis.totalValue]);

    // 3. Portfolio by Owner
    const ownerData = useMemo(() => {
        const map: Record<string, number> = {};
        contracts.forEach((c: Contract) => {
            const owner = 'Rep ' + c.salesOwnerId.replace('u', '');
            map[owner] = (map[owner] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [contracts]);

    // --- Filtered List ---
    const filteredContracts = useMemo(() => {
        return contracts.filter((c: Contract) => {
            const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
            const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.title.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        }).sort((a: Contract, b: Contract) => a.daysToRenewal - b.daysToRenewal); // Sort by urgency
    }, [contracts, statusFilter, searchTerm]);


    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
                        {t('contracts.title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {t('contracts.subtitle')}
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label={t('contracts.kpis.activeContracts')}
                    value={kpis.activeCount.toString()}
                    colorClass="text-slate-900 dark:text-white"
                    subtext={t('contracts.kpis.sub.autoRenew', { count: kpis.activeCount > 0 ? kpis.autoRenewCount : 0 })}
                />
                <StatCard
                    label={t('contracts.kpis.totalValue')}
                    value={formatCurrency(kpis.totalValue)}
                    colorClass="text-slate-900 dark:text-white"
                    subtext={t('contracts.kpis.sub.annualized')}
                />
                <StatCard
                    label={t('contracts.kpis.renewalRisk')}
                    value={kpis.renewalRiskCount.toString()}
                    colorClass={kpis.renewalRiskCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}
                    subtext={t('contracts.kpis.sub.atRisk', { value: formatCurrency(kpis.renewalValue) })}
                />
                <StatCard
                    label={t('contracts.kpis.executionHealth')}
                    value="94%"
                    colorClass="text-emerald-600 dark:text-emerald-400"
                    subtext={t('contracts.kpis.sub.onTrack')}
                />
            </div>

            {/* Main Visualizations: Radar & Revenue (Control Tower Layout) */}
            {/* Main Visualizations: Radar & Revenue (Control Tower Layout) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* --- Row 1: Executive Overview --- */}

                {/* Renewal Radar (2/3 width) */}
                {/* Renewal Risk Analysis (Replaces Radar) */}
                <RenewalRiskAnalysis />

                {/* Revenue Projection (1/3 width) */}
                {/* Status Distribution (1/3 width) - Replaces Revenue Projection for better state visibility */}
                <ContractStatusDistribution />

                {/* --- Row 2: Planning (Full Width) --- */}
                <div className="xl:col-span-3">
                    <div className="mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('contracts.section.planning')}</h3>
                    </div>
                    <RenewalCalendar />
                </div>

                {/* --- Row 3: Ownership & Deep Dives --- */}

                {/* Product Health (2/3 width) */}
                <div className="xl:col-span-2">
                    <ProductContractHealth />
                </div>

                {/* Ownership (1/3 width) */}
                <div className="xl:col-span-1">
                    <ContractOwnershipPanel />
                </div>

            </div>

            {/* Intelligent Contract List (Updated Columns) */}
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
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">{contract.ownerName || 'Unassigned'}</span>
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
        Terminated: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800"
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
