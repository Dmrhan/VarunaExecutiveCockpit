import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { cn } from '../../lib/utils';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import {
    Sparkles, Search, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon,
    MoreHorizontal, AlertTriangle, CheckCircle, Calendar, Target,
    XCircle, CheckCircle2, Clock, Users, TrendingUp, Package, BarChart2, X
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer
} from 'recharts';
import { QuoteProductPerformance } from './QuoteProductPerformance';
import type { Quote, QuoteStatus, ProductGroup } from '../../types/crm';
import { PRODUCT_COLORS } from '../../data/mockData';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

const Q_STATUS_TR: Record<string, string> = {
    '1': 'Taslak',
    '2': 'Değ. Gerekiyor',
    '3': 'Değ. Alındı',
    '4': 'Onaylandı',
    '5': 'Reddedildi',
    '6': 'Gönderildi',
    '7': 'Kabul Edildi',
    '8': 'İptal Edildi',
    '9': 'Kaybedildi',
    '10': 'Kısmen Sipariş',
};

const statusBarColor = (code: string): string => {
    if (['4', '7', '10'].includes(code)) return '#0d9488'; // teal  — won
    if (['5', '8', '9'].includes(code)) return '#f43f5e';  // rose  — lost
    return '#6366f1';                                       // indigo — open
};

const calculateQuoteRisk = (quote: Quote) => {
    let score = 0;
    const reasons: string[] = [];

    const daysOpen = Math.floor((Date.now() - new Date(quote.createdAt).getTime()) / 86400000);
    if (daysOpen > 30 && ['1', '2', '3', '6'].includes(String(quote.status))) {
        score += 30;
        reasons.push(`Open for ${daysOpen} days`);
    }
    if (quote.lastActivityDate) {
        const daysInactive = Math.floor((Date.now() - new Date(quote.lastActivityDate).getTime()) / 86400000);
        if (daysInactive > 14) { score += 20; reasons.push(`Inactive for ${daysInactive} days`); }
    } else {
        score += 10;
    }
    if (quote.discount && quote.discount > 20) { score += 25; reasons.push(`High Discount (${quote.discount}%)`); }
    if (quote.hasCompetitor) { score += 25; reasons.push('Competitor Presence'); }

    let level: 'Low' | 'Medium' | 'High' = 'Low';
    if (score >= 60) level = 'High';
    else if (score >= 30) level = 'Medium';
    return { score, level, reasons };
};

const statusColors: Record<string, string> = {
    '1': "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
    '2': "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    '3': "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
    '4': "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    '5': "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    '6': "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    '7': "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    '8': "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    '9': "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
    '10': "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
};

