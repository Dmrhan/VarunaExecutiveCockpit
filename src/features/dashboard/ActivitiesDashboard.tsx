import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { ActivityLogGrid } from './ActivityLogGrid';
import { useData } from '../../context/DataContext';
// import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts'; // Removed unused chart imports
import { Phone, Mail, Users, Presentation, Video, CheckSquare, Clock, Activity as ActivityIcon, AlertCircle, ListTodo, TrendingUp, Calendar as CalendarIcon, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subDays, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { ActivityAnalysisGrid } from './ActivityAnalysisGrid';
import { SellerActivityMatrix } from './SellerActivityMatrix';



export function ActivitiesDashboard() {
    const { t, i18n } = useTranslation();
    const { activities, deals, users } = useData();
    const [dateFilter, setDateFilter] = useState('month');
    // Actually default requested was 'this_month' in notify_user but let's stick to 'this_month' logic
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- FILTER LOGIC ---
    const filteredActivities = useMemo(() => {
        let result = [...activities];
        const now = new Date();

        // 1. Time Filter
        if (dateFilter !== 'all') {
            result = result.filter(a => {
                const actDate = new Date(a.date);
                switch (dateFilter) {
                    case 'today':
                        return isSameDay(actDate, now);
                    case 'week':
                        return isWithinInterval(actDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
                    case 'month':
                    case 'mtd':
                        return isWithinInterval(actDate, { start: startOfMonth(now), end: endOfMonth(now) });
                    case 'quarter':
                        return isWithinInterval(actDate, { start: startOfQuarter(now), end: endOfQuarter(now) });
                    case 'ytd':
                        return isWithinInterval(actDate, { start: startOfYear(now), end: endOfYear(now) });
                    case 'custom':
                        if (customRange.start && customRange.end) {
                            return isWithinInterval(actDate, { start: customRange.start, end: customRange.end });
                        }
                        return true;
                    default: return true;
                }
            });
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activities, dateFilter, customRange]);

    // --- METRICS ---
    const metrics = useMemo(() => {
        const total = filteredActivities.length;
        const completed = filteredActivities.filter(a => a.status === 'completed').length;
        const openTodos = filteredActivities.filter(a => a.status === 'pending').length;
        const overdue = filteredActivities.filter(a => a.status === 'overdue').length;

        // Win Rate (Activity led to Won Deal?) - Approximation
        // Find deals touched by these activities
        const touchedDeals = new Set(filteredActivities.map(a => a.dealId));
        const wonDeals = deals.filter(d => touchedDeals.has(d.id) && (d.stage === 'Kazanıldı' || d.stage === 'Order')).length;
        const winRate = touchedDeals.size > 0 ? Math.round((wonDeals / touchedDeals.size) * 100) : 0;

        return { total, completed, openTodos, overdue, winRate };
    }, [filteredActivities, deals]);

    // --- CHARTS DATA ---





    const formatDate = (dateStr: string) => format(new Date(dateStr), 'd MMMM', { locale: i18n.language === 'tr' ? tr : enUS });
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone size={14} />;
            case 'email': return <Mail size={14} />;
            case 'meeting': return <Users size={14} />;
            case 'demo': return <Presentation size={14} />;
            default: return <Video size={14} />;
        }
    };

    // --- TRENDS & STATS ---
    const headerStats = useMemo(() => {
        // 1. Calculate Previous Period Range
        const now = new Date();
        let prevStart = subDays(now, 60);
        let prevEnd = subDays(now, 30);

        if (dateFilter === 'today') {
            prevStart = subDays(now, 1);
            prevEnd = subDays(now, 1);
        } else if (dateFilter === 'week') {
            prevStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
            prevEnd = subDays(endOfWeek(now, { weekStartsOn: 1 }), 7);
        } else if (dateFilter === 'month' || dateFilter === 'mtd') {
            prevStart = subDays(startOfMonth(now), 30); // Approx previous month
            prevEnd = subDays(endOfMonth(now), 30);
        } else if (dateFilter === 'quarter') {
            prevStart = subDays(startOfQuarter(now), 90);
            prevEnd = subDays(endOfQuarter(now), 90);
        } else if (dateFilter === 'ytd') {
            prevStart = subDays(startOfYear(now), 365);
            prevEnd = subDays(endOfYear(now), 365);
        }

        // 2. Filter Previous Activities
        const prevActivities = activities.filter(a => {
            const d = new Date(a.date);
            return d >= prevStart && d <= prevEnd;
        });

        // 3. Helper for Counts
        const getCounts = (acts: typeof activities) => ({
            total: acts.length,
            meeting: acts.filter(a => a.type === 'meeting' || a.type === 'demo').length,
            email: acts.filter(a => a.type.includes('email')).length,
            call: acts.filter(a => a.type.includes('call')).length,
            proposal: acts.filter(a => a.type.includes('proposal')).length,
            other: acts.filter(a => !['meeting', 'demo'].includes(a.type) && !a.type.includes('email') && !a.type.includes('call') && !a.type.includes('proposal')).length,
            // Task Metrics
            pending: acts.filter(a => a.status === 'pending').length,
            overdue: acts.filter(a => a.status === 'overdue').length,
        });

        // 4. Helper for Win Rate
        const getWinRate = (acts: typeof activities) => {
            const touched = new Set(acts.map(a => a.dealId));
            const won = deals.filter(d => touched.has(d.id) && (d.stage === 'Kazanıldı' || d.stage === 'Order')).length;
            return touched.size > 0 ? Math.round((won / touched.size) * 100) : 0;
        };

        const curr = { ...getCounts(filteredActivities), winRate: getWinRate(filteredActivities) };
        const prev = { ...getCounts(prevActivities), winRate: getWinRate(prevActivities) };

        const calcTrend = (c: number, p: number) => {
            if (p === 0) return c > 0 ? 100 : 0;
            return Math.round(((c - p) / p) * 100);
        };

        return {
            total: { value: curr.total, trend: calcTrend(curr.total, prev.total) },
            activities: [
                { label: 'Toplantı', value: curr.meeting, trend: calcTrend(curr.meeting, prev.meeting), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: 'E-Posta', value: curr.email, trend: calcTrend(curr.email, prev.email), icon: Mail, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                { label: 'Arama', value: curr.call, trend: calcTrend(curr.call, prev.call), icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Teklif', value: curr.proposal, trend: calcTrend(curr.proposal, prev.proposal), icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'Diğer', value: curr.other, trend: calcTrend(curr.other, prev.other), icon: Sparkles, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
            ],
            tasks: [
                { label: 'Bekleyen İşler', value: curr.pending, trend: calcTrend(curr.pending, prev.pending), icon: ListTodo, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                { label: 'Gecikmiş', value: curr.overdue, trend: calcTrend(curr.overdue, prev.overdue), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
                { label: 'Temas > Kazanım', value: `%${curr.winRate}`, trend: calcTrend(curr.winRate, prev.winRate), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            ]
        };
    }, [filteredActivities, activities, deals, dateFilter]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            {/* Header with Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">{t('activities.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('activities.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Time Filter Tabs */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center overflow-x-auto scrollbar-hide">
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
                    </div>

                    {dateFilter === 'custom' && (
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                                showDatePicker || (customRange.start && customRange.end)
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            )}
                        >
                            <CalendarIcon size={14} />
                            {customRange.start && customRange.end
                                ? `${format(customRange.start, 'dd MMM')} - ${format(customRange.end, 'dd MMM')}`
                                : t('common.selectDate')}
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Date Picker Dropdown */}
            {showDatePicker && dateFilter === 'custom' && (
                <DateRangePicker
                    startDate={customRange.start}
                    endDate={customRange.end}
                    onChange={(start, end) => setCustomRange({ start, end })}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {/* 0. NEW PERFORMANCE HEADER (Combined Sections) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

                {/* A. TOTAL TOUCHPOINTS (Col 2) */}
                <div className="xl:col-span-2">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 p-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none text-white h-full flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <ActivityIcon size={80} />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-xs font-medium mb-1">Toplam Temas</p>
                            <h3 className="text-3xl font-bold">{headerStats.total.value}</h3>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-medium text-indigo-100 bg-white/20 w-fit px-2 py-1 rounded">
                            {headerStats.total.trend >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                            %{Math.abs(headerStats.total.trend)}
                            <span className="opacity-70 ml-1">geçen döneme göre</span>
                        </div>
                    </div>
                </div>

                {/* B. ACTIVITIES BREAKDOWN (Col 6) */}
                <div className="xl:col-span-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {headerStats.activities.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors h-28">
                            <div className="flex justify-between items-start">
                                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                                    <stat.icon size={16} className={stat.color} />
                                </div>
                                <span className={cn("text-[10px] font-bold flex items-center", stat.trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {stat.trend >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingUp size={10} className="mr-0.5 rotate-180" />}
                                    %{Math.abs(stat.trend)}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</h4>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* C. TASKS & OUTCOMES (Col 4) */}
                <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {headerStats.tasks.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors h-28">
                            <div className="flex justify-between items-start">
                                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                                    <stat.icon size={16} className={stat.color} />
                                </div>
                                <span className={cn("text-[10px] font-bold flex items-center", stat.trend >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {stat.trend >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingUp size={10} className="mr-0.5 rotate-180" />}
                                    %{Math.abs(stat.trend)}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</h4>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 1. AI EXECUTIVE BRIEF BOARD */}
            <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles size={100} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">{t('activities.aiBriefTitle')}</h3>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                        "Bu hafta ekip aktivite yoğunluğu <span className="font-semibold text-emerald-600">artış trendinde</span>. Özellikle Pazartesi günü yapılan 45 arama, <span className="font-semibold text-indigo-600">3 yeni fırsat</span> yarattı. Ancak, <span className="font-semibold text-rose-600">{metrics.overdue} gecikmiş aksiyon</span> risk oluşturuyor. Finans sektöründeki 2 büyük toplantı kritik öneme sahip."
                    </p>
                    <div className="mt-4 flex gap-3">
                        <div className="px-3 py-1 bg-white/60 dark:bg-white/10 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            🚀 Momentum: Yüksek
                        </div>
                        <div className="px-3 py-1 bg-white/60 dark:bg-white/10 rounded-full text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                            ⚠️ Risk: Gecikmeler
                        </div>
                    </div>
                </div>
            </div>



            {/* 3. PRIORITY ACTION LIST & DETAILED MATRIX */}
            <div className="space-y-6">
                <ActivityLogGrid activities={filteredActivities} />

                {/* Visualizer: Detailed Activity Matrix (Replaces Scatter) */}
                <div className="h-[500px]">
                    <SellerActivityMatrix filteredActivities={filteredActivities} />
                </div>

                {/* Activity Summary Widgets */}

            </div>



            {/* 5. DEEP DIVE ANALYTICS & INSIGHTS (New) */}
            <div>
                <div className="mb-4 mt-8 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" />
                    <h2 className="text-lg font-medium text-slate-800 dark:text-white">Stratejik Aktivite Analizi & İçgörüler</h2>
                </div>
                <ActivityAnalysisGrid filteredActivities={filteredActivities} />
            </div>

        </div>
    );
}


