import { useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

import { cn } from '../../lib/utils';

export function ProductPerformance() {
    const { deals } = useData();

    const productStats = useMemo(() => {
        const stats: Record<string, { revenue: number, count: number, growth: number }> = {};

        deals.forEach(deal => {
            if (!stats[deal.product]) {
                stats[deal.product] = { revenue: 0, count: 0, growth: Math.floor(Math.random() * 40) - 10 }; // mocked growth
            }
            stats[deal.product].revenue += deal.value;
            stats[deal.product].count += 1;
        });

        return Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
    }, [deals]);

    return (
        <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {productStats.map(([product, stat]) => (
                <Card key={product} className="flex flex-col justify-between group hover:border-indigo-500/30 transition-all cursor-pointer">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <Package size={16} />
                            </div>
                            <div className={cn(
                                "flex items-center text-xs font-bold",
                                stat.growth >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                                {stat.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {Math.abs(stat.growth)}%
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{product}</h3>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            ${(stat.revenue / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            {stat.count} active deals
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
