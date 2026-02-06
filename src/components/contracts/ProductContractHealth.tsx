import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent } from '../ui/Card';
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
        <div>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {t('contracts.productHealth.title')}
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {productStats.map(([product, stat]) => {
                    const color = PRODUCT_COLORS[product as ProductGroup] || '#64748b';
                    const riskPercentage = stat.activeValue > 0 ? (stat.riskValue / stat.activeValue) * 100 : 0;
                    const isHighRisk = riskPercentage > 30;
                    const isMediumRisk = riskPercentage > 10 && riskPercentage <= 30;

                    return (
                        <Card
                            key={product}
                            className="flex flex-col justify-between group hover:border-[--hover-color] transition-all cursor-pointer bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md"
                            style={{ '--hover-color': color } as React.CSSProperties}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div
                                        className="p-1.5 rounded-lg transition-colors"
                                        style={{ backgroundColor: `${color}15`, color: color }}
                                    >
                                        <Package size={16} />
                                    </div>
                                    <div className={cn(
                                        "flex items-center text-xs font-bold gap-1",
                                        isHighRisk ? "text-rose-500" : isMediumRisk ? "text-amber-500" : "text-emerald-500"
                                    )} title="Renewal Risk (90d)">
                                        {isHighRisk ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                        {Math.round(riskPercentage)}% {t('common.risk', { defaultValue: 'Risk' })}
                                    </div>
                                </div>

                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{product}</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(stat.activeValue)}
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex justify-between">
                                    <span>{stat.count} {t('contracts.kpis.activeContracts')}</span>
                                    <span className="opacity-70">{formatCurrency(stat.riskValue)} {t('contracts.kpis.sub.atRiskValue', { defaultValue: 'Risk Altında' })}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
