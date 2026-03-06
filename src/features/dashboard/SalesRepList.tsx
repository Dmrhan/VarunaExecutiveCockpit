import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Deal, User } from '../../types/crm';
import { formatCurrency } from '../../utils/formatters';

interface SalesRepListProps {
    deals: Deal[];
    users: User[];
}

export const SalesRepList = ({ deals, users }: SalesRepListProps) => {
    const { t } = useTranslation();

    const repPerformance = useMemo(() => {
        const stats: Record<string, { userId: string; name: string; avatar: string; totalRevenue: number; wonDeals: number; totalDeals: number }> = {};

        deals.forEach(deal => {
            if (!stats[deal.ownerId]) {
                const user = users.find(u => u.id === deal.ownerId);
                stats[deal.ownerId] = {
                    userId: deal.ownerId,
                    name: deal.ownerName || user?.name || deal.ownerId,
                    avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(deal.ownerName || user?.name || deal.ownerId)}&background=random`,
                    totalRevenue: 0,
                    wonDeals: 0,
                    totalDeals: 0
                };
            }

            stats[deal.ownerId].totalDeals++;

            // Sadece kazanılan fırsatların cirosunu topla (Satış yapıldı olarak kabul ediyoruz)
            if (['Order', 'Kazanıldı'].includes(deal.stage)) {
                stats[deal.ownerId].totalRevenue += deal.value;
                stats[deal.ownerId].wonDeals++;
            }
        });

        return Object.values(stats)
            .filter(rep => rep.totalRevenue > 0) // Sadece satış yapanları göster
            .sort((a, b) => b.totalRevenue - a.totalRevenue); // Ciroya göre büyükten küçüğe sırala
    }, [deals, users]);

    if (repPerformance.length === 0) {
        return (
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-sm col-span-full">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Users size={16} className="text-indigo-500" />
                        {t('opportunities.salesRepList', 'Satış Temsilcisi Performansı (Kazanılan)')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-slate-500 text-sm">
                        {t('opportunities.noSalesInPeriod', 'Seçili tarih aralığında kazanılmış fırsat bulunamadı.')}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-slate-200 dark:border-slate-700 shadow-sm col-span-full overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" />
                        {t('opportunities.salesRepList', 'Satış Temsilcisi Performansı (Kazanılan)')}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {repPerformance.length} {t('common.records', 'Kayıt')}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">{t('opportunities.repName', 'Satış Temsilcisi')}</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">{t('opportunities.wonRevenue', 'Kazanılan Ciro')}</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">{t('opportunities.wonDealsCount', 'Kazanılan Fırsat')}</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-center">{t('opportunities.winRate', 'Kazanma Oranı')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {repPerformance.map((rep, index) => {
                                const rank = index + 1;
                                const isTop3 = rank <= 3;
                                const winRate = rep.totalDeals > 0 ? (rep.wonDeals / rep.totalDeals) * 100 : 0;

                                return (
                                    <tr key={rep.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                                    rank === 2 ? "bg-slate-200 text-slate-700 border border-slate-300" :
                                                        rank === 3 ? "bg-orange-100 text-orange-800 border border-orange-200" :
                                                            "text-slate-400"
                                            )}>
                                                {rank}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={rep.avatar} alt={rep.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" />
                                                <span className={cn("font-medium", isTop3 ? "text-slate-900 dark:text-white font-bold" : "text-slate-700 dark:text-slate-300")}>
                                                    {rep.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn(
                                                "font-mono font-bold text-lg",
                                                isTop3 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
                                            )}>
                                                {formatCurrency(rep.totalRevenue)}₺
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-800/50">
                                                {rep.wonDeals}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full", winRate > 50 ? "bg-emerald-500" : winRate > 30 ? "bg-amber-500" : "bg-rose-500")}
                                                        style={{ width: `${winRate}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                                                    %{Math.round(winRate)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
