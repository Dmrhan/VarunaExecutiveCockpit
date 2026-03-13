import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, AlertCircle, ArrowUpRight, ArrowDownRight, Briefcase, FileText, CheckCircle2, ShoppingCart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { ScorecardFunnel } from './ScorecardFunnel';
import { TrendMonitorCard } from './TrendMonitorCard';
import { fetchPersonScorecard } from '../../services/ScorecardService';
import type { ScorecardResponse } from '../../services/ScorecardService';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const StatCard = ({ label, value, colorClass, subtitle, icon: Icon }: any) => (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[100px]`}>
        <div className="flex items-center justify-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            {Icon && <Icon size={14} className={colorClass} />}
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium truncate text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <span className={`text-2xl font-normal tracking-tight mb-1 ${colorClass}`}>
            {value}
        </span>
        {subtitle && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{subtitle}</span>
        )}
    </div>
);

export const PersonScorecardPage = () => {
    const { t } = useTranslation();
    const { users } = useData();
    const [selectedPersonId, setSelectedPersonId] = useState<string>('');
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
                        // Use actual last day of the month
                        const ed = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        to = ed.toISOString().split('T')[0];
                    }
                }

                const res = await fetchPersonScorecard(selectedPersonId, {
                    from: from || undefined,
                    to: to || undefined,
                });
                setData(res);
            } catch (err) {
                console.error('[Scorecard] fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedPersonId, dateFilter, customRange]);

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

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
                    {/* Person Selector */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2 px-3 py-1">
                            {selectedUser ? (
                                <UserAvatar name={selectedUser.name} size="xs" />
                            ) : (
                                <Users size={16} className="text-slate-400 hidden sm:block" />
                            )}
                            <select
                                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer min-w-[120px] outline-none truncate"
                                value={selectedPersonId}
                                onChange={(e) => setSelectedPersonId(e.target.value)}
                            >
                                {users.map(u => (
                                    <option key={u.id} value={u.id} className="dark:bg-slate-800">{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Term Selector */}
                    <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl flex items-center border border-slate-200 dark:border-white/5">
                        {[
                            { label: t('dateFilters.thisMonth', 'Bu Ay'), value: 'this_month' },
                            { label: t('dateFilters.ytd', 'YTD'), value: 'this_year' },
                            { label: t('dateFilters.all', 'Tümü'), value: 'all' }
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
                            onClick={() => setShowPicker(true)}
                            className={cn(
                                "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap flex items-center gap-1",
                                dateFilter === 'custom'
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            <Calendar size={12} />
                            {dateFilter === 'custom' && customRange.start && customRange.end 
                                ? `${new Date(customRange.start).toLocaleDateString()} - ${new Date(customRange.end).toLocaleDateString()}`
                                : t('dateFilters.custom', 'Özel')}
                        </button>
                    </div>

                    {showPicker && (
                        <DateRangePicker
                            startDate={customRange.start ? new Date(customRange.start) : null}
                            endDate={customRange.end ? new Date(customRange.end) : null}
                            onChange={(start, end) => {
                                setDateFilter('custom');
                                setCustomRange({
                                    start: start ? start.toISOString().split('T')[0] : '',
                                    end: end ? end.toISOString().split('T')[0] : ''
                                });
                            }}
                            onClose={() => setShowPicker(false)}
                        />
                    )}


                </div>
            </div>

            {/* Team Rank Tiny Panel Moved to Top */}
            {!loading && data && data.teamRank && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 rounded-xl w-10 h-10 flex items-center justify-center font-black text-lg border border-slate-200 dark:border-white/10">
                            #{data.teamRank.rank}
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">{t('scorecard.teamRanking.title', 'Takım Sıralaması')}</h3>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {t('scorecard.teamRanking.subtitle', { defaultValue: 'Ekip içi ({{count}} Kişi Arasında)', count: data.teamRank.totalMembers })}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {data.teamRank.differenceToTop !== undefined && data.teamRank.differenceToTop > 0 && (
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                {t('scorecard.teamRanking.gapToLeader', '1. ile Fark')}: <span className="font-bold text-slate-900 dark:text-white font-mono">{formatCurr(data.teamRank.differenceToTop)}</span>
                            </span>
                        )}
                        {data.teamRank.differenceToTop === 0 && data.teamRank.rank === 1 && (
                            <span className="text-xs text-amber-500 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                {t('scorecard.teamRanking.leader', '🏆 Lider')}
                            </span>
                        )}
                        <span className="text-[10px] text-slate-500 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 self-start sm:self-auto mt-1 sm:mt-0 font-medium">
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
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-transparent">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                    {t('scorecard.tables.topContracts', 'En Büyük 10 Kontrat (Müşteri Bazlı)')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('scorecard.tables.customer', 'Müşteri')}</th>
                                            <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">{t('scorecard.tables.contractCount', 'Kontrat Sayısı')}</th>
                                            <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">{t('scorecard.tables.contractValue', 'Pano Değeri')}</th>
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
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-transparent">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                    {t('scorecard.tables.contractStages', 'Kontrat Safhaları')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
                                <ul className="divide-y divide-slate-100 dark:divide-white/5">
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
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-transparent">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Briefcase size={14} className="text-indigo-500" />
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
                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                dy={10}
                                                interval={0}
                                                angle={-30}
                                                textAnchor="end"
                                                height={70}
                                            />
                                            <YAxis
                                                hide={true}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg space-y-1">
                                                                <p className="font-bold text-slate-200 uppercase tracking-wide mb-1">{d.name}</p>
                                                                <p>{t('scorecard.expectations.revenue', 'Gelir')}: <span className="font-semibold text-emerald-400">{formatCurr(d.expectedRevenue)}</span></p>
                                                                <p>{t('scorecard.funnel.count', 'Adet')}: <span className="font-semibold text-indigo-300">{d.count} {t('scorecard.expectations.opportunityUnit', 'Fırsat')}</span></p>
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
                                                    const isSelected = selectedMonthKey === entry.monthKey;
                                                    return (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={isSelected ? '#6366f1' : '#94a3b8'}
                                                            opacity={(!selectedMonthKey || isSelected) ? 1 : 0.4}
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
                            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-transparent">
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
                                <ul className="divide-y divide-slate-100 dark:divide-white/5">
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
                        <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-transparent">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                                {t('scorecard.interactions.title', 'Son Etkileşimler (Top 10)')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-row w-full divide-x divide-slate-100 dark:divide-white/5">
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
