import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Users, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Contract } from '../../types/crm';
import { useTranslation } from 'react-i18next';

export const ContractOwnershipPanel = () => {
    const { contracts } = useData();
    const { t } = useTranslation();

    const ownershipData = useMemo(() => {
        const ownerMap: Record<string, { count: number, riskValue: number, highRiskCount: number, name: string }> = {};

        contracts.filter(c => c.status === 'Active').forEach((c: Contract) => {
            if (!ownerMap[c.ownerName]) {
                ownerMap[c.ownerName] = { count: 0, riskValue: 0, highRiskCount: 0, name: c.ownerName };
            }
            ownerMap[c.ownerName].count++;

            // Risk Calculation (Next 90 Days)
            if (c.daysToRenewal <= 90) {
                ownerMap[c.ownerName].riskValue += c.totalValueTL;
                if (c.riskLevel === 'High') {
                    ownerMap[c.ownerName].highRiskCount++;
                }
            }
        });

        return Object.values(ownerMap)
            .sort((a, b) => b.riskValue - a.riskValue)
            .slice(0, 5); // Top 5 by risk exposure
    }, [contracts]);

    return (
        <Card className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 bg-white/30 dark:bg-white/5 flex flex-row items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Users size={18} />
                </div>
                <div>
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        {t('contracts.ownership.title') || "Contract Ownership & Risk"}
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {t('contracts.ownership.subtitle') || "Accountability for upcoming renewals"}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {ownershipData.map((owner, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {owner.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{owner.name}</p>
                                    <p className="text-[10px] text-slate-500">{owner.count} {t('contracts.calendar.contracts', { defaultValue: 'Contracts' })}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {formatCurrency(owner.riskValue)}
                                </p>
                                {owner.highRiskCount > 0 && (
                                    <div className="flex items-center justify-end gap-1 text-[10px] text-red-500 font-medium">
                                        <AlertTriangle size={10} />
                                        <span>{owner.highRiskCount} {t('contracts.calendar.highRisk', { defaultValue: 'High Risk' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
