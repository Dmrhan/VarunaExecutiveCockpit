import React, { useMemo, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { MultiSelect } from '../../components/ui/MultiSelect';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard, FileText, ShoppingCart,
    CreditCard, Clock, Activity, AlertCircle,
    ChevronRight, TrendingUp, TrendingDown, X, Search, ArrowRight,
    Building2, Calendar, Target, Brain, Sparkles, Maximize2, Minimize2, Package
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { generateExecutiveBrief } from '../../services/ExecutiveBriefService';
import { GamifiedLeaderboard } from './GamifiedLeaderboard';
import { ProductSalesDistribution } from './ProductSalesDistribution';
import { CustomerPotentialChart } from './CustomerPotentialChart';

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
    // Deal-specific
    probability?: number;
    expectedCloseDate?: string;
    // Quote-specific
    product?: string;
    discount?: number;
    hasCompetitor?: boolean;
}

// Enhanced Mock Generator


// --- Components ---

const STAGE_BADGE: Record<string, string> = {
    'Teklif': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
    'Sözleşme': 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
    'Konumlama': 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700',
    'Demo': 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700',
    'Lead': 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    'Qualified': 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700',
    'Proposal': 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700',
    'Negotiation': 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
    'Kazanıldı': 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',
    'Kaybedildi': 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700',
};

const PRODUCT_BADGE: Record<string, { bg: string; text: string }> = {
    'EnRoute': { bg: '#DC2626', text: '#fff' },
    'Stokbar': { bg: '#1D4ED8', text: '#fff' },
    'Quest': { bg: '#15803D', text: '#fff' },
    'ServiceCore': { bg: '#7E22CE', text: '#fff' },
    'Varuna': { bg: '#CA8A04', text: '#fff' },
    'Hosting': { bg: '#475569', text: '#fff' },
    'Unidox': { bg: '#0284C7', text: '#fff' },
};

const QUOTE_STATUS_BADGE: Record<string, string> = {
    'Accepted': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Approved': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Sent': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Draft': 'bg-slate-100 text-slate-600 border border-slate-200',
    'Review': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Rejected': 'bg-red-50 text-red-600 border border-red-200',
    'Denied': 'bg-red-50 text-red-600 border border-red-200',
};

