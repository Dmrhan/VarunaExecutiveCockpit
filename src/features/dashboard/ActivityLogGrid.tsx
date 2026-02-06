import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useTranslation } from 'react-i18next';
import { Search, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

interface ActivityLogGridProps {
    activities: any[];
}

export function ActivityLogGrid({ activities }: ActivityLogGridProps) {
    const { t, i18n } = useTranslation();
    const { users, deals } = useData();
    const [filters, setFilters] = useState({
        global: '',
        customer: '',
        note: '',
        type: '',
        rep: ''
    });

    const filteredData = useMemo(() => {
        return activities.filter(activity => {
            const deal = deals.find(d => d.id === activity.dealId);
            const user = users.find(u => u.id === activity.userId);

            const customerVal = deal?.customerName?.toLowerCase() || '';
            const typeVal = activity.type?.toLowerCase() || '';
            const noteVal = (activity.notes || activity.subject || '').toLowerCase();
            const repVal = user?.name?.toLowerCase() || '';

            // Global Search
            const globalMatch = !filters.global ||
                customerVal.includes(filters.global.toLowerCase()) ||
                typeVal.includes(filters.global.toLowerCase()) ||
                noteVal.includes(filters.global.toLowerCase()) ||
                repVal.includes(filters.global.toLowerCase());

            // Column Filters
            const customerMatch = !filters.customer || customerVal.includes(filters.customer.toLowerCase());
            // Filter by raw type OR translated label
            const typeMatch = !filters.type ||
                typeVal.includes(filters.type.toLowerCase()) ||
                getActivityLabel(activity.type).toLowerCase().includes(filters.type.toLowerCase());
            const noteMatch = !filters.note || noteVal.includes(filters.note.toLowerCase());
            const repMatch = !filters.rep || repVal.includes(filters.rep.toLowerCase());

            return globalMatch && customerMatch && typeMatch && noteMatch && repMatch;
        });
    }, [activities, deals, users, filters]);

    const getActivityLabel = (type: string) => {
        const key = `activities.types.${type}`;
        const translated = t(key);
        return translated !== key ? translated : type.replace(/_/g, ' ').toUpperCase();
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getNextAction = (type: string, outcome?: string) => {
        if (outcome === 'negative') return { label: 'Kayıp Analizi', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };

        switch (type.toLowerCase()) {
            case 'meeting':
            case 'toplantı':
                return { label: 'Tutanak Paylaş', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
            case 'offer':
            case 'proposal':
            case 'teklif':
                return { label: 'Takip Et', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
            case 'demo':
                return { label: 'Karar İste', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
            case 'email':
            case 'e-posta':
                return { label: 'Yanıt Kontrol', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' };
            case 'call':
            case 'arama':
                return { label: 'Not Ekle', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
            default:
                return { label: 'Planlama Yap', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' };
        }
    };

    return (
        <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[500px]">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <FileText className="text-indigo-600 dark:text-indigo-400" size={18} />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-slate-800 dark:text-white">
                            Aktivite Kayıtları
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">Tüm temas geçmişi ve detaylar</p>
                    </div>
                </div>

                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                    <input
                        type="text"
                        placeholder="Genel Arama..."
                        value={filters.global}
                        onChange={(e) => handleFilterChange('global', e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </CardHeader>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 sticky top-0 z-10 font-semibold shadow-sm">
                        <tr>
                            <th className="p-3 pl-4 border-b dark:border-slate-700 min-w-[140px]">{t('activities.columns.customer')}</th>
                            <th className="p-3 border-b dark:border-slate-700 w-[30%]">{t('activities.columns.subject')} / Not</th>
                            <th className="p-3 border-b dark:border-slate-700 whitespace-nowrap">{t('activities.columns.type')}</th>
                            <th className="p-3 border-b dark:border-slate-700 whitespace-nowrap">{t('activities.columns.date')}</th>
                            <th className="p-3 border-b dark:border-slate-700 whitespace-nowrap">Sıradaki Adım</th>
                            <th className="p-3 border-b dark:border-slate-700">{t('activities.columns.rep')}</th>
                        </tr>
                        {/* Column Filters Row */}
                        <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                            <th className="p-2 pl-4">
                                <input
                                    type="text"
                                    placeholder="Filtrele..."
                                    value={filters.customer}
                                    onChange={(e) => handleFilterChange('customer', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-[10px] focus:outline-none focus:border-indigo-500 placeholder:text-slate-300 font-normal"
                                />
                            </th>
                            <th className="p-2">
                                <input
                                    type="text"
                                    placeholder="Filtrele..."
                                    value={filters.note}
                                    onChange={(e) => handleFilterChange('note', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-[10px] focus:outline-none focus:border-indigo-500 placeholder:text-slate-300 font-normal"
                                />
                            </th>
                            <th className="p-2">
                                <input
                                    type="text"
                                    placeholder="Tip..."
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-[10px] focus:outline-none focus:border-indigo-500 placeholder:text-slate-300 font-normal"
                                />
                            </th>
                            <th className="p-2">
                                {/* Date filter placeholder */}
                            </th>
                            <th className="p-2">
                                {/* Next Action placeholder */}
                            </th>
                            <th className="p-2 pr-4">
                                <input
                                    type="text"
                                    placeholder="Temsilci..."
                                    value={filters.rep}
                                    onChange={(e) => handleFilterChange('rep', e.target.value)}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-[10px] focus:outline-none focus:border-indigo-500 placeholder:text-slate-300 font-normal"
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredData.length > 0 ? (
                            filteredData.map((activity) => {
                                const deal = deals.find(d => d.id === activity.dealId);
                                const user = users.find(u => u.id === activity.userId);
                                const action = getNextAction(activity.type, activity.outcome);

                                return (
                                    <tr key={activity.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-3 pl-4 font-medium text-slate-700 dark:text-slate-300">
                                            <div className="flex flex-col">
                                                <span className="truncate max-w-[150px] font-bold text-slate-800 dark:text-slate-200">
                                                    {deal?.customerName || 'Bilinmiyor'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                                    {deal?.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-600 dark:text-slate-400">
                                            <div className="line-clamp-2 leading-relaxed">
                                                {activity.notes || activity.subject || '-'}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700 capitalize">
                                                {getActivityLabel(activity.type)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-500 font-medium whitespace-nowrap">
                                            {format(new Date(activity.date), 'd MMM yyyy', { locale: i18n.language === 'tr' ? tr : enUS })}
                                            <div className="text-[10px] text-slate-400">
                                                {format(new Date(activity.date), 'HH:mm')}
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold ${action.color}`}>
                                                {action.label}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={user?.avatar}
                                                    className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                                                    alt={user?.name}
                                                />
                                                <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[100px]" title={user?.name}>
                                                    {user?.name}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                    Aradığınız kriterlere uygun aktivite bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg flex justify-between items-center text-[10px] text-slate-400 px-4">
                <span>Toplam {filteredData.length} kayıt listeleniyor</span>
            </div>
        </Card>
    );
}
