import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, AlertCircle, ArrowUpRight, ArrowDownRight, Briefcase, FileText, CheckCircle2, ShoppingCart, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { ScorecardFunnel } from './ScorecardFunnel';
import { TrendMonitorCard } from './TrendMonitorCard';
import { fetchPersonScorecard } from '../../services/ScorecardService';
import type { ScorecardResponse } from '../../services/ScorecardService';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const StatCard = ({ label, value, colorClass, subtitle, icon: Icon }: any) => (
    <Card className={`bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-slate-200 dark:border-slate-600 overflow-hidden shadow-sm flex flex-col items-center justify-center p-4 min-h-[110px]`}>
        <div className="flex items-center gap-2 mb-2 w-full justify-center text-slate-500 dark:text-slate-400">
            {Icon && <Icon size={14} className={colorClass} />}
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-center truncate">{label}</span>
        </div>
        <div className={`text-2xl font-light tracking-tight mb-1 ${colorClass}`}>
            {value}
        </div>
        {subtitle && (
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
                {subtitle}
            </div>
        )}
    </Card>
);

export const PersonScorecardPage = () => {
    const { t } = useTranslation();
    const { users } = useData();
    const [selectedPersonId, setSelectedPersonId] = useState<string>('');
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [data, setData] = useState<ScorecardResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

    // Default to the first user if none selected
    useEffect(() => {
        if (!selectedPersonId && users.length > 0) {
            setSelectedPersonId(users[0].id);
        }
    }, [users, selectedPersonId]);

    useEffect(() => {
        if (!selectedPersonId) return;

        const loadData = async () => {
            setLoading(true);
            try {
                let from = '';
                let to = '';

                if (dateFilter !== 'all') {
                    const now = new Date();
                    if (dateFilter === 'custom' && customRange.start && customRange.end) {
                        from = customRange.start;
                        to = customRange.end;
                    } else if (dateFilter === 'this_year') {
                        from = `${now.getFullYear()}-01-01`;
                        to = `${now.getFullYear()}-12-31`;
                    } else if (dateFilter === 'this_month') {
                        from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                        const ed = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        to = ed.toISOString().split('T')[0];
                    }
                }

                const res = await fetchPersonScorecard(selectedPersonId, {
                    asOf: asOfDate,
                    from: from || undefined,
                    to: to || undefined,
                });
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedPersonId, asOfDate, dateFilter, customRange]);

    const renderCustomBarLabel = (props: any) => {
        const { x, y, width, index, value } = props;
        const itemData = data?.opportunitiesByCloseMonth?.[index];
        if (!itemData || value === 0) return null;

        return (
            <g transform={`translate(${x + width / 2},${y - 10})`}>
                <text x={0} y={-8} dy={0} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={700}>
                    {formatCurr(value)}
                </text>
                <text x={0} y={2} dy={0} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                    {itemData.count} {t('scorecard.expectations.opportunityUnit', 'Fırsat')}
                </text>
            </g>
        );
    };

    const formatCurr = (v: number) => {
        if (v >= 1000000) return `₺${(v / 1000000).toFixed(1)}M`;
        if (v >= 1000) return `₺${(v / 1000).toFixed(0)}k`;
        return `₺${(v || 0).toLocaleString()}`;
    };
    const selectedUser = users.find(u => u.id === selectedPersonId);

    return (
        <div className="p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen pb-24 text-slate-800 dark:text-slate-100 font-sans">
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        {selectedUser ? (
                            <UserAvatar name={selectedUser.name} size="md" className="rounded-xl" />
                        ) : (
                            <Users className="text-indigo-500" size={32} />
                        )}
                        {selectedUser?.name ? `${selectedUser.name} - ${t('scorecard.title', 'Satış Karnesi')}` : t('scorecard.pageTitle', 'Kişi Bazlı Satış Operasyonları Karnesi')}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {t('scorecard.subtitle', "Seçilen satış temsilcisinin Opportunity'den Tahsilat'a uzanan tüm satış serüvenini as-of date (kesit) mantığı ile izleyin.")}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 dark:bg-slate-800/60 p-2 rounded-2xl backdrop-blur-md border border-white/40 dark:border-slate-700/50 shadow-sm w-full xl:w-auto">
                    {/* Person Selector */}
                    <div className="flex items-center gap-2 px-3">
                        {selectedUser ? (
                            <UserAvatar name={selectedUser.name} size="xs" />
                        ) : (
                            <Users size={16} className="text-slate-400" />
                        )}
                        <select
                            className="bg-transparent text-sm font-semibold border-none focus:ring-0 cursor-pointer min-w-[150px] outline-none"
                            value={selectedPersonId}
                            onChange={(e) => setSelectedPersonId(e.target.value)}
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id} className="dark:bg-slate-800">{u.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    {/* Term Selector */}
                    <div className="flex items-center gap-2 px-3">
                        <Calendar size={16} className="text-slate-400" />
                        <select
                            className="bg-transparent text-sm font-semibold border-none focus:ring-0 cursor-pointer outline-none"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <option value="all" className="dark:bg-slate-800">{t('dateFilters.all', 'Tüm Dönem')}</option>
                            <option value="this_month" className="dark:bg-slate-800">{t('dateFilters.thisMonth', 'Bu Ay')}</option>
                            <option value="this_year" className="dark:bg-slate-800">{t('dateFilters.ytd', 'YTD (Bu Yıl)')}</option>
                            <option value="custom" className="dark:bg-slate-800">{t('dateFilters.custom', 'Özel Aralık')}</option>
                        </select>
                    </div>

                    {dateFilter === 'custom' && (
                        <>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block" />
                            <button
                                onClick={() => setShowPicker(true)}
                                className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors"
                            >
                                {customRange.start && customRange.end
                                    ? `${new Date(customRange.start).toLocaleDateString()} - ${new Date(customRange.end).toLocaleDateString()}`
                                    : t('scorecard.selectDate', 'Tarih Seçin')}
                            </button>
                            {showPicker && (
                                <DateRangePicker
                                    startDate={customRange.start ? new Date(customRange.start) : null}
                                    endDate={customRange.end ? new Date(customRange.end) : null}
                                    onChange={(start, end) => setCustomRange({
                                        start: start ? start.toISOString().split('T')[0] : '',
                                        end: end ? end.toISOString().split('T')[0] : ''
                                    })}
                                    onClose={() => setShowPicker(false)}
                                />
                            )}
                        </>
                    )}

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                    {/* As-Of Date Selector */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <Clock size={16} className="text-indigo-500" />
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{t('scorecard.asOfDate', 'As-Of')}:</span>
                        <input
                            type="date"
                            value={asOfDate}
                            onChange={e => setAsOfDate(e.target.value)}
                            className="bg-transparent text-xs font-mono font-bold border-none focus:ring-0 outline-none text-indigo-900 dark:text-indigo-300 w-auto cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Team Rank Tiny Panel Moved to Top */}
            {!loading && data && data.teamRank && (
                <div className="bg-gradient-to-tr from-indigo-500/10 to-indigo-400/5 border border-indigo-500/20 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500 text-white rounded-xl w-10 h-10 flex items-center justify-center font-black text-lg shadow-inner">
                            #{data.teamRank.rank}
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-0.5">{t('scorecard.teamRanking.title', 'Takım Sıralaması')}</h3>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t('scorecard.teamRanking.subtitle', { defaultValue: 'Ekip içi ({{count}} Kişi Arasında)', count: data.teamRank.totalMembers })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {data.teamRank.differenceToTop !== undefined && data.teamRank.differenceToTop > 0 && (
                            <span className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                {t('scorecard.teamRanking.gapToLeader', '1. ile Fark')}: {formatCurr(data.teamRank.differenceToTop)}
                            </span>
                        )}
                        {data.teamRank.differenceToTop === 0 && data.teamRank.rank === 1 && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                {t('scorecard.teamRanking.leader', '🏆 Lider')}
                            </span>
                        )}
                        <span className="text-[10px] text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full dark:border-slate-600 uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 self-start sm:self-auto mt-1 sm:mt-0">
                            {t('scorecard.teamRanking.basedOn', 'Based on')}: {data.teamRank.metric}
                        </span>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
            )}

            {!loading && data && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    {/* KPI Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                        <StatCard
                            label={t('scorecard.kpis.openOpportunity', 'Açık Fırsat')}
                            icon={Briefcase}
                            value={formatCurr(data.kpis.openOpportunity.amount)}
                            subtitle={`${data.kpis.openOpportunity.count} ${t('scorecard.kpis.unit', 'Adet')}`}
                            colorClass="text-slate-600 dark:text-slate-300"
                        />
                        <StatCard
                            label={t('scorecard.kpis.quoteSent', 'İletilen Teklif')}
                            icon={FileText}
                            value={formatCurr(data.kpis.quoteSent.amount)}
                            subtitle={`${data.kpis.quoteSent.count} ${t('scorecard.kpis.unit', 'Adet')}`}
                            colorClass="text-slate-600 dark:text-slate-300"
                        />
                        <StatCard
                            label={t('scorecard.kpis.quoteWon', 'Kazanılan Teklif')}
                            icon={CheckCircle2}
                            value={formatCurr(data.kpis.quoteWon.amount)}
                            subtitle={`${data.kpis.quoteWon.count} ${t('scorecard.kpis.unit', 'Adet')}`}
                            colorClass="text-emerald-500"
                        />
                        <StatCard
                            label={t('scorecard.kpis.conversionRate', 'Quote Conversion Rate')}
                            icon={ArrowUpRight}
                            value={`%${(data.kpis.quoteWinRate * 100).toFixed(1)}`}
                            subtitle={t('scorecard.kpis.conversionSubtitle', 'Kazanılan / İletilen Tutara Oran')}
                            colorClass="text-indigo-500"
                        />
                        <StatCard
                            label={t('scorecard.kpis.openOrders', 'Dönüşen Siparişler')}
                            icon={ShoppingCart}
                            value={formatCurr(data.kpis.openOrder.amount)}
                            subtitle={`${data.kpis.openOrder.count} ${t('scorecard.kpis.orderUnit', 'Sipariş')}`}
                            colorClass="text-amber-500"
                        />
                        <StatCard
                            label={t('scorecard.kpis.contracts', 'Bağlanan Sözleşme')}
                            icon={FileText}
                            value={formatCurr(data.kpis.contract.amount)}
                            subtitle={`${data.kpis.contract.count} ${t('scorecard.kpis.unit', 'Adet')}`}
                            colorClass="text-purple-500"
                        />
                        <StatCard
                            label={t('scorecard.kpis.invoiced', 'Faturalanan')}
                            icon={CheckCircle2}
                            value={formatCurr(data.kpis.ytdInvoice.amount)}
                            subtitle={t('scorecard.kpis.totalInvoice', 'Toplam Fatura')}
                            colorClass="text-blue-500"
                        />
                        <StatCard
                            label={t('scorecard.kpis.collected', 'Tahsil Edilen')}
                            icon={CheckCircle2}
                            value={formatCurr(data.kpis.ytdCollection.amount)}
                            subtitle={`(${formatCurr(data.kpis.ytdCollection.pendingAmount)} ${t('scorecard.kpis.balance', 'Bakiye')})`}
                            colorClass="text-teal-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-full">
                            <ScorecardFunnel data={data.funnel} />
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="flex-1">
                                <TrendMonitorCard data={data.trend} />
                            </div>
                        </div>
                    </div>

                    {/* Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-white/5">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                    {t('scorecard.tables.topContracts', 'En Büyük 10 Kontrat (Müşteri Bazlı)')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-700">
                                            <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">{t('scorecard.tables.customer', 'Müşteri')}</th>
                                            <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 text-right">{t('scorecard.tables.contractCount', 'Kontrat Sayısı')}</th>
                                            <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 text-right">{t('scorecard.tables.contractValue', 'Pano Değeri')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-sm font-medium">
                                        {data.contractsByAccount.map(c => (
                                            <tr key={c.accountId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-4 truncate max-w-[200px] text-slate-700 dark:text-slate-200">{c.accountName}</td>
                                                <td className="py-3 px-4 text-right">{c.contractCount}</td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatCurr(c.contractAmount)}
                                                </td>
                                            </tr>
                                        ))}
                                        {data.contractsByAccount.length === 0 && (
                                            <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-xs italic">{t('scorecard.tables.noResults', 'Sonuç bulunamadı')}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col overflow-hidden">
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-white/5">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                    {t('scorecard.tables.contractStages', 'Kontrat Safhaları')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
                                <ul className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {data.contractsByStatus.map(s => (
                                        <li key={s.statusCode} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase">{s.statusLabel}</p>
                                                <p className="text-[10px] text-slate-400 hidden group-hover:block transition-all">{s.count} {t('scorecard.kpis.contracts', 'Kontrat')}</p>
                                            </div>
                                            <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                                {formatCurr(s.amount)}
                                            </span>
                                        </li>
                                    ))}
                                    {data.contractsByStatus.length === 0 && (
                                        <li className="p-8 text-center text-slate-400 text-xs italic">{t('scorecard.tables.noResults', 'Veri bulunamadı.')}</li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Opportunities */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
                        <Card className="flex flex-col overflow-hidden w-full min-h-[350px] lg:col-span-2">
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-white/5">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-amber-500" />
                                        {t('scorecard.expectations.title', 'Aylara Göre Fırsat Kapanış Beklentisi (TL)')}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 w-full">
                                {data.opportunitiesByCloseMonth && data.opportunitiesByCloseMonth.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={data.opportunitiesByCloseMonth} margin={{ top: 25, right: 10, left: 10, bottom: 20 }}>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#8b949e' }}
                                                dy={10}
                                                interval={0}
                                                angle={-25}
                                                textAnchor="end"
                                            />
                                            <YAxis
                                                hide={true}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700">
                                                                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">{d.name}</p>
                                                                <div className="flex flex-col gap-1 text-sm">
                                                                    <span className="text-amber-500 font-medium">{t('scorecard.expectations.revenue', 'Gelir')}: {formatCurr(d.expectedRevenue)}</span>
                                                                    <span className="text-slate-500 dark:text-slate-400">{t('scorecard.funnel.count', 'Adet')}: {d.count} {t('scorecard.expectations.opportunityUnit', 'Fırsat')}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar
                                                dataKey="expectedRevenue"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={60}
                                                onClick={(chartData: any) => setSelectedMonthKey(selectedMonthKey === chartData.monthKey ? null : chartData.monthKey)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {data.opportunitiesByCloseMonth.map((entry, index) => {
                                                    const isPastMonth = new Date(entry.monthKey + '-01') < new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                                                    const isSelected = selectedMonthKey === entry.monthKey;
                                                    return (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={isSelected ? '#6366f1' : (isPastMonth ? '#f43f5e' : '#f59e0b')}
                                                            opacity={(!selectedMonthKey || isSelected) ? (isPastMonth && !isSelected ? 0.7 : 1) : 0.4}
                                                        />
                                                    );
                                                })}
                                                <LabelList dataKey="expectedRevenue" content={renderCustomBarLabel} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs italic">
                                        {t('scorecard.expectations.noData', 'Tahmini kapanış tarihine sahip açık fırsat verisi bulunamadı.')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col overflow-hidden w-full lg:col-span-1 min-h-[350px]">
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-white/5">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-indigo-500">
                                        <FileText size={14} />
                                        {selectedMonthKey
                                            ? t('scorecard.expectations.periodOpportunities', { defaultValue: '{{period}} Fırsatları', period: data.opportunitiesByCloseMonth?.find((m: any) => m.monthKey === selectedMonthKey)?.name })
                                            : t('scorecard.expectations.allOpportunities', 'Tüm Açık Fırsatlar')}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px]">
                                <ul className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {data.openOpportunitiesList?.filter((o: any) => selectedMonthKey ? o.monthKey === selectedMonthKey : true).length === 0 && (
                                        <li className="p-8 text-center text-slate-400 text-xs italic">{t('scorecard.expectations.noOpportunities', 'Açık fırsat bulunamadı.')}</li>
                                    )}
                                    {data.openOpportunitiesList?.filter((o: any) => selectedMonthKey ? o.monthKey === selectedMonthKey : true).map((opp: any) => (
                                        <li key={opp.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors flex flex-col gap-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200" title={opp.name}>{opp.name}</p>
                                                <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                                    {formatCurr(opp.expectedRevenue)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate">{opp.accountName || '-'}</p>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                    {opp.stageName || (opp.dealStatus === 1 ? t('status.Negotiation', 'Açık / Müzakere') : `${t('common.status', 'Statü')}: ${opp.dealStatus}`)}
                                                </span>
                                                {opp.expectedCloseDate && (
                                                    <span className="text-[9px] text-slate-400 font-mono">
                                                        {t('common.closing', 'Kapanış')}: {new Date(opp.expectedCloseDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity List Timeline */}
                    <Card className="overflow-hidden flex flex-col">
                        <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-white/5">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                {t('scorecard.interactions.title', 'Son Etkileşimler (Top 10)')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-row w-full divide-x divide-slate-100 dark:divide-slate-800">
                            {data.lastEvents.length > 0 ? data.lastEvents.map(e => (
                                <div key={e.id} className="p-4 flex-1 min-w-[200px] hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                                        <Calendar size={12} />
                                        <span className="text-[10px] font-mono">{new Date(e.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1 leading-tight line-clamp-2">
                                        {e.subject || t('scorecard.interactions.noDetail', 'Detaysız Plan')}
                                    </p>
                                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-medium truncate">
                                        {e.accountName || t('scorecard.interactions.unknownCustomer', 'Bilinmeyen Müşteri')}
                                    </p>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-xs italic w-full flex justify-center">{t('scorecard.interactions.noLog', 'Aktivite logu bulunamadı.')}</div>
                            )}
                        </CardContent>
                    </Card>

                </motion.div>
            )}
        </div>
    );
};
