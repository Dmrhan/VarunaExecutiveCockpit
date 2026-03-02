import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Contract, ProductGroup } from '../../types/crm';
import { useTranslation } from 'react-i18next';
import { PRODUCT_COLORS } from '../../data/mockData';
import { cn } from '../../lib/utils';

export const ProductContractHealth = () => {
    const { contracts } = useData();
    const { t } = useTranslation();

    const productStats = useMemo(() => {
        const stats: Record<string, { activeValue: number, count: number, riskValue: number }> = {};

        // Initialize with 0 for all known products
        const products: ProductGroup[] = ['EnRoute', 'Stokbar', 'Hosting', 'ServiceCore', 'Quest', 'Varuna'];
        products.forEach(p => {
            stats[p] = { activeValue: 0, count: 0, riskValue: 0 };
        });

        contracts.filter(c => c.status === 'Active').forEach((c: Contract) => {
            const group = c.productGroup as ProductGroup;
            if (stats[group]) {
                stats[group].activeValue += c.totalValueTL;
                stats[group].count += 1;
                if (c.daysToRenewal <= 90) {
                    stats[group].riskValue += c.totalValueTL;
                }
            }
        });

        return Object.entries(stats)
            .filter(([name]) => products.includes(name as ProductGroup))
            .sort((a, b) => b[1].activeValue - a[1].activeValue);
    }, [contracts]);

    return (
        <Card className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm flex flex-col h-full">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Package size={18} />
                </div>
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {t('contracts.productHealth.title') || "Product Contract Performance"}
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {t('contracts.productHealth.subtitle') || "Active portfolio and renewal risk by product"}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productStats.map(([product, stat]) => {
                        const color = PRODUCT_COLORS[product as ProductGroup] || '#64748b';
                        const riskPercentage = stat.activeValue > 0 ? (stat.riskValue / stat.activeValue) * 100 : 0;
                        const isHighRisk = riskPercentage > 30;
                        const isMediumRisk = riskPercentage > 10 && riskPercentage <= 30;

                        return (
                            <div
                                key={product}
                                className="flex flex-col justify-between p-4 rounded-xl transition-all cursor-pointer bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 hover:border-[--hover-color]"
                                style={{ '--hover-color': color } as React.CSSProperties}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ backgroundColor: `${color}15`, color: color }}
                                    >
                                        <Package size={14} />
                                    </div>
                                    <div className={cn(
                                        "flex items-center text-[10px] font-bold gap-1",
                                        isHighRisk ? "text-rose-500" : isMediumRisk ? "text-amber-500" : "text-emerald-500"
                                    )} title="Renewal Risk (90d)">
                                        {isHighRisk ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                        {Math.round(riskPercentage)}% {t('common.risk', { defaultValue: 'Risk' })}
                                    </div>
                                </div>

                                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{product}</h3>
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                                    {formatCurrency(stat.activeValue)}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 flex justify-between gap-1">
                                    <span className="truncate">{stat.count} {t('status.Active', { defaultValue: 'Aktif' })}</span>
                                    <span className="opacity-70 truncate">{formatCurrency(stat.riskValue)} {t('common.risk', { defaultValue: 'Risk' })}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
