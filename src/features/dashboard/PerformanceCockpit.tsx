import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertCircle, Activity, FileText, RefreshCw,
    Calendar, Target, TrendingUp, FileCheck, Banknote, ShieldAlert
} from 'lucide-react';
import { PerformanceService, type PerformanceDailyMetrics, type TrendDataPoint, type BurnupDataPoint } from '../../services/PerformanceService';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

export function PerformanceCockpit() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dailyMetrics, setDailyMetrics] = useState<PerformanceDailyMetrics | null>(null);
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [burnupData, setBurnupData] = useState<BurnupDataPoint[]>([]);

    // Configurable targets (Excel'de 40M aylık, 600M yıllık gibi)
    const monthlyTarget = 40000000;
    const yearlyTarget = 600000000;

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [metricsRes, trendRes, burnupRes] = await Promise.all([
                PerformanceService.getDailyMetrics({ monthlyTarget, yearlyTarget, asOfDate }),
                PerformanceService.getTrends('monthly'),
                PerformanceService.getBurnupData({ asOfDate })
            ]);

            setDailyMetrics(metricsRes);
            setTrendData(trendRes.trends);
            setBurnupData(burnupRes.burnup);
        } catch (err: any) {
            console.error('Error fetching performance data:', err);
            setError('Performans verileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [asOfDate]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const formatPercent = (value: number) => {
        return `${Number(value || 0).toFixed(2)}%`;
    };

    const renderDelta = (value?: number) => {
        if (value === undefined || value === null) return null;
        if (value === 0) return null;
        const isPositive = value > 0;
        const colorClass = isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
        const sign = isPositive ? '+' : '';
        return (
            <div className={`text-xs font-medium mt-1 ${colorClass}`}>
                {sign}{formatCurrency(value)} {t('performanceCockpit.sinceYesterday')}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !dailyMetrics) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-4 text-red-500">
                <AlertCircle size={48} />
                <p>{error}</p>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    Tekrar Dene
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
            {/* START HEADERS */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Activity className="text-indigo-500" size={32} />
                        {t('navigation.performance')} (Daily Dashboard)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {t('performanceCockpit.subtitle')}
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg shadow-sm">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('performanceCockpit.asOfDate')}</span>
                        <input
                            type="date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="bg-transparent border-none text-sm font-semibold text-slate-800 dark:text-white outline-none focus:ring-0 p-0"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-slate-700 dark:text-slate-300 shadow-sm"
                    >
                        <RefreshCw size={18} />
                        {t('common.refresh')}
                    </button>
                </div>
            </div>

            {/* TOP HORIZONTAL YTD BANNER */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 mb-2 transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto min-w-[200px]">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                        <Target size={24} className="text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">
                            {t('performanceCockpit.ytdAchievement')}
                        </h3>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">2026 Yılı Toplam</div>
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col">
                    <div className="flex flex-col md:flex-row gap-8 w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 mb-3">
                        <div className="flex flex-col flex-1">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('performanceCockpit.yearlySalesTarget')}</span>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(yearlyTarget)}</span>
                        </div>

                        <div className="flex flex-col flex-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700/50 pt-3 md:pt-0 md:pl-8">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t('performanceCockpit.yearlyAchievementCurrentYear')}</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(dailyMetrics.YTDInvoiceAmount)}</span>
                                <span className="text-sm font-semibold text-emerald-600/70 dark:text-emerald-400/70">
                                    ({formatPercent((dailyMetrics.YTDInvoiceAmount / yearlyTarget) * 100)})
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col flex-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700/50 pt-3 md:pt-0 md:pl-8 relative overflow-hidden">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full blur-xl"></div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 relative z-10">{t('performanceCockpit.revenueGap')}</span>
                            <div className="flex items-center gap-2 relative z-10">
                                <span className="text-2xl font-black text-red-600 dark:text-red-500 tracking-tight">-{formatCurrency(dailyMetrics.RevenueGap)}</span>
                            </div>
                        </div>
                    </div>

                    {/* YTD Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-black/20 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-transparent relative shadow-inner">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${Math.min((dailyMetrics.YTDInvoiceAmount / yearlyTarget) * 100, 100)}%` }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>

                </div>
            </div>


            {/* THREE COLUMN EXCEL-STYLE LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">

                {/* ========================================== */}
                {/* COLUMN 1: SÖZLEŞME                         */}
                {/* ========================================== */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="flex flex-col gap-4"
                >
                    <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-xl font-bold text-center tracking-wider">
                        {t('performanceCockpit.contract')}
                    </div>

                    {/* 1. HERO CARD: AYLIK GERÇEKLEŞME (MTD) */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        {/* Subtle decoration elements */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-6">
                                <Target size={14} className="text-blue-600 dark:text-blue-400" />
                                {t('performanceCockpit.contractMonthlyActuals')}
                            </h3>

                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{t('performanceCockpit.amountValue')}</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {formatCurrency(dailyMetrics.MonthlyContractAmount)}
                                    </div>
                                    <div className="mt-1">
                                        {dailyMetrics.Deltas?.MonthlyContractAmount !== undefined && (
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-400/20">
                                                +{formatCurrency(dailyMetrics.Deltas.MonthlyContractAmount)} {t('performanceCockpit.sinceYesterday')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{t('performanceCockpit.contractCount')}</div>
                                    <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{dailyMetrics.MonthlyContractCount}</div>
                                </div>
                            </div>

                            {/* Circular/Linear Progress Bar */}
                            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('performanceCockpit.monthlyTarget')}</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[50%] truncate">{formatCurrency(dailyMetrics.MonthlyContractTarget)}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-black/20 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full shadow-sm transition-all duration-1000 ease-out relative"
                                        style={{ width: `${Math.min(dailyMetrics.MonthlyContractAchievementRate, 100)}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('performanceCockpit.amountAchievementRate')}</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatPercent(dailyMetrics.MonthlyContractAchievementRate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COMBINED SECONDARY CARD: Bu Hafta & Mevcut Durum */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                        {/* Bu Hafta Gerçekleşen Sözleşme */}
                        <div className="border-b border-slate-100 dark:border-slate-700/50 pb-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Calendar size={16} />
                                    </span>
                                    <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400">
                                        {t('performanceCockpit.contractWeeklyActuals')}
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                    {dailyMetrics.WeeklyContractCount} {t('performanceCockpit.contractCount')}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 pl-8">
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(dailyMetrics.WeeklyContractAmount)}
                                </span>
                                {renderDelta(dailyMetrics.Deltas?.WeeklyContractAmount)}
                            </div>
                        </div>

                        {/* Aylık Mevcut Durum */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                                        <FileCheck size={16} />
                                    </span>
                                    <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400">
                                        {t('performanceCockpit.monthlyCurrentStatus')}
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                    {dailyMetrics.OpenContractCount} {t('performanceCockpit.monthlyContractCount')}
                                </span>
                            </div>
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-300 pl-8">
                                {formatCurrency(dailyMetrics.OpenContractPotentialAmount)}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ========================================== */}
                {/* COLUMN 2: FATURA                           */}
                {/* ========================================== */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="flex flex-col gap-4"
                >
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl font-bold text-center tracking-wider">
                        {t('performanceCockpit.invoice')}
                    </div>



                    {/* HERO CARD 1: MTD GERÇEKLEŞME */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-6">
                                <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                                {t('performanceCockpit.invoiceMonthlyActuals')}
                            </h3>

                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{t('performanceCockpit.totalInvoiced')}</div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                        {formatCurrency(dailyMetrics.MonthlyInvoiceAmount)}
                                    </div>
                                    <div className="mt-1">
                                        {dailyMetrics.Deltas?.MonthlyInvoiceAmount !== undefined && (
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-400/20">
                                                +{formatCurrency(dailyMetrics.Deltas.MonthlyInvoiceAmount)} {t('performanceCockpit.sinceYesterday')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{t('performanceCockpit.invoiceCount')}</div>
                                    <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{dailyMetrics.MonthlyInvoiceCount}</div>
                                </div>
                            </div>

                            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('performanceCockpit.invoiceMonthlyTarget')}</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 max-w-[50%] truncate">{formatCurrency(dailyMetrics.MonthlyInvoiceTarget)}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-black/20 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-2.5 rounded-full shadow-sm transition-all duration-1000 ease-out relative"
                                        style={{ width: `${Math.min(dailyMetrics.MonthlyAchievementRate, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('performanceCockpit.amountAchievementRate')}</span>
                                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatPercent(dailyMetrics.MonthlyAchievementRate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COMBINED SECONDARY CARD: Bugün & Bu Hafta */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                        {/* Bugün Kesilen */}
                        <div className="border-b border-slate-100 dark:border-slate-700/50 pb-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                        <FileText size={16} />
                                    </span>
                                    <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400">
                                        {t('performanceCockpit.invoicedToday')}
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                    {dailyMetrics.TodayInvoiceCount} {t('performanceCockpit.invoiceCount')}
                                </span>
                            </div>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 pl-8">
                                {formatCurrency(dailyMetrics.TodayInvoiceAmount)}
                            </div>
                        </div>

                        {/* Bu Hafta Kesilen */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                        <Calendar size={16} />
                                    </span>
                                    <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400">
                                        {t('performanceCockpit.invoiceWeeklyActuals')}
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                                    {dailyMetrics.WeeklyInvoiceCount} {t('performanceCockpit.invoiceCount')}
                                </span>
                            </div>
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 pl-8">
                                {formatCurrency(dailyMetrics.WeeklyInvoiceAmount)}
                            </div>
                        </div>
                    </div>

                </motion.div>

                {/* ========================================== */}
                {/* COLUMN 3: TAHSİLAT                         */}
                {/* ========================================== */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="flex flex-col gap-4"
                >
                    <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 px-4 py-3 rounded-xl font-bold text-center tracking-wider">
                        {t('performanceCockpit.collection')}
                    </div>

                    {/* MODERN HERO CARD: GÜNLÜK MUHASEBE */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-8">
                                <Banknote size={16} className="text-purple-600 dark:text-purple-400" />
                                {t('performanceCockpit.accountingDaily')}
                            </h3>

                            <div className="space-y-8">
                                <div className="relative">
                                    {/* Decorator Line */}
                                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full hidden sm:block"></div>

                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-1">
                                        <ShieldAlert size={14} />
                                        <span className="text-sm font-semibold">{t('performanceCockpit.dueReceivables')}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {formatCurrency(dailyMetrics.TodayDueReceivable)}
                                        </div>
                                    </div>
                                    {dailyMetrics.Deltas?.TodayDueReceivable !== undefined && dailyMetrics.Deltas.TodayDueReceivable !== 0 && (
                                        <div className={`text-xs font-medium mt-2 inline-flex items-center px-2.5 py-1 rounded-full ${dailyMetrics.Deltas.TodayDueReceivable > 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'}`}>
                                            {dailyMetrics.Deltas.TodayDueReceivable > 0 ? '+' : ''}{formatCurrency(dailyMetrics.Deltas.TodayDueReceivable)} ({t('performanceCockpit.riskSinceYesterday')})
                                        </div>
                                    )}
                                </div>

                                <div className="h-px w-full bg-slate-200 dark:bg-slate-700"></div>

                                <div className="relative">
                                    {/* Decorator Line */}
                                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full hidden sm:block"></div>

                                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('performanceCockpit.collectedReceivables')}</div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            {formatCurrency(dailyMetrics.TodayCollectedAmount)}
                                        </div>
                                    </div>
                                    {dailyMetrics.Deltas?.TodayCollectedAmount !== undefined && dailyMetrics.Deltas.TodayCollectedAmount !== 0 && (
                                        <div className="text-xs font-medium mt-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-400/20 inline-flex">
                                            {dailyMetrics.Deltas.TodayCollectedAmount > 0 ? '+' : ''}{formatCurrency(dailyMetrics.Deltas.TodayCollectedAmount)} {t('performanceCockpit.sinceYesterday')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Güçlendirilmiş Progress Bar */}
                            <div className="mt-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold capitalize tracking-wide text-slate-500 dark:text-slate-400">{t('performanceCockpit.dailyCollectionRate')}</span>
                                    <span className="text-lg font-black text-slate-800 dark:text-white bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-lg shadow-sm">
                                        {formatPercent(dailyMetrics.CollectionRatio)}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-black/20 rounded-full h-2.5 overflow-hidden relative">
                                    <div
                                        className="bg-amber-500 h-2.5 rounded-full shadow-sm transition-all duration-1000 ease-out absolute top-0 left-0 bottom-0"
                                        style={{ width: `${Math.min(dailyMetrics.CollectionRatio, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* CONSOLIDATED TREND CHART & BURNUP */}
            <section className="space-y-4 pt-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="xl:col-span-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Activity className="text-indigo-500" />
                        {t('performanceCockpit.trendChartTitle')}
                    </h2>
                    <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="PeriodKey"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => {
                                            // Extract just the month part if it's YYYY-MM
                                            if (val && val.length === 7) return val.substring(5, 7);
                                            return val;
                                        }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₺${(value / 1000000).toFixed(1)}M`}
                                    />
                                    <RechartsTooltip
                                        formatter={(value: any, name?: string) => {
                                            if (name === 'Target') return [formatCurrency(value), t('performanceCockpit.monthlyTarget')];
                                            return [formatCurrency(value), name || ''];
                                        }}
                                        labelFormatter={(label) => `${t('performanceCockpit.month')}: ${label}`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {/* Hedef Çizgisi (Dashed Line) */}
                                    <Line
                                        type="stepAfter"
                                        dataKey="TargetAmount"
                                        name="Target"
                                        stroke="#cbd5e1"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={false}
                                    />
                                    {/* Gerçekleşen Çizgiler */}
                                    <Line
                                        type="monotone"
                                        dataKey="ContractAmount"
                                        name={t('performanceCockpit.contractVolume')}
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                        connectNulls={true}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="InvoiceAmount"
                                        name={t('performanceCockpit.invoiceVolume')}
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                        connectNulls={true}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="CollectionAmount"
                                        name={t('performanceCockpit.collectionVolume')}
                                        stroke="#a855f7"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                        connectNulls={true}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Activity className="text-emerald-500" />
                        {t('performanceCockpit.burnupChartTitle')}
                    </h2>
                    <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={burnupData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorInvoice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.substring(8, 10)}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₺${(value / 1000000).toFixed(0)}M`}
                                    />
                                    <RechartsTooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        labelFormatter={(label) => `Tarih: ${label}`}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Area
                                        type="stepAfter"
                                        dataKey="cumulativeInvoice"
                                        name={t('performanceCockpit.cumulativeInvoice')}
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorInvoice)"
                                    />
                                    <Line
                                        type="stepAfter"
                                        dataKey="cumulativeContract"
                                        name={t('performanceCockpit.cumulativeContract')}
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONSOLIDATED TREND TABLE */}
            <section className="space-y-4 pt-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <FileText className="text-slate-500" />
                    {t('performanceCockpit.trendAnalysisTitle')}
                </h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
                            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-bold">{t('performanceCockpit.periodMonth')}</th>
                                    <th className="px-6 py-4 font-bold text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/10">{t('performanceCockpit.contractVolume')}</th>
                                    <th className="px-6 py-4 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10">{t('performanceCockpit.invoiceVolume')}</th>
                                    <th className="px-6 py-4 font-bold text-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/10">{t('performanceCockpit.collectionVolume')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {trendData.map((row) => (
                                    <tr key={row.PeriodKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                            {row.PeriodKey}
                                        </td>
                                        <td className="px-6 py-4 text-blue-700 dark:text-blue-400 font-medium bg-blue-50/20 dark:bg-blue-900/5">
                                            {formatCurrency(row.ContractAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50/20 dark:bg-emerald-900/5">
                                            {formatCurrency(row.InvoiceAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-purple-700 dark:text-purple-400 font-medium bg-purple-50/20 dark:bg-purple-900/5">
                                            {formatCurrency(row.CollectionAmount)}
                                        </td>
                                    </tr>
                                ))}
                                {trendData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            {t('performanceCockpit.noTrendData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
