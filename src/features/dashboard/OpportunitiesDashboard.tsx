import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { Share2, Info, Users, Sparkles, Calendar, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Building2, Package, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { TeamService } from '../../services/TeamService';
import { MultiSelect } from '../../components/ui/MultiSelect';

export const getMappedStageInfo = (rawStage: string) => {
    const config = STAGE_CONFIG.find(c => c.matchStages.includes(rawStage) || c.stage === rawStage);
    return config || { stage: rawStage, color: '#94a3b8', probability: 0 };
};

import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { PipelineAIInsightPanel } from './PipelineAIInsightPanel';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { OpportunityService } from '../../services/OpportunityService';
import { FunnelChart, STAGE_CONFIG } from './FunnelChart';
import { OpportunityOwnerDistribution } from './OpportunityOwnerDistribution';
import { ProductPerformance } from './ProductPerformance';
import { OpportunityForecast } from './OpportunityForecast';
import { ProductGroupService } from '../../services/ProductGroupService';
import type { IProductGroup } from '../../types/crm';
import { HorizontalBarChart } from '../../components/ui/HorizontalBarChart';
import { SalesRepList } from './SalesRepList';
import { LostReasonsDistribution } from './LostReasonsDistribution';

import type { Deal } from '../../types/crm';

// --- Sub-components & Helpers from OpportunityDashboard ---

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};



// Remove DashboardGridCard and its dependencies


const StatCard = ({ label, value, colorClass, subLabel }: { label: string; value: string; colorClass: string; subLabel?: string }) => (
    <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-600 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-bold mb-2">
            {label}
        </span>
        <span className={`text-xl lg:text-2xl font-light tracking-tight ${colorClass}`}>
            {value}
        </span>
        {subLabel && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{subLabel}</span>
        )}
    </div>
);


