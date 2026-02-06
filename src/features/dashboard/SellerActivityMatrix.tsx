import { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';

interface SellerActivityMatrixProps {
    filteredActivities: any[];
}

const ACTIVITY_TYPES = [
    'outbound_call', 'outbound_email', 'meeting', 'inbound_call', 'sales',
    'inbound_email', 'account_mgmt', 'other', 'contract', 'proposal',
    'support', 'renewal', 'proposal_followup', 'vacancy', 'training',
    'linkedin', 'demo', 'satisfaction', 'field_sales', 'proposal_verbal', 'retention'
];

export function SellerActivityMatrix({ filteredActivities }: SellerActivityMatrixProps) {
    const { users } = useData();
    const { t } = useTranslation();

    const matrixData = useMemo(() => {
        // Init pivot table
        const userMap: Record<string, Record<string, number>> = {};
        users.forEach(u => {
            userMap[u.id] = {};
            ACTIVITY_TYPES.forEach(type => userMap[u.id][type] = 0);
        });

        // Fill data
        filteredActivities.forEach(a => {
            if (userMap[a.userId]) {
                userMap[a.userId][a.type] = (userMap[a.userId][a.type] || 0) + 1;
            }
        });

        // Sort users by total activity
        const sortedUsers = users.map(u => {
            const counts = userMap[u.id];
            const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
            return { user: u, counts, total };
        }).sort((a, b) => b.total - a.total);

        return sortedUsers;
    }, [filteredActivities, users]);

    // Calculate max value for heatmap scaling
    const maxCellValue = useMemo(() => {
        let max = 0;
        matrixData.forEach(row => {
            Object.values(row.counts).forEach(v => {
                if (v > max) max = v;
            });
        });
        return max;
    }, [matrixData]);

    const getHeatmapColor = (value: number) => {
        if (value === 0) return 'bg-transparent text-slate-300';
        const intensity = value / (maxCellValue || 1);
        if (intensity < 0.2) return 'bg-orange-50 text-orange-700';
        if (intensity < 0.4) return 'bg-orange-100 text-orange-800';
        if (intensity < 0.6) return 'bg-red-200 text-red-900';
        if (intensity < 0.8) return 'bg-red-300 text-red-900';
        return 'bg-red-500 text-white font-bold';
    };

    // Helper for Translation Key (fallback to capital case)
    const getTypeLabel = (type: string) => {
        // Mapping based on user image if translation missing, 
        // strictly speaking we should look up `t('activities.types.' + type)`
        // If missing, format nicely.
        const key = `activities.types.${type}`;
        const translated = t(key);
        return translated !== key ? translated : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    Ekip Efor & Sonuç Matrisi (Detaylı)
                </h3>
                <div className="text-xs text-slate-400">
                    Isı Haritası: <span className="font-bold text-red-600">Yoğunluk</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 sticky top-0 z-10 font-bold shadow-sm">
                        <tr>
                            <th className="p-2 pl-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-20 border-r border-slate-200 dark:border-slate-700 min-w-[150px]">
                                Satış Temsilcisi
                            </th>
                            <th className="p-2 text-center border-l min-w-[60px] bg-slate-100 dark:bg-slate-800 text-slate-900 font-extrabold cursor-help" title="Toplam Aktivite">
                                TOP
                            </th>
                            {ACTIVITY_TYPES.map(type => (
                                <th key={type} className="p-2 text-center min-w-[80px] font-medium whitespace-nowrap border-r border-slate-100 dark:border-slate-700">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="truncate w-full block text-[10px] uppercase tracking-wide">{getTypeLabel(type)}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {matrixData.map((row) => (
                            <tr key={row.user.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="p-2 pl-4 font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700 group-hover:bg-indigo-50/30 dark:group-hover:bg-slate-800">
                                    <div className="flex items-center gap-2">
                                        <img src={row.user.avatar} className="w-6 h-6 rounded-full" alt="" />
                                        <span className="truncate">{row.user.name}</span>
                                    </div>
                                </td>
                                <td className="p-2 text-center font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 border-l border-r border-slate-200 dark:border-slate-700">
                                    {row.total}
                                </td>
                                {ACTIVITY_TYPES.map(type => (
                                    <td key={type} className="p-0 border-r border-slate-50 dark:border-slate-700/50">
                                        <div className={cn(
                                            "w-full h-full py-2.5 text-center flex items-center justify-center transition-all",
                                            getHeatmapColor(row.counts[type])
                                        )}>
                                            {row.counts[type] > 0 ? row.counts[type] : '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-[10px] text-center text-slate-400">
                ← Tabloyu yana kaydırarak tüm aktivite tiplerini görebilirsiniz →
            </div>
        </div>
    );
}
