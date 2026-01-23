import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { mockDeals } from '../../data/mockData';
import { Calendar } from 'lucide-react';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { PipelineAIInsightPanel } from './PipelineAIInsightPanel';

const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-3 text-xs border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl">
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{payload[0].payload.name}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                    <p className="text-slate-500 dark:text-slate-400">
                        {payload[0].name}: <span className="text-slate-900 dark:text-white font-mono">{formatCurrency(payload[0].value)}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

const DashboardGridCard = ({ title, data, dataKey, color, className = "" }: any) => (
    <Card className={`bg-white/40 dark:bg-white/5 backdrop-blur-md border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none ${className}`}>
        <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5">
            <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="h-[240px] pt-6 pr-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" className="dark:stroke-[rgba(255,255,255,0.05)]" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 500 }}
                        className="text-slate-500 dark:text-slate-400"
                        width={90}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)', className: 'dark:fill-[rgba(255,255,255,0.03)]' }} />
                    <Bar
                        dataKey={dataKey}
                        fill={color}
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
);

const StatCard = ({ label, value, colorClass }: { label: string; value: string; colorClass: string }) => (
    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm dark:shadow-xl h-full min-h-[100px]">
        <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-bold mb-2">
            {label}
        </span>
        <span className={`text-xl lg:text-2xl font-light tracking-tight ${colorClass}`}>
            {value}
        </span>
    </div>
);

const DATE_FILTERS = [
    { label: 'Tümü', value: 'all' },
    { label: 'Bugün', value: 'today' },
    { label: 'Dün', value: 'yesterday' },
    { label: 'Bu Hafta', value: 'this_week' },
    { label: 'Geçen Hafta', value: 'last_week' },
    { label: 'Önceki Hafta', value: 'prev_week' },
    { label: 'Bu Ay', value: 'this_month' },
    { label: 'Geçen Ay', value: 'last_month' },
    { label: 'Önceki Ay', value: 'prev_month' },
    { label: 'Bu Yıl', value: 'this_year' },
    { label: 'Geçen Yıl', value: 'last_year' },
    { label: 'Önceki Yıl', value: 'prev_year' },
    { label: 'Bu Çeyrek', value: 'this_quarter' },
    { label: 'Geçen Çeyrek', value: 'last_quarter' },
    { label: 'Özel Aralık...', value: 'custom' },
];