export function OpportunitiesDashboard() {
    const { t } = useTranslation();
    const { deals, users } = useData();
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [productGroups, setProductGroups] = useState<IProductGroup[]>([]);

    useEffect(() => {
        ProductGroupService.getAll().then(setProductGroups).catch(console.error);
    }, []);

    // Chart Drilldown State
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedTopCustomer, setSelectedTopCustomer] = useState<string | null>(null);
    const [selectedDealType, setSelectedDealType] = useState<string | null>(null);

    // Filter State
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Global Filters
    const [selectedOwner, setSelectedOwner] = useState<string[]>(['all']);
    const [selectedProduct, setSelectedProduct] = useState<string[]>(['all']);
    const [selectedTeam, setSelectedTeam] = useState<string[]>(['all']);

    // Fetch Teams
    const { data: teamsData } = useQuery({
        queryKey: ['teams'],
        queryFn: TeamService.getAll
    });

    // Fetch Team Members
    const { data: teamMembers } = useQuery({
        queryKey: ['team-members', selectedTeam],
        queryFn: () => selectedTeam.includes('all') ? Promise.resolve([]) : TeamService.getMembers(selectedTeam.filter(t => t !== 'all')),
        enabled: !selectedTeam.includes('all') && selectedTeam.length > 0
    });

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

    // --- Forecast State ---
    const [forecastMonthFilter, setForecastMonthFilter] = useState<Date | null>(null);

    // Reset Person filter when Team changes
    useEffect(() => {
        setSelectedOwner(['all']);
    }, [selectedTeam]);

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

    const handleForecastMonthClick = (date: Date) => {
        if (forecastMonthFilter &&
            date.getMonth() === forecastMonthFilter.getMonth() &&
            date.getFullYear() === forecastMonthFilter.getFullYear()) {
            setForecastMonthFilter(null);
        } else {
            setForecastMonthFilter(date);
            // Optional: Scroll to list?
            // window.scrollTo({ top: 500, behavior: 'smooth' });

            // If we are filtering by a specific month in the future, 
            // the "Created Date" filter might hide everything. 
            // Let's reset it to 'all' to ensure the user sees the forecasted deals.
            if (dateFilter !== 'all') {
                setDateFilter('all');
            }
        }
    };


    const owners = useMemo(() => {
        if (!users) return [];
        let filteredUsers = [...users];
        if (!selectedTeam.includes('all') && selectedTeam.length > 0 && teamMembers) {
            const memberIds = teamMembers.map(m => m.PersonId);
            filteredUsers = filteredUsers.filter(u => memberIds.includes(u.id));
        }
        return filteredUsers.map(u => ({ id: u.id, name: u.name }));
    }, [users, selectedTeam, teamMembers]);

    const products = useMemo(() => {
        const pGroups = Array.from(new Set(deals.map(d => d.product))).filter(Boolean) as string[];
        return pGroups;
    }, [deals]);

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
                case 'yesterday': {
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    startStr = formatLocalDate(yesterday);
                    endStr = startStr;
                    break;
                }
                case 'this_week': {
                    const day = now.getDay() || 7;
                    const monday = new Date(now);
                    monday.setDate(monday.getDate() - (day - 1));
                    startStr = formatLocalDate(monday);
                    break;
                }
                case 'last_week': {
                    const day = now.getDay() || 7;
                    const prevMonday = new Date(now);
                    prevMonday.setDate(prevMonday.getDate() - (day - 1) - 7);
                    const prevSunday = new Date(prevMonday);
                    prevSunday.setDate(prevSunday.getDate() + 6);
                    startStr = formatLocalDate(prevMonday);
                    endStr = formatLocalDate(prevSunday);
                    break;
                }
                case 'this_month':
                case 'mtd': {
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    startStr = formatLocalDate(firstDayOfMonth);
                    break;
                }
                case 'this_quarter': {
                    const quarter = Math.floor(now.getMonth() / 3);
                    const firstDayOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                    startStr = formatLocalDate(firstDayOfQuarter);
                    break;
                }
                case 'this_year':
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

    const filteredDeals = useMemo(() => {
        let result = [...deals];

        // 1. Date Filter
        if (dateFilter !== 'all') {
            const { start: startStr, end: endStr } = currentDateRangeStr;

            if (startStr) {
                result = result.filter(deal => {
                    const dealDateStr = deal.createdAt ? deal.createdAt.substring(0, 10) : '';
                    if (!dealDateStr) return false;

                    if (dateFilter === 'custom' && (!customRange.end || !endStr)) {
                        return dealDateStr >= startStr;
                    }
                    if (dateFilter === 'custom' && (!customRange.start || !startStr)) {
                        return endStr ? dealDateStr <= endStr : false;
                    }
                    return endStr ? (dealDateStr >= startStr && dealDateStr <= endStr) : dealDateStr >= startStr;
                });
            }
        }

        // 2. Column Filters & Chart Filters
        if (selectedSource) {
            result = result.filter(d => d.source === selectedSource);
        }
        if (selectedTopCustomer) {
            result = result.filter(d => d.customerName === selectedTopCustomer);
        }

        if (columnFilters.customer) {
            const search = columnFilters.customer.toLowerCase();
            result = result.filter(d =>
                d.customerName.toLowerCase().includes(search) ||
                d.title.toLowerCase().includes(search)
            );
        }

        if (columnFilters.stage !== 'all') {
            result = result.filter(d => getMappedStageInfo(d.stage).stage === columnFilters.stage);
        }

        if (columnFilters.owner) {
            const search = columnFilters.owner.toLowerCase();
            result = result.filter(d => {
                const ownerName = (d.ownerName || users.find(u => u.id === d.ownerId)?.name || '').toLowerCase();
                return ownerName.includes(search);
            });
        }

        if (columnFilters.minValue) {
            result = result.filter(d => d.value >= Number(columnFilters.minValue));
        }
        if (columnFilters.maxValue) {
            result = result.filter(d => d.value <= Number(columnFilters.maxValue));
        }

        if (columnFilters.maxProb) {
            result = result.filter(d => d.probability <= Number(columnFilters.maxProb));
        }

        // 3. Forecast Month Filter
        if (forecastMonthFilter) {
            result = result.filter(d => {
                if (!d.expectedCloseDate) return false;
                const closeDate = new Date(d.expectedCloseDate);
                return closeDate.getMonth() === forecastMonthFilter.getMonth() &&
                    closeDate.getFullYear() === forecastMonthFilter.getFullYear();
            });
        }

        // 4. Team / Owner Filter
        if (!selectedTeam.includes('all') && selectedTeam.length > 0 && teamMembers) {
            const memberIds = teamMembers.map(m => m.PersonId);
            result = result.filter(d => memberIds.includes(d.ownerId));
        }

        if (!selectedOwner.includes('all') && selectedOwner.length > 0) {
            result = result.filter(d => selectedOwner.includes(d.ownerId));
        }

        // 5. Product Filter
        if (!selectedProduct.includes('all') && selectedProduct.length > 0) {
            result = result.filter(d => selectedProduct.includes(d.product));
        }

        // 6. Drilldown Filters from Dashboard Charts
        if (selectedDealType) {
            result = result.filter(d => d.dealTypeKey === selectedDealType);
        }

        return result;
    }, [dateFilter, customRange, deals, columnFilters, users, forecastMonthFilter, selectedTeam, teamMembers, selectedOwner, selectedProduct, selectedSource, selectedTopCustomer, selectedDealType]);

    // Deals specifically for the Forecast Component
    // (Ignores "Created Date" filter to show future pipeline, but respects Owner/Product/Value filters)
    const forecastDeals = useMemo(() => {
        let result = deals;

        if (columnFilters.minProb) result = result.filter(d => d.probability >= Number(columnFilters.minProb));
        if (columnFilters.maxProb) result = result.filter(d => d.probability <= Number(columnFilters.maxProb));

        // Global Filters (Team / Owner / Product)
        if (!selectedTeam.includes('all') && selectedTeam.length > 0 && teamMembers) {
            const memberIds = teamMembers.map(m => m.PersonId);
            result = result.filter(d => memberIds.includes(d.ownerId));
        }

        if (!selectedOwner.includes('all') && selectedOwner.length > 0) {
            result = result.filter(d => selectedOwner.includes(d.ownerId));
        }

        if (!selectedProduct.includes('all') && selectedProduct.length > 0) {
            result = result.filter(d => selectedProduct.includes(d.product));
        }

        // Exclude Won and Lost deals from Forecast
        result = result.filter(d => {
            const stageName = getMappedStageInfo(d.stage).stage;
            return stageName !== 'Kazanıldı' && stageName !== 'Kaybedildi';
        });

        return result;
    }, [deals, columnFilters, users, selectedTeam, teamMembers, selectedOwner, selectedProduct]);

    const [backendStats, setBackendStats] = useState<any>(null);

    useEffect(() => {
        let startDate: string | undefined;
        let endDate: string | undefined;

        const formatLocalDate = (d: Date) => {
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().substring(0, 10);
        };

        if (dateFilter !== 'all') {
            const now = new Date();
            const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let start = new Date(todayAtMidnight);
            let end = new Date(now);

            switch (dateFilter) {
                case 'today':
                    startDate = formatLocalDate(start);
                    break;
                case 'yesterday':
                    start.setDate(start.getDate() - 1);
                    end = new Date(todayAtMidnight);
                    end.setMilliseconds(-1);
                    startDate = formatLocalDate(start);
                    endDate = formatLocalDate(end);
                    break;
                case 'this_week': {
                    const day = now.getDay() || 7;
                    start.setDate(start.getDate() - (day - 1));
                    startDate = formatLocalDate(start);
                    break;
                }
                case 'last_week': {
                    const day = now.getDay() || 7;
                    start.setDate(start.getDate() - (day - 1) - 7);
                    end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    startDate = formatLocalDate(start);
                    endDate = formatLocalDate(end);
                    break;
                }
                case 'this_month':
                case 'mtd':
                    start.setDate(1);
                    startDate = formatLocalDate(start);
                    break;
                case 'this_quarter': {
                    const quarter = Math.floor(now.getMonth() / 3);
                    start.setMonth(quarter * 3, 1);
                    startDate = formatLocalDate(start);
                    break;
                }
                case 'this_year':
                case 'ytd':
                    start.setMonth(0, 1);
                    startDate = formatLocalDate(start);
                    break;
                case 'custom':
                    if (customRange.start) startDate = formatLocalDate(customRange.start);
                    if (customRange.end) endDate = formatLocalDate(customRange.end);
                    break;
            }
        }

        OpportunityService.getStats(
            startDate,
            endDate,
            selectedOwner.includes('all') ? undefined : selectedOwner,
            selectedTeam.includes('all') ? undefined : selectedTeam.filter(t => t !== 'all'),
            selectedProduct.includes('all') ? undefined : selectedProduct
        ).then(setBackendStats).catch(console.error);
    }, [dateFilter, customRange, selectedOwner, selectedTeam, selectedProduct]);

    const metrics = useMemo(() => {
        const openDeals = filteredDeals.filter(d => {
            const s = getMappedStageInfo(d.stage).stage;
            return s !== 'Kazanıldı' && s !== 'Kaybedildi';
        });
        const openCount = openDeals.length;

        if (backendStats) return { ...backendStats.metrics, openCount };

        const count = filteredDeals.length;
        const lost = filteredDeals.filter(d => getMappedStageInfo(d.stage).stage === 'Kaybedildi').reduce((s, d) => s + d.value, 0);
        const won = filteredDeals.filter(d => getMappedStageInfo(d.stage).stage === 'Kazanıldı').reduce((s, d) => s + d.value, 0);
        const open = openDeals.reduce((s, d) => s + d.value, 0);
        const total = won + open + lost;

        return { count, lost, won, open, total, openCount };
    }, [filteredDeals, backendStats]);

    const chartData = useMemo(() => {
        if (backendStats?.charts) {
            return {
                sourceCount: backendStats.charts.sourceCount,
                sourceRev: backendStats.charts.sourceRev,
                customerRev: backendStats.charts.customerRev,
                dealTypeRev: backendStats.charts.dealTypeRev || [],
                // Fallback for types not yet in backend
                ownerRev: [],
                topicRev: [],
                statusRev: []
            };
        }
        const dataMaps: Record<string, Record<string, number>> = {
            sourceCount: {}, sourceRev: {}, customerRev: {}, ownerRev: {}, topicRev: {}, statusRev: {}
        };

        filteredDeals.forEach(d => {
            dataMaps.sourceCount[d.source] = (dataMaps.sourceCount[d.source] || 0) + 1;
            dataMaps.sourceRev[d.source] = (dataMaps.sourceRev[d.source] || 0) + d.value;
            dataMaps.customerRev[d.customerName] = (dataMaps.customerRev[d.customerName] || 0) + d.value;
            const ownerName = d.ownerName || users.find(u => u.id === d.ownerId)?.name || 'Unknown';
            dataMaps.ownerRev[ownerName] = (dataMaps.ownerRev[ownerName] || 0) + d.value;
            dataMaps.topicRev[d.topic] = (dataMaps.topicRev[d.topic] || 0) + d.value;
            
            const mappedStageName = getMappedStageInfo(d.stage).stage;
            dataMaps.statusRev[mappedStageName] = (dataMaps.statusRev[mappedStageName] || 0) + d.value;
        });

        const sortAndLimit = (map: Record<string, number>, key: string) =>
            Object.entries(map)
                .map(([name, val]) => ({ name, [key]: val }))
                .sort((a, b) => (b[key] as number) - (a[key] as number))
                .slice(0, 8);

        // Local calculation for Deal Type distribution
        const dealTypeMap: Record<string, { count: number; revenue: number }> = {};
        filteredDeals.forEach(d => {
            const type = d.dealType || 'Diğer';
            if (!dealTypeMap[type]) dealTypeMap[type] = { count: 0, revenue: 0 };
            dealTypeMap[type].count += 1;
            dealTypeMap[type].revenue += d.value;
        });

        const dealTypeRev = Object.entries(dealTypeMap)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.revenue - a.revenue);

        return {
            sourceCount: sortAndLimit(dataMaps.sourceCount, 'count'),
            sourceRev: sortAndLimit(dataMaps.sourceRev, 'revenue'),
            customerRev: sortAndLimit(dataMaps.customerRev, 'revenue'),
            ownerRev: sortAndLimit(dataMaps.ownerRev, 'revenue'),
            topicRev: sortAndLimit(dataMaps.topicRev, 'revenue'),
            statusRev: sortAndLimit(dataMaps.statusRev, 'revenue'),
            dealTypeRev,
        };
    }, [filteredDeals, users, backendStats]);

    // Use filteredDeals for List/Kanban
    const sortedDeals = useMemo(() => {
        // Filter out Won and Lost deals from the list/kanban views
        let result = filteredDeals.filter(d => {
            const mappedStage = getMappedStageInfo(d.stage).stage;
            return mappedStage !== 'Kazanıldı' && mappedStage !== 'Kaybedildi';
        });

        if (sortConfig) {
            result.sort((a, b) => {
                let aVal: any;
                let bVal: any;

                if (sortConfig.key === 'ownerName') {
                    aVal = a.ownerName || users.find(u => u.id === a.ownerId)?.name || '';
                    bVal = b.ownerName || users.find(u => u.id === b.ownerId)?.name || '';
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

                <div className="flex flex-col md:flex-row gap-2 items-center">
                    {/* Team Filter */}
                    <MultiSelect
                        options={(teamsData || []).map(t => ({ label: t.Definition, value: t.Id }))}
                        selectedValues={selectedTeam}
                        onChange={setSelectedTeam}
                        icon={<Users size={16} className="text-slate-400" />}
                        allLabel={t('dashboardV2.filters.allTeams', { defaultValue: 'Tüm Takımlar' })}
                    />

                    {/* Owner / Person Filter */}
                    <MultiSelect
                        options={owners.map(u => ({ label: u.name, value: u.id }))}
                        selectedValues={selectedOwner}
                        onChange={setSelectedOwner}
                        icon={<Building2 size={16} className="text-slate-400" />}
                        allLabel={t('dashboardV2.filters.allPersons', { defaultValue: 'Tüm Kişiler' })}
                    />

                    {/* Product Filter */}
                    <MultiSelect
                        options={products.map(p => ({ label: p, value: p }))}
                        selectedValues={selectedProduct}
                        onChange={setSelectedProduct}
                        icon={<Package size={16} className="text-slate-400" />}
                        allLabel={t('dashboardV2.filters.allProducts', { defaultValue: 'Tüm Ürünler' })}
                    />

                    {/* Date Filter Buttons */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl items-center gap-1 overflow-x-auto scrollbar-hide">
                        {[
                            { label: t('dateFilters.today'), value: 'today' },
                            { label: t('dateFilters.thisWeek'), value: 'this_week' },
                            { label: t('dateFilters.thisMonth'), value: 'this_month' },
                            { label: t('dateFilters.thisQuarter'), value: 'this_quarter' },
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

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Potansiyel Ciro — Hero card (col-span-2) */}
                <div className="col-span-2 bg-indigo-50/80 dark:bg-indigo-900/30 backdrop-blur-md border border-indigo-200 dark:border-indigo-500/40 shadow-md shadow-indigo-500/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center min-h-[100px]">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-indigo-500 dark:text-indigo-400 font-bold mb-2">
                        {t('opportunities.pipelineRevenue')}
                    </span>
                    <span className="text-3xl lg:text-4xl font-light tracking-tight text-indigo-600 dark:text-indigo-300">
                        {formatCurrency(metrics.open)}
                    </span>
                    <span className="text-[10px] text-indigo-400 dark:text-indigo-500 mt-1.5">
                        {(metrics as any).openCount ?? '—'} Açık Fırsat
                    </span>
                </div>
                <StatCard label={t('opportunities.count')} value={metrics.count.toString()} colorClass="text-slate-900 dark:text-white font-medium" />
                <StatCard label={t('opportunities.lostDeals')} value={formatCurrency(metrics.lost)} colorClass="text-rose-600 dark:text-rose-400 font-medium" />
                <StatCard label={t('opportunities.wonDeals')} value={formatCurrency(metrics.won)} colorClass="text-emerald-600 dark:text-emerald-400 font-medium" />
                <StatCard label={t('opportunities.conversionRate')} value={metrics.won + metrics.lost > 0 ? `%${((metrics.won / (metrics.won + metrics.lost)) * 100).toFixed(1)}` : '%0'} colorClass="text-violet-600 dark:text-violet-400 font-medium" />
            </div>

            {/* AI Insight Strip */}
            <PipelineAIInsightPanel
                currentDeals={filteredDeals}
                allDeals={selectedProduct.includes('all') ? deals : deals.filter(d => selectedProduct.includes(d.product))}
                dateFilter={dateFilter}
                customRange={customRange}
                className="w-full"
            />

            {/* Charts & Pipeline */}
            <div className="space-y-6">
                {/* Pipeline Funnel — full width */}
                <div className="h-[600px]">
                    <FunnelChart deals={filteredDeals} />
                </div>

                {/* Owner Distribution — full width */}
                <OpportunityOwnerDistribution
                    dateRange={currentDateRangeStr}
                    teamId={selectedTeam.includes('all') ? undefined : selectedTeam.filter(t => t !== 'all')}
                    ownerId={selectedOwner.includes('all') ? undefined : selectedOwner}
                    product={selectedProduct.includes('all') ? undefined : selectedProduct}
                />

                {/* Product Performance Section */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">{t('opportunities.productPerformance')}</h3>
                    <ProductPerformance 
                        deals={filteredDeals} 
                        filters={{
                            dateFilter,
                            customRange,
                            teamId: selectedTeam.includes('all') ? undefined : selectedTeam.filter(t => t !== 'all'),
                            ownerId: selectedOwner.includes('all') ? undefined : selectedOwner,
                            product: selectedProduct.includes('all') ? undefined : selectedProduct
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <HorizontalBarChart
                        title={t('opportunities.charts.customerPotentialTitle')}
                        data={chartData.customerRev.map((item: any) => ({
                            id: item.name,
                            name: item.name,
                            value: item.revenue,
                            formattedValue: formatCurrency(item.revenue) + '₺'
                        }))}
                        color="#0ea5e9"
                        icon={Users}
                        insight={t('opportunities.charts.customerPotentialInsight')}
                        activeId={selectedTopCustomer}
                        onBarClick={(item) => setSelectedTopCustomer(prev => prev === item.id ? null : item.id)}
                    />

                    <LostReasonsDistribution
                        dateFilter={dateFilter}
                        customRange={customRange}
                        selectedOwner={selectedOwner}
                        selectedTeam={selectedTeam}
                    />

                    <HorizontalBarChart
                        title={t('opportunities.charts.dealTypeTitle')}
                        data={(chartData.dealTypeRev || []).map((item: any) => ({
                            id: item.typeId || item.name,
                            name: t(item.name),
                            value: item.revenue,
                            count: item.count,
                            formattedValue: formatCurrency(item.revenue) + '₺'
                        }))}
                        color="#8b5cf6"
                        icon={Share2}
                        insight={t('opportunities.charts.dealTypeInsight')}
                        activeId={selectedDealType}
                        onBarClick={(item) => setSelectedDealType(prev => prev === item.id ? null : item.id)}
                    />

                </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-600 my-8"></div>

            {/* Forecast Section */}
            <OpportunityForecast
                deals={forecastDeals}
                onMonthClick={handleForecastMonthClick}
                activeFilterMonth={forecastMonthFilter}
            />

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
                                <div className="flex items-center gap-3">
                                    {selectedDealType && (
                                        <button 
                                            onClick={() => setSelectedDealType(null)}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-[10px] font-bold transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
                                            title="Filtreyi Temizle"
                                        >
                                            Fırsat Tipi Filtresi Aktif
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    )}
                                    <span className="text-xs text-slate-400 font-mono font-bold uppercase">{t('performance.listingDetails_short', { count: sortedDeals.length, defaultValue: `${sortedDeals.length} Kayıt` })}</span>
                                </div>
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
                                            { label: t('opportunities.closeDate', 'Tahmini Kapanış'), key: 'expectedCloseDate' as const },
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
                                                {STAGE_CONFIG.map(s => (
                                                    <option key={s.stage} value={s.stage}>{s.stage}</option>
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
                                            {/* Date filter placeholder or actual date picker could go here */}
                                        </th>
                                        <th className="p-2 border-r border-slate-100 dark:border-white/5">
                                            <input
                                                type="text"
                                                placeholder={`${t('opportunities.owner', 'Sorumlu')}...`}
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
                                                    <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold text-white shadow-sm" style={{ backgroundColor: getMappedStageInfo(deal.stage).color }}>
                                                        {getMappedStageInfo(deal.stage).stage}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full" style={{ width: `${getMappedStageInfo(deal.stage).probability}%`, backgroundColor: getMappedStageInfo(deal.stage).color }}></div>
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-400 font-mono">%{getMappedStageInfo(deal.stage).probability}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono font-medium text-[13px] text-slate-700 dark:text-slate-300">
                                                    ₺{(deal.value).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            {new Date(deal.expectedCloseDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {t('opportunities.expectations', 'Tahmini')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                                            {(deal.ownerName || user?.name || '?').charAt(0)}
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-400">{deal.ownerName || user?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleOpenResponseModal(deal)}
                                                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors group/ai"
                                                        title={t('opportunities.aiResponse', 'AI Yanıt Oluştur')}
                                                    >
                                                        <Sparkles size={16} className="group-hover/ai:scale-110 transition-transform" />
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {deal.healthScore < 50 ? (
                                                        <div className="flex items-center justify-end gap-1 text-rose-500" title="Riskli">
                                                            <AlertCircle size={14} />
                                                            <span className="text-[10px] font-bold">{t('opportunities.riskLevels.high', 'RİSK')}</span>
                                                        </div>
                                                    ) : deal.healthScore > 80 ? (
                                                        <div className="flex items-center justify-end gap-1 text-emerald-500" title="İyi">
                                                            <CheckCircle2 size={14} />
                                                            <span className="text-[10px] font-bold">{t('opportunities.riskLevels.good', 'İYİ')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1 text-amber-500" title="Normal">
                                                            <Clock size={14} />
                                                            <span className="text-[10px] font-bold">{t('opportunities.riskLevels.normal', 'NORMAL')}</span>
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
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{t('opportunities.kanbanTitle', 'Fırsat Pano Görünümü')}</h3>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl items-center">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all text-slate-500 hover:text-slate-700"
                                    >{t('opportunities.listView', 'List')}</button>
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                    >{t('opportunities.kanbanView', 'Pano')}</button>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 font-mono font-bold uppercase">{t('performance.listingDetails_short', { count: sortedDeals.length, defaultValue: `${sortedDeals.length} Kayıt` })}</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {STAGE_CONFIG.filter(cfg => cfg.stage !== 'Kazanıldı' && cfg.stage !== 'Kaybedildi').map(config => {
                                const stageDeals = sortedDeals.filter(d => getMappedStageInfo(d.stage).stage === config.stage);
                                const totalVal = stageDeals.reduce((s, d) => s + d.value, 0);
                                const stageColor = config.color;

                                return (
                                    <div key={config.stage} className="flex flex-col gap-3 min-w-[300px] w-[300px] shrink-0">
                                        <div className="p-3 rounded-xl border border-slate-200 dark:border-white/5 sticky top-0 z-10 backdrop-blur-sm" style={{ backgroundColor: `${stageColor}15` }}>
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageColor }} />
                                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider">{config.stage}</h3>
                                                </div>
                                                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-100 dark:border-white/5">{stageDeals.length}</span>
                                            </div>
                                            <div className="text-[11px] font-mono font-bold" style={{ color: stageColor }}>₺{totalVal.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                                        </div>

                                        <div className="space-y-3 h-[500px] overflow-y-auto pr-1">
                                            {stageDeals.length === 0 && (
                                                <div className="h-20 border-2 border-dashed border-slate-100 dark:border-slate-600 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                                    {t('opportunities.noRecords', 'Kayıt Yok')}
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
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                                    {(deal.ownerName || users.find(u => u.id === deal.ownerId)?.name || '?').charAt(0)}
                                                                </div>
                                                                <span className="text-[10px] text-slate-500 truncate max-w-[80px]">{deal.ownerName || users.find(u => u.id === deal.ownerId)?.name || deal.ownerId}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">₺{(deal.value / 1000).toFixed(0)}k</div>
                                                                <div className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">{deal.probability}%</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenResponseModal(deal);
                                                            }}
                                                            className="w-full mt-3 py-1.5 flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Sparkles size={12} />
                                                            {t('opportunities.aiResponseLabel', 'AI Yanıt')}
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