const DrillDownModal = ({ isOpen, onClose, title, rows, drilldownType }: { isOpen: boolean; onClose: () => void; title: string; rows: DrillDownRow[]; drilldownType?: string }) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ESC support
    React.useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const filtered = rows.filter(r =>
        `${r.title} ${r.subtitle} ${r.owner} ${r.status}`.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    const isDeals = drilldownType === 'deals';
    const isQuotes = drilldownType === 'quotes' || drilldownType === 'quotes_accepted';
    const isOrders = drilldownType === 'orders_open' || drilldownType === 'orders_closed';

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={cn(
                        "bg-white dark:bg-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-300",
                        isFullscreen ? "fixed inset-4" : "w-full max-w-6xl max-h-[85vh]"
                    )}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/70">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity size={18} className="text-indigo-500" />
                                {title}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} {t('dashboardV2.drilldown.records')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsFullscreen(f => !f)}
                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title={isFullscreen ? 'Küçült' : 'Tam Ekran'}
                            >
                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-shrink-0 px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('dashboardV2.drilldown.searchPlaceholder')}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/40 sticky top-0 z-10">
                                <tr>
                                    {isDeals && (
                                        <>
                                            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.customerAndDeals')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.stage')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.probability')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.value')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.estimatedClose')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.owner')}</th>
                                        </>
                                    )}
                                    {isQuotes && (
                                        <>
                                            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.quoteName')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.customer')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.product')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.status')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500 text-right">{t('dashboardV2.drilldown.columns.amount')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.risk')}</th>
                                        </>
                                    )}
                                    {isOrders && (
                                        <>
                                            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.orderName')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.customer')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500">{t('dashboardV2.drilldown.columns.condition')}</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500 text-right">{t('dashboardV2.drilldown.columns.amount')}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">{t('dashboardV2.drilldown.noResults')}</td></tr>
                                ) : filtered.map((row) => (
                                    <tr key={row.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer group transition-colors">

                                        {/* ===== DEALS ===== */}
                                        {isDeals && (
                                            <>
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-slate-800 dark:text-white text-sm leading-snug">{row.title}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Building2 size={10} />{row.subtitle}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide whitespace-nowrap', STAGE_BADGE[row.status] ?? 'bg-slate-100 text-slate-500 border border-slate-200')}>{row.status}</span>
                                                </td>
                                                <td className="px-4 py-3.5 min-w-[120px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${row.probability ?? 0}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-8 text-right">%{row.probability ?? 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{row.value}</td>
                                                <td className="px-4 py-3.5">
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Calendar size={11} />{row.expectedCloseDate ?? row.date}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{t('dashboardV2.drilldown.estimated')}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{row.owner.charAt(0)}</div>
                                                        <span className="text-xs text-slate-600 dark:text-slate-300">{row.owner}</span>
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {/* ===== QUOTES ===== */}
                                        {isQuotes && (() => {
                                            const pb = PRODUCT_BADGE[row.product ?? ''];
                                            const isRisky = (row.discount ?? 0) >= 20 || row.hasCompetitor;
                                            const riskLabel = row.hasCompetitor
                                                ? t('dashboardV2.drilldown.competitor')
                                                : (row.discount ?? 0) >= 20
                                                    ? `${t('dashboardV2.drilldown.highDiscount')} (${row.discount}%)`
                                                    : '';
                                            return (
                                                <>
                                                    <td className="px-5 py-3.5">
                                                        <div className="font-semibold text-slate-800 dark:text-white text-sm leading-snug">{row.title}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">ID: {row.id}</div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600">{row.subtitle.charAt(0)}</div>
                                                            <span className="text-xs text-slate-600 dark:text-slate-300">{row.subtitle}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {pb ? (
                                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
                                                                style={{ backgroundColor: pb.bg, color: pb.text }}>
                                                                {row.product}
                                                            </span>
                                                        ) : <span className="text-xs text-slate-400">{row.product ?? '-'}</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border', QUOTE_STATUS_BADGE[row.status] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
                                                            {row.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{row.value}</td>
                                                    <td className="px-4 py-3.5">
                                                        <div className={cn('flex items-center gap-1.5 text-xs font-semibold', isRisky ? 'text-amber-600' : 'text-emerald-600')}>
                                                            {isRisky ? (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                            ) : (
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                            )}
                                                            <span>{isRisky ? t('dashboardV2.drilldown.mediumRisk') : t('dashboardV2.drilldown.lowRisk')}</span>
                                                        </div>
                                                        {riskLabel && <div className="text-[10px] text-slate-400 mt-0.5">{riskLabel}</div>}
                                                    </td>
                                                </>
                                            );
                                        })()}

                                        {/* ===== ORDERS ===== */}
                                        {isOrders && (
                                            <>
                                                <td className="px-5 py-3.5">
                                                    <div className="font-semibold text-slate-800 dark:text-white text-sm leading-snug">{row.title}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">REF: {row.id}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600">{row.subtitle.charAt(0)}</div>
                                                        <span className="text-xs text-slate-600 dark:text-slate-300">{row.subtitle}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className={cn(
                                                        'px-2.5 py-1 rounded-full text-xs font-bold border',
                                                        row.status === 'Kapalı' || row.status === 'Faturalandı'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-sky-50 text-sky-700 border-sky-200'
                                                    )}>{row.status === 'Faturalandı' ? t('status.Closed').toUpperCase() : t('status.Open').toUpperCase()}</span>
                                                </td>
                                                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{row.value}</td>
                                            </>
                                        )}

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

const PipelineStep = ({ title, count, value, index, total, icon, iconColorClass = "text-slate-400", unit, trend, conversion, subMetric, onClick }: any) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex-1 min-w-[200px] flex flex-col justify-between py-5 px-5 bg-white rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:bg-slate-900",
                onClick ? "cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700/50 group" : ""
            )}
        >
            {/* Hover glow */}
            {onClick && <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ring-2 ring-indigo-400/20 pointer-events-none" />}

            {/* Content */}
            <div className="flex flex-col h-full justify-start relative z-10 gap-2">
                <div className="flex items-center justify-between w-full mb-1">
                    <p className="text-[11px] font-bold tracking-wide text-slate-400 capitalize">
                        {title}
                    </p>
                    {icon && (
                        <div className={cn("p-1", iconColorClass)}>
                            {icon}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1 my-1">
                    <div className="flex items-baseline gap-2">
                        <div className="text-[32px] font-medium text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                            {value}
                        </div>
                    </div>
                    {conversion && (
                        <div className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1 group relative cursor-help w-fit">
                            <span>Dönüşüm:</span>
                            <span className="text-slate-600 dark:text-slate-300 font-bold">%{conversion.percentage}</span>
                            <span>•</span>
                            <span>{conversion.value}</span>

                            {/* Tooltip */}
                            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-max opacity-0 transition-opacity group-hover:opacity-100 bg-slate-800 text-white text-[10px] rounded py-1 px-2 z-50">
                                {conversion.tooltipText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>
                    )}
                    {subMetric && subMetric}
                </div>

                <div className="flex justify-between items-center mt-auto w-full pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {count} {unit || 'KAYIT'}
                    </span>

                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center text-[10px] font-bold",
                            trend >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {trend >= 0 ? <TrendingUp size={12} className="mr-0.5" strokeWidth={2.5} /> : <TrendingDown size={12} className="mr-0.5" strokeWidth={2.5} />}
                            {trend >= 0 ? '+' : ''}{trend}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export function ExecutiveDashboardPageV2() {
    const { t } = useTranslation();
    const { deals, quotes, orders, users, contracts = [] } = useData();

    // Filters
    const [dateFilter, setDateFilter] = useState('all');
    // New Advanced Filters (Multiple Choice)
    const [selectedDepartment, setSelectedDepartment] = useState<string[]>(['all']);
    const [selectedOwner, setSelectedOwner] = useState<string[]>(['all']);
    const [selectedProduct, setSelectedProduct] = useState<string[]>(['all']);

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });


    // Derived Lists for Filters
    const departments = useMemo(() => Array.from(new Set(users.map(u => u.department))).filter(Boolean) as string[], [users]);
    const owners = useMemo(() => users.filter(u => u.role === 'sales_rep' || u.role === 'manager'), [users]);
    const products = useMemo(() => Array.from(new Set([
        ...deals.map(d => (d as any).product).filter(Boolean),
        ...orders.map(o => (o as any).product).filter(Boolean),
    ])) as string[], [deals, orders]);

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

        // 2. Filter by Team (Department)
        if (!selectedDepartment.includes('all') && selectedDepartment.length > 0) {
            const usersInSelectedDepts = users.filter(u => u.department && selectedDepartment.includes(u.department)).map(u => u.id);
            filteredDeals = filteredDeals.filter(d => usersInSelectedDepts.includes(d.ownerId));
            // Since quotes/orders are generated/linked to deals, we filter them implicitly or explicitly
            // For explicitly:
            filteredQuotes = filteredQuotes.filter(q => q.salesRepId && usersInSelectedDepts.includes(q.salesRepId));
            filteredOrders = filteredOrders.filter(o => o.salesRepId && usersInSelectedDepts.includes(o.salesRepId));
        }

        // 3. Filter by Owner (Person)
        if (!selectedOwner.includes('all') && selectedOwner.length > 0) {
            filteredDeals = filteredDeals.filter(d => selectedOwner.includes(d.ownerId));
            filteredQuotes = filteredQuotes.filter(q => q.salesRepId && selectedOwner.includes(q.salesRepId));
            filteredOrders = filteredOrders.filter(o => o.salesRepId && selectedOwner.includes(o.salesRepId));
        }

        // 4. Filter by Product
        if (!selectedProduct.includes('all') && selectedProduct.length > 0) {
            filteredDeals = filteredDeals.filter(d => selectedProduct.includes((d as any).product));
            filteredQuotes = filteredQuotes.filter(q => selectedProduct.includes((q as any).product));
            filteredOrders = filteredOrders.filter(o => selectedProduct.includes((o as any).product));
        }

        return { deals: filteredDeals, quotes: filteredQuotes, orders: filteredOrders };
    }, [deals, quotes, orders, dateFilter, customRange, selectedDepartment, selectedOwner, selectedProduct, users]);

    // Drilldown State (after filteredData to allow dependency)
    const [drilldownType, setDrilldownType] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    // Build drilldown rows from real filtered data
    const drilldownRows = useMemo((): DrillDownRow[] => {
        const fmt = (v: number) => {
            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M \u20ba`;
            if (v >= 1000) return `${(v / 1000).toFixed(0)}K \u20ba`;
            return `${v} \u20ba`;
        };
        const ownerName = (id: string) => users.find(u => u.id === id)?.name ?? id;

        if (drilldownType === 'deals') {
            return filteredData.deals
                .filter(d => !['Lost', 'Kaybedildi'].includes(d.stage))
                .map(d => ({
                    id: d.id,
                    title: d.title,
                    subtitle: d.customerName,
                    owner: ownerName(d.ownerId),
                    status: d.stage,
                    statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
                    date: new Date(d.createdAt).toLocaleDateString('tr-TR'),
                    value: fmt(d.value),
                    probability: d.probability,
                    expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : undefined,
                }));
        }
        if (drilldownType === 'quotes') {
            return filteredData.quotes.map((q: any) => ({
                id: q.id,
                title: q.title ?? `Teklif #${q.id}`,
                subtitle: q.customerName ?? '-',
                owner: q.salesRepName ?? ownerName(q.salesRepId ?? q.ownerId),
                status: q.status,
                statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
                date: q.createdAt ? new Date(q.createdAt).toLocaleDateString('tr-TR') : '-',
                value: fmt(q.amount),
                product: q.product,
                discount: q.discount,
                hasCompetitor: q.hasCompetitor,
            }));
        }
        if (drilldownType === 'quotes_accepted') {
            return filteredData.quotes
                .filter((q: any) => ['Accepted', 'Approved'].includes(q.status))
                .map((q: any) => ({
                    id: q.id,
                    title: q.title ?? `Teklif #${q.id}`,
                    subtitle: q.customerName ?? '-',
                    owner: q.salesRepName ?? ownerName(q.salesRepId ?? q.ownerId),
                    status: q.status,
                    statusColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    date: q.createdAt ? new Date(q.createdAt).toLocaleDateString('tr-TR') : '-',
                    value: fmt(q.amount),
                    product: q.product,
                    discount: q.discount,
                    hasCompetitor: q.hasCompetitor,
                }));
        }
        if (drilldownType === 'orders_open') {
            return filteredData.orders
                .filter((o: any) => o.status === 'Open')
                .map((o: any) => ({
                    id: o.id,
                    title: o.title ?? `Sipariş #${o.id}`,
                    subtitle: o.customerName ?? o.product ?? '-',
                    owner: ownerName(o.salesRepId ?? o.ownerId),
                    status: 'Açık',
                    statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
                    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : '-',
                    value: fmt(o.amount)
                }));
        }
        if (drilldownType === 'orders_closed') {
            return filteredData.orders
                .filter((o: any) => o.status === 'Closed')
                .map((o: any) => ({
                    id: o.id,
                    title: o.title ?? `Sipariş #${o.id}`,
                    subtitle: o.customerName ?? o.product ?? '-',
                    owner: ownerName(o.salesRepId ?? o.ownerId),
                    status: 'Faturalandı',
                    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('tr-TR') : '-',
                    value: fmt(o.amount)
                }));
        }
        return [];
    }, [drilldownType, filteredData, users]);

    const drilldownTitle: Record<string, string> = {
        deals: t('dashboardV2.pipeline.totalOpportunities'),
        quotes: t('dashboardV2.pipeline.quotesSent'),
        quotes_accepted: t('dashboardV2.pipeline.acceptedQuotes'),
        orders_open: t('dashboardV2.pipeline.openOrders'),
        orders_closed: t('dashboardV2.pipeline.invoiced'),
    };

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

    // Calculate AI Narrative based on filtered deals
    const { narrativeParams } = useMemo(() => generateExecutiveBrief(filteredData.deals, contracts, t), [filteredData.deals, contracts, t]);

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

                        {/* Department / Team Filter */}
                        <MultiSelect
                            options={departments.map(d => ({ label: d, value: d }))}
                            selectedValues={selectedDepartment}
                            onChange={setSelectedDepartment}
                            allLabel={t('dashboardV2.filters.allTeams')}
                        />

                        {/* Owner / Person Filter */}
                        <MultiSelect
                            options={owners.map(u => ({ label: u.name, value: u.id }))}
                            selectedValues={selectedOwner}
                            onChange={setSelectedOwner}
                            icon={<Building2 size={16} className="text-slate-400" />}
                            allLabel={t('dashboardV2.filters.allPersons')}
                        />

                        {/* Product Filter */}
                        <MultiSelect
                            options={products.map(p => ({ label: p, value: p }))}
                            selectedValues={selectedProduct}
                            onChange={setSelectedProduct}
                            icon={<Package size={16} className="text-slate-400" />}
                            allLabel={t('dashboardV2.filters.allProducts')}
                        />

                        {/* Date Filters */}
                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 items-center gap-1">
                            {['this_week', 'this_month', 'ytd', 'all'].map(key => (
                                <button
                                    key={key}
                                    onClick={() => setDateFilter(key)}
                                    className={cn(
                                        "px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-lg transition-all",
                                        dateFilter === key
                                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {t(`dateFilters.${key === 'this_week' ? 'thisWeek' : key === 'this_month' ? 'thisMonth' : key === 'ytd' ? 'ytd' : 'all'}`, { defaultValue: key })}
                                </button>
                            ))}
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                            <button
                                onClick={() => { setDateFilter('custom'); setShowDatePicker(true); }}
                                className={cn(
                                    "px-3 py-2 text-xs font-medium uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5",
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



                {/* Pipeline Flow - Filtered Data */}
                <div className="w-full overflow-x-auto pb-6 pt-2">
                    <div className="flex flex-row w-full min-w-[1000px] gap-3">
                        <PipelineStep
                            title={t('dashboardV2.pipeline.totalOpportunities')}
                            count={filteredData.deals.filter(d => !['Lost', 'Kaybedildi'].includes(d.stage)).length}
                            value={`${(filteredData.deals.filter(d => !['Lost', 'Kaybedildi'].includes(d.stage)).reduce((s, d) => s + d.value, 0) / 1000000).toFixed(1)}M ₺`}
                            index={0} total={6}
                            icon={<Target size={16} strokeWidth={2.5} />}
                            iconColorClass="text-amber-500"
                            unit={t('dashboardV2.pipeline.oppUnit')}
                            trend={12}
                            onClick={() => setDrilldownType('deals')}
                        />
                        <PipelineStep
                            title={t('dashboardV2.pipeline.quotesSent')}
                            count={filteredData.quotes.length}
                            value={`${(filteredData.quotes.reduce((s, q) => s + q.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={1} total={6}
                            icon={<FileText size={16} strokeWidth={2.5} />}
                            iconColorClass="text-blue-500"
                            unit={t('dashboardV2.pipeline.quoteUnit')}
                            trend={8}
                            onClick={() => setDrilldownType('quotes')}
                        />
                        <PipelineStep
                            title={t('dashboardV2.pipeline.conversionRate')}
                            count=""
                            value={`%${((filteredData.quotes.reduce((s, q) => s + q.amount, 0) / (filteredData.deals.filter(d => !['Lost', 'Kaybedildi'].includes(d.stage)).reduce((s, d) => s + d.value, 0) || 1)) * 100).toFixed(1)}`}
                            index={2} total={6}
                            icon={<Activity size={16} strokeWidth={2.5} />}
                            iconColorClass="text-emerald-500"
                            unit={t('dashboardV2.pipeline.revenueBased')}
                            trend={5}
                            subMetric={
                                <div className="mt-1 flex flex-col gap-0.5 w-fit">
                                    <div className="text-[11px] font-medium text-slate-400 mt-1">
                                        {t('dashboardV2.pipeline.countConversion')}: <span className="text-slate-500 font-bold">%{(filteredData.quotes.length / (filteredData.deals.filter(d => !['Lost', 'Kaybedildi'].includes(d.stage)).length || 1) * 100).toFixed(1)}</span>
                                    </div>
                                </div>
                            }
                        />
                        <PipelineStep
                            title={t('dashboardV2.pipeline.acceptedQuotes')}
                            count={filteredData.quotes.filter(q => ['Accepted', 'Approved'].includes(q.status)).length}
                            value={`${(filteredData.quotes.filter(q => ['Accepted', 'Approved'].includes(q.status)).reduce((s, q) => s + q.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={3} total={6}
                            icon={<AlertCircle size={16} strokeWidth={2.5} />}
                            iconColorClass="text-indigo-500"
                            unit={t('dashboardV2.pipeline.quoteUnit')}
                            trend={-3}
                            subMetric={
                                <div className="mt-1 flex flex-col gap-0.5 w-fit">
                                    <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                        <span>{t('dashboardV2.pipeline.winRate')} :</span>
                                        <span className="text-slate-600 dark:text-slate-300 font-bold">%{((filteredData.quotes.filter(q => ['Accepted', 'Approved'].includes(q.status)).reduce((s, q) => s + q.amount, 0) / (filteredData.quotes.reduce((s, q) => s + q.amount, 0) || 1)) * 100).toFixed(1)}</span>
                                    </div>
                                </div>
                            }
                            onClick={() => setDrilldownType('quotes_accepted')}
                        />
                        <PipelineStep
                            title={t('dashboardV2.pipeline.openOrders')}
                            count={filteredData.orders.filter(o => o.status === 'Open').length}
                            value={`${(filteredData.orders.filter(o => o.status === 'Open').reduce((s, o) => s + o.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={4} total={6}
                            icon={<ShoppingCart size={16} strokeWidth={2.5} />}
                            iconColorClass="text-purple-500"
                            unit={t('dashboardV2.pipeline.orderUnit')}
                            trend={15}
                            onClick={() => setDrilldownType('orders_open')}
                        />
                        <PipelineStep
                            title={t('dashboardV2.pipeline.invoiced')}
                            count={filteredData.orders.filter(o => o.status === 'Closed').length}
                            value={`${(filteredData.orders.filter(o => o.status === 'Closed').reduce((s, o) => s + o.amount, 0) / 1000000).toFixed(1)}M ₺`}
                            index={5} total={6}
                            icon={<CreditCard size={16} strokeWidth={2.5} />}
                            iconColorClass="text-emerald-500"
                            unit="SİPARİŞ"
                            trend={2}
                            onClick={() => setDrilldownType('orders_closed')}
                        />
                    </div>
                </div>

                {/* Gamified Leaderboard & Product Distribution */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <GamifiedLeaderboard deals={filteredData.deals} orders={filteredData.orders} />
                    <div className="flex flex-col gap-8 h-full">
                        <div className="flex-1">
                            <ProductSalesDistribution orders={filteredData.orders} />
                        </div>
                        <div className="flex-1">
                            <CustomerPotentialChart deals={filteredData.deals} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pipeline Drilldown Modal */}
            <DrillDownModal
                isOpen={!!drilldownType}
                onClose={() => setDrilldownType(null)}
                title={drilldownType ? drilldownTitle[drilldownType] : ''}
                rows={drilldownRows}
                drilldownType={drilldownType ?? undefined}
            />
        </div>
    );
}