export function OpportunityDashboard() {
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const filteredDeals = useMemo(() => {
        if (dateFilter === 'all') return mockDeals;

        const now = new Date();
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        return mockDeals.filter(deal => {
            const dealDate = new Date(deal.createdAt).getTime();

            switch (dateFilter) {
                case 'today':
                    return dealDate >= todayAtMidnight;
                case 'yesterday':
                    return dealDate >= (todayAtMidnight - 86400000) && dealDate < todayAtMidnight;
                case 'this_month':
                    return new Date(deal.createdAt).getMonth() === now.getMonth() && new Date(deal.createdAt).getFullYear() === now.getFullYear();
                case 'last_month': {
                    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                    return new Date(deal.createdAt).getMonth() === lm && new Date(deal.createdAt).getFullYear() === ly;
                }
                case 'this_year':
                    return new Date(deal.createdAt).getFullYear() === now.getFullYear();
                case 'custom':
                    if (!customRange.start || !customRange.end) return true;
                    // Fix: Set start to beginning of day, end to end of day for range
                    const start = new Date(customRange.start);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(customRange.end);
                    end.setHours(23, 59, 59, 999);
                    return dealDate >= start.getTime() && dealDate <= end.getTime();
                default:
                    return true;
            }
        });
    }, [dateFilter, customRange]);

    const metrics = useMemo(() => {
        const count = filteredDeals.length;
        const lost = filteredDeals.filter(d => ['Kaybedildi', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        const won = filteredDeals.filter(d => ['Kazanıldı', 'Order'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        const open = filteredDeals.filter(d => !['Kazanıldı', 'Kaybedildi', 'Order', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
        const total = won + open + lost;

        return { count, lost, won, open, total };
    }, [filteredDeals]);

    const chartData = useMemo(() => {
        const dataMaps: Record<string, Record<string, number>> = {
            sourceCount: {}, sourceRev: {}, customerRev: {}, ownerRev: {}, topicRev: {}, statusRev: {}
        };

        filteredDeals.forEach(d => {
            dataMaps.sourceCount[d.source] = (dataMaps.sourceCount[d.source] || 0) + 1;
            dataMaps.sourceRev[d.source] = (dataMaps.sourceRev[d.source] || 0) + d.value;
            dataMaps.customerRev[d.customerName] = (dataMaps.customerRev[d.customerName] || 0) + d.value;
            dataMaps.ownerRev[d.ownerId] = (dataMaps.ownerRev[d.ownerId] || 0) + d.value;
            dataMaps.topicRev[d.topic] = (dataMaps.topicRev[d.topic] || 0) + d.value;
            dataMaps.statusRev[d.stage] = (dataMaps.statusRev[d.stage] || 0) + d.value;
        });

        const sortAndLimit = (map: Record<string, number>, key: string) =>
            Object.entries(map)
                .map(([name, val]) => ({ name, [key]: val }))
                .sort((a, b) => (b[key] as number) - (a[key] as number))
                .slice(0, 8);

        return {
            sourceCount: sortAndLimit(dataMaps.sourceCount, 'count'),
            sourceRev: sortAndLimit(dataMaps.sourceRev, 'revenue'),
            customerRev: sortAndLimit(dataMaps.customerRev, 'revenue'),
            ownerRev: sortAndLimit(dataMaps.ownerRev, 'revenue'),
            topicRev: sortAndLimit(dataMaps.topicRev, 'revenue'),
            statusRev: sortAndLimit(dataMaps.statusRev, 'revenue'),
        };
    }, [filteredDeals]);

    const handleFilterChange = (val: string) => {
        if (val === 'custom') {
            setShowDatePicker(true);
        } else {
            setDateFilter(val);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {showDatePicker && (
                <DateRangePicker
                    startDate={customRange.start}
                    endDate={customRange.end}
                    onChange={(s, e) => {
                        setCustomRange({ start: s, end: e });
                        if (s && e) {
                            setDateFilter('custom');
                        }
                    }}
                    onClose={() => setShowDatePicker(false)}
                />
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-light tracking-tight text-slate-900 dark:text-white">Pipeline Intelligence</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time analytical breakdown of your opportunity funnel.</p>
                </div>

                {/* Date Filter Dropdown */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Calendar size={16} />
                    </div>
                    <select
                        value={dateFilter === 'custom' && showDatePicker ? 'custom' : dateFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="appearance-none bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-xl px-10 py-2.5 text-sm text-slate-900 dark:text-white font-medium cursor-pointer transition-all outline-none ring-offset-slate-950 focus:ring-2 focus:ring-indigo-500/50 w-[220px]"
                    >
                        {DATE_FILTERS.map(f => (
                            <option key={f.value} value={f.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white py-2">
                                {f.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* AI Brief + KPI Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* AI Brief (Sidebar) */}
                <PipelineAIInsightPanel
                    currentDeals={filteredDeals}
                    allDeals={mockDeals}
                    dateFilter={dateFilter}
                    customRange={customRange}
                    className="lg:col-span-1"
                />

                {/* KPI Cards Grid (Main Content next to AI Brief) */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Filtre"
                        value={dateFilter === 'custom' && customRange.start && customRange.end
                            ? `${customRange.start.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} - ${customRange.end.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}`
                            : (DATE_FILTERS.find(f => f.value === dateFilter)?.label || 'Tümü')
                        }
                        colorClass="text-indigo-600 dark:text-indigo-400 font-medium italic"
                    />
                    <StatCard label="Fırsat Adeti" value={metrics.count.toString()} colorClass="text-slate-900 dark:text-white font-medium" />
                    <StatCard label="Kaybedilen" value={`$${formatCurrency(metrics.lost)}`} colorClass="text-rose-600 dark:text-rose-400 font-medium" />
                    <StatCard label="Kazanılan" value={`$${formatCurrency(metrics.won)}`} colorClass="text-emerald-600 dark:text-emerald-400 font-medium" />
                    <StatCard label="Fırsat Havuzu" value={`$${formatCurrency(metrics.open)}`} colorClass="text-sky-600 dark:text-sky-400 font-medium" />
                    <StatCard label="Toplam Ciro" value={`$${formatCurrency(metrics.total)}`} colorClass="text-indigo-700 dark:text-indigo-300 font-medium" />
                </div>
            </div>

            {/* Dynamic Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <DashboardGridCard title="Fırsat Kaynağı (Adet)" data={chartData.sourceCount} dataKey="count" color="#818cf8" />
                <DashboardGridCard title="Fırsat Kaynağı (Ciro)" data={chartData.sourceRev} dataKey="revenue" color="#6366f1" />
                <DashboardGridCard title="Aşamaya Göre Gelir" data={chartData.statusRev} dataKey="revenue" color="#4f46e5" />
                <DashboardGridCard title="Müşteri Potansiyeli" data={chartData.customerRev} dataKey="revenue" color="#0ea5e9" />
                <DashboardGridCard title="Satış Sahibi Performansı" data={chartData.ownerRev} dataKey="revenue" color="#38bdf8" />
                <DashboardGridCard title="Konu Bazlı Dağılım" data={chartData.topicRev} dataKey="revenue" color="#7dd3fc" />
            </div>
        </div>
    );
}
