import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, DollarSign, List, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../../components/ui/UserAvatar';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
};

const DEAL_TYPE_KEYS: Record<string, string> = {
    '1': 'opportunities.charts.dealTypes.newSale',
    '2': 'opportunities.charts.dealTypes.renovation',
    '3': 'opportunities.charts.dealTypes.crossSelling',
    '4': 'opportunities.charts.dealTypes.upSellSale',
    '5': 'opportunities.charts.dealTypes.additionalUsage',
    '6': 'opportunities.charts.dealTypes.financialInstitute',
    '7': 'opportunities.charts.dealTypes.newExistingReference',
    '8': 'opportunities.charts.dealTypes.changesRequestForm',
    '9': 'opportunities.charts.dealTypes.winBack',
};

interface OpenPipelineDetailProps {
    ownerId: string;
    filters: any;
}

export function OpenPipelineDetail({ ownerId, filters }: OpenPipelineDetailProps) {
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'amount' | 'count'>('amount');

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filters.dateRange?.start) params.append('from', filters.dateRange.start + ' 00:00:00');
                if (filters.dateRange?.end) params.append('to', filters.dateRange.end + ' 23:59:59');
                if (filters.teamId) params.append('teamId', Array.isArray(filters.teamId) ? filters.teamId.join(',') : filters.teamId);
                // We don't append ownerId array from parent because we only fetch for THIS specific owner
                
                const baseUrl = (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
                const response = await fetch(`${baseUrl}/opportunities-leaderboard/${ownerId}/details?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch open pipeline details');

                const resData = await response.json();
                setData(resData.value);
            } catch (error) {
                console.error(error);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        if (ownerId) fetchDetails();
    }, [ownerId, filters]);

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-medium animate-pulse text-xs">Yükleniyor...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-rose-500 font-medium text-xs">Detaylar alınamadı.</div>;
    }

    const formatVal = (item: any) => mode === 'amount' ? `${formatCurrency(item.amount)}₺` : `${item.count} Adet`;

    const renderBarChart = (items: any[], labelKey: string = 'label', title: string, isDealType: boolean = false) => {
        if (!items || items.length === 0) return null;
        const maxVal = Math.max(...items.map(i => mode === 'amount' ? i.amount : i.count), 1);
        
        return (
            <div className="bg-slate-100 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-3">{title}</span>
                <div className="space-y-3">
                    {items.map((i, idx) => {
                        const val = mode === 'amount' ? i.amount : i.count;
                        const pct = (val / maxVal) * 100;
                        return (
                            <div key={idx}>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="truncate pr-2 font-medium text-slate-700 dark:text-slate-300" title={isDealType && DEAL_TYPE_KEYS[i.key] ? t(DEAL_TYPE_KEYS[i.key]) : (i[labelKey] || i.key)}>
                                        {isDealType && DEAL_TYPE_KEYS[i.key] ? t(DEAL_TYPE_KEYS[i.key]) : (i[labelKey] || i.key)}
                                    </span>
                                    <span className="font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatVal(i)}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 pt-0 pl-16 flex flex-col gap-4 text-xs">
            {/* Header / Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex gap-6">
                    <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Açık Fırsat Adedi</span>
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{data.summary.count} Müşteri / Fırsat</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Açık Potansiyel (TL)</span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.summary.sumPotential)}₺</span>
                    </div>
                </div>
                
                {/* Mode Toggle */}
                <div className="flex items-center bg-white dark:bg-slate-700 p-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                    <button 
                        onClick={() => setMode('amount')}
                        className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-colors", mode === 'amount' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600")}
                    >
                        CİRO (TL)
                    </button>
                    <button 
                        onClick={() => setMode('count')}
                        className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-colors", mode === 'count' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600")}
                    >
                        ADET
                    </button>
                </div>
            </div>

            {/* Distributions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderBarChart(data.byStage, 'label', 'SATIŞ AŞAMASI (STAGE)')}
                {renderBarChart(data.byAccountTop10, 'accountName', 'EN YÜKSEK 10 POTANSİYEL')}
                {renderBarChart(data.byType, 'label', 'FIRSAT TİPİ (DEAL TYPE)', true)}
                {renderBarChart(data.byAgingBuckets, 'label', 'YAŞLANDIRMA (0-60+ GÜN)')}
            </div>

            {/* Risky Opportunities */}
            {data.riskyTop10 && data.riskyTop10.length > 0 && (
                <div className="bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                        <AlertTriangle size={14} />
                        Riske Giren / Yaşlanmış Fırsatlar (Top 10)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {data.riskyTop10.map((risk: any, rIdx: number) => (
                            <div key={risk.opportunityId || rIdx} className="bg-white dark:bg-slate-800 p-2.5 rounded border border-rose-100 dark:border-rose-900/50 flex justify-between items-center group hover:border-rose-300 transition-colors">
                                <div className="min-w-0 pr-2">
                                    <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">{risk.name}</div>
                                    <div className="text-[10px] text-slate-500 truncate">{risk.accountName} • {risk.stageLabel}</div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">{formatCurrency(risk.potentialAmount)}₺</span>
                                    <span className="text-[9px] font-medium text-slate-400">{risk.ageDays} Gün • %{risk.probability} Olasılık</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