const statusSolidColors: Record<string, string> = {
    '1': "bg-slate-400", '2': "bg-indigo-400", '3': "bg-indigo-400",
    '4': "bg-emerald-600", '5': "bg-rose-500", '6': "bg-blue-500",
    '7': "bg-emerald-500", '8': "bg-rose-600", '9': "bg-slate-600", '10': "bg-emerald-500",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type CrossFilter = {
    owner: string | null;
    product: string | null;
    customer: string | null;
    status: string | null;
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({
    label, amount, count, colorClass, icon: Icon, barColor
}: {
    label: string; amount: number; count: number;
    colorClass: string; icon: React.ElementType; barColor: string;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col shadow-sm"
    >
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">{label}</span>
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${barColor}20` }}>
                <Icon size={14} style={{ color: barColor }} />
            </div>
        </div>
        <span className={`text-2xl font-light tracking-tight ${colorClass}`}>{formatCurrency(amount)}₺</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">{count} Teklif</span>
        <div className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-slate-600 overflow-hidden">
            <div className="h-full rounded-full" style={{ backgroundColor: barColor, width: '100%', opacity: 0.6 }} />
        </div>
    </motion.div>
);

// ─── Cross-Filter Bar Chart Card ─────────────────────────────────────────────

const BarChartCard = ({
    title, icon: Icon, items, mode, onModeChange, barColor, emptyText, activeItem, onItemClick, getBarColor
}: {
    title: string;
    icon: React.ElementType;
    items: { name: string; amount: number; count: number }[];
    mode: 'amount' | 'count';
    onModeChange: (m: 'amount' | 'count') => void;
    barColor: string;
    emptyText: string;
    activeItem?: string | null;
    onItemClick?: (name: string) => void;
    getBarColor?: (name: string) => string;
}) => {
    const maxVal = Math.max(...items.map(i => mode === 'amount' ? i.amount : i.count), 1);
    const hasActive = !!activeItem;

    return (
        <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full">
            <CardHeader className="flex-shrink-0 border-b border-slate-100 dark:border-white/5 pb-4 bg-white/50 dark:bg-slate-700/50">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Icon size={16} className="text-indigo-500" />
                        {title}
                        {activeItem && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold">
                                FİLTRELİ
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex items-center bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                        <button
                            onClick={() => onModeChange('amount')}
                            className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-colors",
                                mode === 'amount' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                            )}
                        >CİRO (₺)</button>
                        <button
                            onClick={() => onModeChange('count')}
                            className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-colors",
                                mode === 'count' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                            )}
                        >ADET</button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">{emptyText}</div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item, idx) => {
                            const val = mode === 'amount' ? item.amount : item.count;
                            const pct = (val / maxVal) * 100;
                            const label = mode === 'amount' ? `${formatCurrency(item.amount)}₺` : `${item.count} Adet`;
                            const color = getBarColor ? getBarColor(item.name) : barColor;
                            const isActive = activeItem === item.name;
                            const isDimmed = hasActive && !isActive;
                            return (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: isDimmed ? 0.35 : 1, x: 0 }}
                                    transition={{ delay: idx * 0.03, opacity: { duration: 0.15 } }}
                                    onClick={() => onItemClick?.(item.name)}
                                    className={cn("transition-all", onItemClick && "cursor-pointer group")}
                                >
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span
                                            className={cn(
                                                "truncate pr-2 font-medium transition-colors",
                                                isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-700 dark:text-slate-300",
                                                onItemClick && "group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                                            )}
                                            title={item.name}
                                        >
                                            {item.name}
                                        </span>
                                        <span className="font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{label}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: color,
                                                opacity: isActive ? 1 : hasActive ? 0.5 : 0.85
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ─── Filter Chip ─────────────────────────────────────────────────────────────

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold"
    >
        <span>{label}</span>
        <button onClick={onRemove} className="ml-0.5 hover:text-rose-500 transition-colors">
            <X size={11} />
        </button>
    </motion.div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function QuotesDashboard() {
    const { t } = useTranslation();
    const { quotes } = useData();

    // ── Date state ──
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ── Cross-filter state ──
    const [crossFilter, setCrossFilter] = useState<CrossFilter>({ owner: null, product: null, customer: null, status: null });

    // ── Chart modes (per chart) ──
    const [ownerMode, setOwnerMode] = useState<'amount' | 'count'>('amount');
    const [customerMode, setCustomerMode] = useState<'amount' | 'count'>('amount');
    const [productMode, setProductMode] = useState<'amount' | 'count'>('amount');
    const [statusMode, setStatusMode] = useState<'amount' | 'count'>('amount');

    // ── Trend state ──
    const [trendMode, setTrendMode] = useState<'amount' | 'count'>('amount');

    // ── Table state ──
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Quote | 'customerName'; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState({
        title: '', customer: '', product: '', status: 'all', minValue: '', maxValue: '', risk: 'all',
    });

    useEffect(() => { setCurrentPage(1); }, [columnFilters, viewMode, crossFilter]);

    // toggle cross-filter dimension
    const toggleFilter = (dim: keyof CrossFilter, value: string) => {
        setCrossFilter(prev => ({ ...prev, [dim]: prev[dim] === value ? null : value }));
    };

    const clearFilter = (dim: keyof CrossFilter) => {
        setCrossFilter(prev => ({ ...prev, [dim]: null }));
    };

    const clearAllFilters = () => {
        setCrossFilter({ owner: null, product: null, customer: null, status: null });
    };

    const handleSort = (key: keyof Quote | 'customerName') => {
        setSortConfig(prev => {
            if (prev?.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            return { key, direction: 'asc' };
        });
    };

    const activeFilterCount = Object.values(crossFilter).filter(Boolean).length;

    // ── currentDateRangeStr (Fırsatlar pattern) ──
    const currentDateRangeStr = useMemo(() => {
        const fmt = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().substring(0, 10);
        const now = new Date();
        const today = fmt(now);
        let start = '', end = '';

        if (dateFilter !== 'all') {
            end = today;
            switch (dateFilter) {
                case 'today': start = today; break;
                case 'this_month': case 'mtd':
                    start = fmt(new Date(now.getFullYear(), now.getMonth(), 1)); break;
                case 'this_quarter':
                    start = fmt(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)); break;
                case 'this_year': case 'ytd':
                    start = fmt(new Date(now.getFullYear(), 0, 1)); break;
                case 'custom':
                    if (customRange.start) start = fmt(customRange.start);
                    if (customRange.end) end = fmt(customRange.end);
                    break;
            }
        }
        return { start: start || null, end: end || null };
    }, [dateFilter, customRange.start, customRange.end]);

    // ── baseQuotes: date + column filters ──
    const baseQuotes = useMemo(() => {
        let r = quotes;
        if (dateFilter !== 'all') {
            const { start, end } = currentDateRangeStr;
            if (start) r = r.filter(q => {
                const d = (q.createdAt || '').substring(0, 10);
                return d && (end ? d >= start && d <= end : d >= start);
            });
        }
        return r;
    }, [dateFilter, currentDateRangeStr, quotes]);

    // ── Cross-filter helpers ──
    const applyOwner    = (data: Quote[]) => crossFilter.owner    ? data.filter(q => (q.salesRepName || q.salesRepId || 'Bilinmiyor') === crossFilter.owner)    : data;
    const applyCustomer = (data: Quote[]) => crossFilter.customer ? data.filter(q => q.customerName === crossFilter.customer) : data;
    const applyProduct  = (data: Quote[]) => crossFilter.product  ? data.filter(q => q.product === crossFilter.product)       : data;
    const applyStatus   = (data: Quote[]) => crossFilter.status   ? data.filter(q => q.status === crossFilter.status)         : data;

    // Each chart's dataset excludes its own dimension filter
    const forOwnerChart    = useMemo(() => applyCustomer(applyProduct(applyStatus(baseQuotes))),  [baseQuotes, crossFilter.customer, crossFilter.product, crossFilter.status]);
    const forCustomerChart = useMemo(() => applyOwner(applyProduct(applyStatus(baseQuotes))),     [baseQuotes, crossFilter.owner, crossFilter.product, crossFilter.status]);
    const forProductChart  = useMemo(() => applyOwner(applyCustomer(applyStatus(baseQuotes))),    [baseQuotes, crossFilter.owner, crossFilter.customer, crossFilter.status]);
    const forStatusChart   = useMemo(() => applyOwner(applyCustomer(applyProduct(baseQuotes))),   [baseQuotes, crossFilter.owner, crossFilter.customer, crossFilter.product]);

    // Fully cross-filtered data (KPI, table, product performance)
    const crossFilteredQuotes = useMemo(
        () => applyOwner(applyCustomer(applyProduct(applyStatus(baseQuotes)))),
        [baseQuotes, crossFilter.owner, crossFilter.customer, crossFilter.product, crossFilter.status]
    );

    // ── KPI metrics (fully cross-filtered) ──
    const kpi = useMemo(() => {
        const rejected  = crossFilteredQuotes.filter(q => ['5', '8', '9'].includes(String(q.status)));
        const following = crossFilteredQuotes.filter(q => ['1', '2', '3', '6'].includes(String(q.status)));
        const approved  = crossFilteredQuotes.filter(q => ['4', '7', '10'].includes(String(q.status)));
        return {
            rejectedAmount:  rejected.reduce((s, q)  => s + q.amount, 0), rejectedCount:  rejected.length,
            followingAmount: following.reduce((s, q) => s + q.amount, 0), followingCount: following.length,
            approvedAmount:  approved.reduce((s, q)  => s + q.amount, 0), approvedCount:  approved.length,
            totalAmount: crossFilteredQuotes.reduce((s, q) => s + q.amount, 0), totalCount: crossFilteredQuotes.length,
        };
    }, [crossFilteredQuotes]);

    // ── Chart aggregations ──
    const aggregate = (data: Quote[], keyFn: (q: Quote) => string) => {
        const map: Record<string, { amount: number; count: number }> = {};
        data.forEach(q => {
            const k = keyFn(q) || 'Bilinmiyor';
            if (!map[k]) map[k] = { amount: 0, count: 0 };
            map[k].amount += q.amount;
            map[k].count  += 1;
        });
        return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount);
    };

    const ownerChartData    = useMemo(() => aggregate(forOwnerChart,    q => q.salesRepName || q.salesRepId || 'Bilinmiyor').slice(0, 10), [forOwnerChart]);
    const customerChartData = useMemo(() => aggregate(forCustomerChart, q => q.customerName).slice(0, 10),                                  [forCustomerChart]);
    const productChartData  = useMemo(() => aggregate(forProductChart,  q => q.product || 'Bilinmiyor').slice(0, 10),                       [forProductChart]);
    const statusChartData   = useMemo(() => {
        // Sort by status code order, not amount
        const order = ['1', '2', '3', '6', '4', '7', '10', '5', '8', '9'];
        return aggregate(forStatusChart, q => q.status)
            .sort((a, b) => {
                const ai = order.indexOf(a.name);
                const bi = order.indexOf(b.name);
                return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
            })
            .map(item => ({ ...item, name: item.name })); // keep code as name for getBarColor lookup
    }, [forStatusChart]);

    // For status chart display, we need both the code and the label
    const statusChartDisplayData = useMemo(() =>
        statusChartData.map(item => ({ ...item, displayName: Q_STATUS_TR[item.name] || item.name })),
        [statusChartData]
    );

    // ── Table ──
    const uniqueStatuses = useMemo(() => {
        const order: QuoteStatus[] = ['1', '2', '3', '6', '4', '7', '10', '5', '8', '9'] as any;
        const existing = Array.from(new Set(quotes.map(q => q.status)));
        return order.filter(s => existing.includes(s)).concat(existing.filter(s => !order.includes(s)));
    }, [quotes]);

    const tableQuotes = useMemo(() => {
        let r = crossFilteredQuotes;
        if (columnFilters.title)           r = r.filter(q => q.title.toLowerCase().includes(columnFilters.title.toLowerCase()));
        if (columnFilters.customer)        r = r.filter(q => q.customerName.toLowerCase().includes(columnFilters.customer.toLowerCase()));
        if (columnFilters.product)         r = r.filter(q => q.product.toLowerCase().includes(columnFilters.product.toLowerCase()));
        if (columnFilters.minValue)        r = r.filter(q => q.amount >= Number(columnFilters.minValue));
        if (columnFilters.maxValue)        r = r.filter(q => q.amount <= Number(columnFilters.maxValue));
        if (columnFilters.risk !== 'all')  r = r.filter(q => calculateQuoteRisk(q).level === columnFilters.risk);
        if (columnFilters.status !== 'all') r = r.filter(q => q.status === columnFilters.status);
        return r;
    }, [crossFilteredQuotes, columnFilters]);

    const sortedQuotes = useMemo(() => {
        const r = [...tableQuotes];
        if (sortConfig) {
            r.sort((a, b) => {
                const av: any = sortConfig.key === 'customerName' ? a.customerName.toLowerCase() : a[sortConfig.key];
                const bv: any = sortConfig.key === 'customerName' ? b.customerName.toLowerCase() : b[sortConfig.key];
                if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
                if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return r;
    }, [tableQuotes, sortConfig]);

    const paginatedQuotes = useMemo(() => sortedQuotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [sortedQuotes, currentPage, itemsPerPage]);
    const totalPages = Math.ceil(sortedQuotes.length / itemsPerPage);

    const datePresets = [
        { label: 'Bu Ay', value: 'mtd' },
        { label: 'Bu Çeyrek', value: 'this_quarter' },
        { label: 'YTD', value: 'ytd' },
        { label: 'Tümü', value: 'all' },
    ];

    // ── Trend granularity (tarih filtresine göre dinamik) ──
    const granularity = useMemo((): 'daily' | 'weekly' | 'monthly' => {
        switch (dateFilter) {
            case 'today':
            case 'mtd':
            case 'this_month':
                return 'daily';
            case 'this_quarter':
                return 'weekly';
            case 'ytd':
            case 'this_year':
            case 'all':
                return 'monthly';
            case 'custom': {
                if (!customRange.start || !customRange.end) return 'monthly';
                const days = Math.abs(customRange.end.getTime() - customRange.start.getTime()) / 86400000;
                if (days <= 60) return 'daily';
                if (days <= 180) return 'weekly';
                return 'monthly';
            }
            default: return 'monthly';
        }
    }, [dateFilter, customRange.start, customRange.end]);

    // ── Trend (client-side, cross-filter reactive) ──
    const TR_MONTHS_TREND = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    const trendData = useMemo(() => {
        const getISOWeek = (d: Date): string => {
            const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
            const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
            const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
            return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
        };

        const getPeriodKey = (dateStr: string): string => {
            const d10 = (dateStr || '').substring(0, 10);
            if (!d10 || d10.length < 10) return '';
            if (granularity === 'daily')   return d10;
            if (granularity === 'monthly') return d10.substring(0, 7);
            return getISOWeek(new Date(d10));
        };

        const getLabel = (period: string): string => {
            if (granularity === 'monthly' && period.length === 7) {
                const [year, month] = period.split('-');
                return `${TR_MONTHS_TREND[parseInt(month, 10) - 1]}'${year.slice(2)}`;
            }
            if (granularity === 'daily' && period.length === 10) {
                const parts = period.split('-');
                return `${parseInt(parts[2], 10)} ${TR_MONTHS_TREND[parseInt(parts[1], 10) - 1]}`;
            }
            if (granularity === 'weekly') {
                const wPart = period.includes('-W') ? period.split('-W')[1] : period;
                return `Hf${String(wPart).padStart(2, '0')}`;
            }
            return period;
        };

        const map: Record<string, { won: number; lost: number; open: number; wonAmount: number; lostAmount: number; openAmount: number }> = {};
        crossFilteredQuotes.forEach(q => {
            const period = getPeriodKey(q.createdAt || '');
            if (!period) return;
            if (!map[period]) map[period] = { won: 0, lost: 0, open: 0, wonAmount: 0, lostAmount: 0, openAmount: 0 };
            const s = String(q.status);
            const a = q.amount || 0;
            if (['4', '7', '10'].includes(s))     { map[period].won++;  map[period].wonAmount  += a; }
            else if (['5', '8', '9'].includes(s)) { map[period].lost++; map[period].lostAmount += a; }
            else                                   { map[period].open++; map[period].openAmount += a; }
        });

        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, v]) => ({ label: getLabel(period), ...v }));
    }, [crossFilteredQuotes, granularity]);

    // ── Chip labels ──
    const chipLabels: Partial<Record<keyof CrossFilter, string>> = {
        owner: crossFilter.owner ? `Sahip: ${crossFilter.owner}` : undefined,
        customer: crossFilter.customer ? `Müşteri: ${crossFilter.customer}` : undefined,
        product: crossFilter.product ? `Ürün: ${crossFilter.product}` : undefined,
        status: crossFilter.status ? `Statü: ${Q_STATUS_TR[crossFilter.status] || crossFilter.status}` : undefined,
    };

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateRangePicker
                    startDate={customRange.start}
                    endDate={customRange.end}
                    onChange={(s, e) => { setCustomRange({ start: s, end: e }); if (s && e) setDateFilter('custom'); }}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {/* Header + Date Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">
                        {t('quotes.title', { defaultValue: 'Teklifler' })}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {t('quotes.subtitle', { defaultValue: 'Teklif süreçlerini ve satış performansını analiz edin' })}
                    </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl items-center gap-1 overflow-x-auto scrollbar-hide">
                    {datePresets.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setDateFilter(f.value)}
                            className={cn(
                                "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                                dateFilter === f.value
                                    ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >{f.label}</button>
                    ))}
                    <button
                        onClick={() => { setShowDatePicker(true); setDateFilter('custom'); }}
                        className={cn(
                            "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap flex items-center gap-1",
                            dateFilter === 'custom'
                                ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <Calendar size={12} /> Özel
                    </button>
                </div>
            </div>

            {/* Active Cross-Filter Chips */}
            <AnimatePresence>
                {activeFilterCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Aktif Filtreler:</span>
                        <AnimatePresence mode="popLayout">
                            {(Object.keys(chipLabels) as Array<keyof CrossFilter>).map(dim =>
                                chipLabels[dim] ? (
                                    <FilterChip
                                        key={dim}
                                        label={chipLabels[dim]!}
                                        onRemove={() => clearFilter(dim)}
                                    />
                                ) : null
                            )}
                        </AnimatePresence>
                        <button
                            onClick={clearAllFilters}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                            Tümünü Temizle
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KPI Cards (react to all cross-filters) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Reddedildi"     amount={kpi.rejectedAmount}  count={kpi.rejectedCount}  colorClass="text-rose-600 dark:text-rose-400"    icon={XCircle}      barColor="#f43f5e" />
                <KpiCard label="Takip Ediliyor" amount={kpi.followingAmount} count={kpi.followingCount} colorClass="text-indigo-600 dark:text-indigo-400" icon={Clock}        barColor="#6366f1" />
                <KpiCard label="Onaylandı"      amount={kpi.approvedAmount}  count={kpi.approvedCount}  colorClass="text-teal-600 dark:text-teal-400"    icon={CheckCircle2} barColor="#0d9488" />
                <KpiCard label="Toplam"         amount={kpi.totalAmount}     count={kpi.totalCount}     colorClass="text-slate-700 dark:text-slate-200"  icon={Target}       barColor="#64748b" />
            </div>

            {/* Trend Chart */}
            <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm">
                <CardHeader className="flex-shrink-0 border-b border-slate-100 dark:border-white/5 pb-4 bg-white/50 dark:bg-slate-700/50">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-500" />
                            Teklif Trendi
                            <span className="ml-1 text-[9px] font-normal text-slate-400 normal-case tracking-normal">
                                ({granularity === 'daily' ? 'günlük' : granularity === 'weekly' ? 'haftalık' : 'aylık'})
                            </span>
                        </CardTitle>
                        <div className="flex items-center bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                            <button
                                onClick={() => setTrendMode('amount')}
                                className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-colors",
                                    trendMode === 'amount' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                                )}
                            >CİRO (₺)</button>
                            <button
                                onClick={() => setTrendMode('count')}
                                className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-colors",
                                    trendMode === 'count' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600"
                                )}
                            >ADET</button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {trendData.length === 0 ? (
                        <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
                            Seçili tarih aralığında trend verisi bulunamadı.
                        </div>
                    ) : (
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 9 }}
                                        dy={6}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        hide
                                        domain={['auto', 'auto']}
                                    />
                                    <RechartsTooltip
                                        cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                        content={({ active, payload, label: lbl }: any) => {
                                            if (!active || !payload?.length) return null;
                                            return (
                                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[10px] shadow-xl">
                                                    <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 pb-1 border-b border-slate-100 dark:border-slate-700">{lbl}</p>
                                                    {payload.map((p: any) => (
                                                        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                                <span className="text-slate-500">{p.name}</span>
                                                            </div>
                                                            <span className="font-bold" style={{ color: p.color }}>
                                                                {trendMode === 'amount' ? `${formatCurrency(p.value)}₺` : `${p.value} Adet`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={trendMode === 'amount' ? 'lostAmount' : 'lost'}
                                        name="Reddedildi"
                                        stroke="#f43f5e"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={trendMode === 'amount' ? 'openAmount' : 'open'}
                                        name="Takip Ediliyor"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={trendMode === 'amount' ? 'wonAmount' : 'won'}
                                        name="Onaylandı"
                                        stroke="#0d9488"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4 Cross-Filter Bar Charts (2×2 grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Owner */}
                <div className="h-[380px]">
                    <BarChartCard
                        title="Teklif Sahibine Göre"
                        icon={Users}
                        items={ownerChartData}
                        mode={ownerMode}
                        onModeChange={setOwnerMode}
                        barColor="#6366f1"
                        emptyText="Veri bulunamadı"
                        activeItem={crossFilter.owner}
                        onItemClick={name => toggleFilter('owner', name)}
                    />
                </div>

                {/* Customer */}
                <div className="h-[380px]">
                    <BarChartCard
                        title="Müşteriye Göre (Top 10)"
                        icon={TrendingUp}
                        items={customerChartData}
                        mode={customerMode}
                        onModeChange={setCustomerMode}
                        barColor="#0ea5e9"
                        emptyText="Veri bulunamadı"
                        activeItem={crossFilter.customer}
                        onItemClick={name => toggleFilter('customer', name)}
                    />
                </div>

                {/* Product */}
                <div className="h-[380px]">
                    <BarChartCard
                        title="Ürün Grubuna Göre"
                        icon={Package}
                        items={productChartData}
                        mode={productMode}
                        onModeChange={setProductMode}
                        barColor="#f97316"
                        emptyText="Veri bulunamadı"
                        activeItem={crossFilter.product}
                        onItemClick={name => toggleFilter('product', name)}
                    />
                </div>

                {/* Status */}
                <div className="h-[380px]">
                    <BarChartCard
                        title="Statüye Göre"
                        icon={BarChart2}
                        items={statusChartDisplayData.map(i => ({ name: i.displayName, amount: i.amount, count: i.count }))}
                        mode={statusMode}
                        onModeChange={setStatusMode}
                        barColor="#6366f1"
                        emptyText="Veri bulunamadı"
                        activeItem={crossFilter.status ? Q_STATUS_TR[crossFilter.status] : null}
                        onItemClick={displayName => {
                            // map display name back to status code
                            const code = Object.entries(Q_STATUS_TR).find(([, v]) => v === displayName)?.[0] ?? null;
                            if (code) toggleFilter('status', code);
                        }}
                        getBarColor={displayName => {
                            const code = Object.entries(Q_STATUS_TR).find(([, v]) => v === displayName)?.[0] ?? '';
                            return statusBarColor(code);
                        }}
                    />
                </div>
            </div>

            {/* Product Group Performance (cross-filtered) */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                    {t('orders.productPerformance', { defaultValue: 'Ürün Grubu Performansı' })}
                </h3>
                <QuoteProductPerformance quotes={crossFilteredQuotes} />
            </div>

            {/* Quote List / Kanban (cross-filtered) */}
            <Card className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                            {t('quotes.list.title')}
                            {activeFilterCount > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[9px]">
                                    {sortedQuotes.length} sonuç
                                </span>
                            )}
                        </h3>
                        <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded-md transition-all",
                                    viewMode === 'list' ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                                title={t('quotes.list.listView')}
                            ><ListIcon size={14} /></button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn("p-1.5 rounded-md transition-all",
                                    viewMode === 'kanban' ? "bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                )}
                                title={t('quotes.list.boardView')}
                            ><LayoutGrid size={14} /></button>
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
                                            {[
                                                { key: 'title' as const, label: t('quotes.table.name') },
                                                { key: 'customerName' as const, label: t('quotes.table.customer') },
                                                { key: 'product' as const, label: t('quotes.table.product', { defaultValue: 'Ürün' }) },
                                                { key: 'status' as const, label: t('quotes.table.status'), center: true },
                                                { key: 'amount' as const, label: t('quotes.table.amount'), right: true },
                                            ].map(col => (
                                                <th
                                                    key={col.key}
                                                    className={cn(
                                                        "py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors",
                                                        col.center && "text-center", col.right && "text-right", !col.center && !col.right && "text-left"
                                                    )}
                                                    onClick={() => handleSort(col.key)}
                                                >{col.label}</th>
                                            ))}
                                            <th className="text-center py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500">RISK</th>
                                            <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-slate-500">{t('quotes.table.actions')}</th>
                                        </tr>
                                        {/* Column filters row */}
                                        <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-slate-800/30">
                                            <th className="px-6 py-2">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                                    <input type="text" placeholder="Ara..." value={columnFilters.title}
                                                        onChange={e => setColumnFilters(p => ({ ...p, title: e.target.value }))}
                                                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </th>
                                            <th className="px-6 py-2">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                                    <input type="text" placeholder="Ara..." value={columnFilters.customer}
                                                        onChange={e => setColumnFilters(p => ({ ...p, customer: e.target.value }))}
                                                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </th>
                                            <th className="px-6 py-2">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                                                    <input type="text" placeholder="Ara..." value={columnFilters.product}
                                                        onChange={e => setColumnFilters(p => ({ ...p, product: e.target.value }))}
                                                        className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                    />
                                                </div>
                                            </th>
                                            <th className="px-6 py-2">
                                                <select value={columnFilters.status}
                                                    onChange={e => setColumnFilters(p => ({ ...p, status: e.target.value }))}
                                                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="all">Tümü</option>
                                                    {uniqueStatuses.map(s => (
                                                        <option key={s} value={s}>{t(`quotes.status.${s}`, { defaultValue: Q_STATUS_TR[s] || s })}</option>
                                                    ))}
                                                </select>
                                            </th>
                                            <th className="px-6 py-2">
                                                <div className="flex gap-1 items-center justify-end">
                                                    <input type="number" placeholder="Min" value={columnFilters.minValue}
                                                        onChange={e => setColumnFilters(p => ({ ...p, minValue: e.target.value }))}
                                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500 text-right"
                                                    />
                                                    <span className="text-slate-400">-</span>
                                                    <input type="number" placeholder="Max" value={columnFilters.maxValue}
                                                        onChange={e => setColumnFilters(p => ({ ...p, maxValue: e.target.value }))}
                                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500 text-right"
                                                    />
                                                </div>
                                            </th>
                                            <th className="px-6 py-2">
                                                <select value={columnFilters.risk}
                                                    onChange={e => setColumnFilters(p => ({ ...p, risk: e.target.value }))}
                                                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded text-[10px] focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="all">Tümü</option>
                                                    <option value="High">Yüksek</option>
                                                    <option value="Medium">Orta</option>
                                                    <option value="Low">Düşük</option>
                                                </select>
                                            </th>
                                            <th className="px-6 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {paginatedQuotes.map(quote => (
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
                                                    >{quote.product}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex justify-center">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                                                            statusColors[quote.status] || "bg-slate-100 text-slate-500 border-slate-200"
                                                        )}>
                                                            {t(`quotes.status.${quote.status}`, { defaultValue: Q_STATUS_TR[quote.status] || quote.status })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(quote.amount)}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    {(() => {
                                                        const { level, reasons } = calculateQuoteRisk(quote);
                                                        return (
                                                            <div className="flex items-center gap-2 group/risk relative">
                                                                <div className={cn(
                                                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border",
                                                                    level === 'High'   && "bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30",
                                                                    level === 'Medium' && "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
                                                                    level === 'Low'    && "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                                                                )}>
                                                                    {level === 'Low' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold uppercase tracking-wider",
                                                                        level === 'High'   && "text-rose-600 dark:text-rose-400",
                                                                        level === 'Medium' && "text-amber-600 dark:text-amber-400",
                                                                        level === 'Low'    && "text-emerald-600 dark:text-emerald-400"
                                                                    )}>{level} Risk</span>
                                                                    {reasons.length > 0 && (
                                                                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={reasons.join(', ')}>
                                                                            {reasons[0]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {reasons.length > 0 && (
                                                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl opacity-0 invisible group-hover/risk:opacity-100 group-hover/risk:visible transition-all z-50 border border-slate-700">
                                                                        <div className="font-bold mb-1.5 pb-1.5 border-b border-white/10 flex justify-between items-center">
                                                                            <span>Risk Faktörleri</span>
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
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="text-[10px] text-slate-500 font-medium">
                                    {t('quotes.list.showing')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedQuotes.length)} / {sortedQuotes.length}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
                                                    <div className={cn("w-2 h-2 rounded-full", statusSolidColors[status] || 'bg-slate-400')} />
                                                    <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                                                        {t(`quotes.status.${status}`, { defaultValue: Q_STATUS_TR[status] || status })}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400">{statusQuotes.length}</span>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                {statusQuotes.map(quote => (
                                                    <div key={quote.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-2">{quote.title}</h4>
                                                            <button className="text-slate-300 hover:text-indigo-500 transition-colors"><MoreHorizontal size={14} /></button>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 mb-3">{quote.customerName}</div>
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(quote.amount)}</span>
                                                            <div className="text-[10px] text-slate-400">{new Date(quote.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {statusQuotes.length === 0 && (
                                                    <div className="h-24 rounded-xl border-2 border-dashed border-slate-100 dark:border-white/5 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                                                        Teklif yok
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
    );
}
