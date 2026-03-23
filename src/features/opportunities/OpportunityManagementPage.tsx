
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OpportunityService, type ODataParams } from '../../services/OpportunityService';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Deal } from '../../types/crm';
import { OpportunityDetailDrawer } from './OpportunityDetailDrawer';
import { useData } from '../../context/DataContext';

const PARAM_DEFAULTS: ODataParams = {
    $top: 10,
    $skip: 0,
    $orderby: 'created_at desc',
    $count: true
};

interface OpportunityManagementPageProps {
    onAddOpportunity?: () => void;
}

export const OpportunityManagementPage: React.FC<OpportunityManagementPageProps> = ({ onAddOpportunity }) => {
    const { users } = useData();
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

    const [dateFilter, setDateFilter] = useState('all');
    const [selectedOwner, setSelectedOwner] = useState<string>('all');

    // Calculate dates based on filter
    const getDateRange = () => {
        if (dateFilter === 'all') return { startDate: undefined, endDate: undefined };
        const formatLocalDate = (d: Date) => {
            const pad = (n: number) => n < 10 ? '0' + n : n;
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        };
        const now = new Date();
        const todayStr = formatLocalDate(now);
        let startStr = todayStr;
        let endStr = todayStr;

        if (dateFilter === 'this_month') {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            startStr = formatLocalDate(firstDayOfMonth);
        } else if (dateFilter === 'this_year') {
            const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
            startStr = formatLocalDate(firstDayOfYear);
        }
        return { startDate: startStr, endDate: endStr };
    };

    const { startDate, endDate } = getDateRange();

    // Derived ODATA params
    const queryParams: ODataParams = {
        ...PARAM_DEFAULTS,
        $skip: page * (PARAM_DEFAULTS.$top || 10),
        $filter: search ? `contains(title, '${search}') or contains(customer_name, '${search}')` : undefined,
        startDate,
        endDate,
        ownerId: selectedOwner !== 'all' ? selectedOwner : undefined
    };

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['opportunities', queryParams],
        queryFn: () => OpportunityService.getList(queryParams),
        placeholderData: (previousData) => previousData // Keep previous data while fetching new
    });

    const totalCount = data?.['@odata.count'] || 0;
    const totalPages = Math.ceil(totalCount / (PARAM_DEFAULTS.$top || 10));

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0); // Reset to first page on search
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen text-slate-900 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Opportunity Management</h1>
                    <p className="text-slate-500 text-sm">Manage pipeline, contacts, and deal stages.</p>
                </div>
                {onAddOpportunity && (
                    <button
                        onClick={onAddOpportunity}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Fırsat
                    </button>
                )}
            </div>

            {/* Filters & Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search opportunities..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>
                <div className="flex gap-2">
                    <select
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">Tüm Zamanlar</option>
                        <option value="this_month">Bu Ay</option>
                        <option value="this_year">Bu Yıl</option>
                    </select>

                    <select
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedOwner}
                        onChange={(e) => setSelectedOwner(e.target.value)}
                    >
                        <option value="all">Tüm Sorumlular</option>
                        {users?.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>

                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <Filter size={18} />
                        Filtreler
                    </button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-slate-600">Title</th>
                                <th className="px-6 py-3 font-medium text-slate-600">Customer</th>
                                <th className="px-6 py-3 font-medium text-slate-600">Value</th>
                                <th className="px-6 py-3 font-medium text-slate-600">Stage</th>
                                <th className="px-6 py-3 font-medium text-slate-600">Owner</th>
                                <th className="px-6 py-3 font-medium text-slate-600">Expected Close</th>
                                <th className="px-6 py-3 font-medium text-slate-600">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-2 text-slate-500">
                                            <Loader2 className="animate-spin" size={20} />
                                            Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-red-500">
                                        Error loading data: {(error as Error).message}
                                    </td>
                                </tr>
                            ) : data?.value.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No opportunities found.
                                    </td>
                                </tr>
                            ) : (
                                data?.value.map((deal: Deal) => (
                                    <tr
                                        key={deal.id}
                                        onClick={() => setSelectedOpportunityId(deal.id)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 font-medium text-indigo-600 group-hover:text-indigo-700">
                                            {deal.title}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{deal.customerName}</td>
                                        <td className="px-6 py-4 text-slate-700 font-mono">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: deal.currency }).format(deal.value)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${deal.stage === 'Kazanıldı' ? 'bg-emerald-100 text-emerald-700' :
                                                    deal.stage === 'Kaybedildi' ? 'bg-red-100 text-red-700' :
                                                        'bg-blue-100 text-blue-700'}`}>
                                                {deal.stage}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {/* Simulate owner name lookup if needed, checking ID for now or map if we had users list */}
                                            User {deal.ownerId}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${deal.healthScore > 70 ? 'bg-emerald-500' : deal.healthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${deal.healthScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">{deal.healthScore}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-medium">{Math.min((page * 10) + 1, totalCount)}</span> to <span className="font-medium">{Math.min((page + 1) * 10, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Drawer */}
            {selectedOpportunityId && (
                <OpportunityDetailDrawer
                    opportunityId={selectedOpportunityId}
                    onClose={() => setSelectedOpportunityId(null)}
                />
            )}
        </div>
    );
};
