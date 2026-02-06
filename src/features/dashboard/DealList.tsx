import { Badge } from '../../components/ui/Badge';
import type { Deal } from '../../types/crm';

// Simple date formatter to avoid dependency for now if I don't want to install date-fns yet
const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
};

interface DealListProps {
    deals: Deal[];
}

export function DealList({ deals }: DealListProps) {
    if (deals.length === 0) {
        return <div className="text-center py-8 text-slate-500">No deals found for this criteria.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">Deal</th>
                        <th className="px-4 py-3">Stage</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Aging</th>
                        <th className="px-4 py-3 rounded-r-lg">Last Activity</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                                <div>{deal.title}</div>
                                <div className="text-xs text-slate-500 font-normal">{deal.customerName}</div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant="outline" className="whitespace-nowrap">{deal.stage}</Badge>
                            </td>
                            <td className="px-4 py-3 font-mono">
                                ${deal.value.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                                <span className={deal.aging > 30 ? "text-amber-500 font-semibold" : "text-slate-600"}>
                                    {deal.aging} days
                                </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                                {formatDate(deal.lastActivityDate)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
