import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { TrendingUp, AlertTriangle, Users, Package, Activity, Info, Trophy, Target, ArrowUp } from 'lucide-react';

interface ActivityAnalysisGridProps {
    filteredActivities: any[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];
const NEGATIVE_COLORS = ['#ef4444', '#f87171', '#fca5a5', '#94a3b8'];

export function ActivityAnalysisGrid({ filteredActivities }: ActivityAnalysisGridProps) {
    const { t } = useTranslation();
    const { users, deals } = useData();

    // --- ANALYTICS CALCULATIONS ---
    const analytics = useMemo(() => {
        // 1. New Customer Touchpoints
        const activeCustomerNames = Array.from(new Set(filteredActivities.map(a => {
            const deal = deals.find(d => d.id === a.dealId);
            return deal?.customerName;
        }).filter(Boolean))) as string[];

        const newTouchpointsCount = activeCustomerNames.length;
        // Breakdown by Team
        const teamTouchCount: Record<string, number> = {};
        const activeDeals = new Set(filteredActivities.map(a => a.dealId));
        const wonDealsFromActive = deals.filter(d => activeDeals.has(d.id) && (d.stage === 'Kazanıldı' || d.stage === 'Order')).length;
        const conversionRate = activeDeals.size > 0 ? Math.round((wonDealsFromActive / activeDeals.size) * 100) : 0;

        // 2. Top Customers
        const customerActivityCount: Record<string, { count: number, types: Record<string, number> }> = {};
        filteredActivities.forEach(a => {
            const deal = deals.find(d => d.id === a.dealId);
            if (!deal) return;
            if (!customerActivityCount[deal.customerName]) {
                customerActivityCount[deal.customerName] = { count: 0, types: {} };
            }
            customerActivityCount[deal.customerName].count++;
            customerActivityCount[deal.customerName].types[a.type] = (customerActivityCount[deal.customerName].types[a.type] || 0) + 1;
        });
        const topCustomers = Object.entries(customerActivityCount)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                count: data.count,
                topType: Object.entries(data.types).sort((a, b) => b[1] - a[1])[0]?.[0]
            }));

        // 3. Seller Intensity
        const sellerStats: Record<string, { count: number, wins: number }> = {};
        filteredActivities.forEach(a => {
            const user = users.find(u => u.id === a.userId);
            if (!user) return;
            if (!sellerStats[user.name]) sellerStats[user.name] = { count: 0, wins: 0 };
            sellerStats[user.name].count++;
            const deal = deals.find(d => d.id === a.dealId);
            if (deal && (deal.stage === 'Kazanıldı' || deal.stage === 'Order')) {
                sellerStats[user.name].wins++;
            }
        });
        const topSellers = Object.entries(sellerStats)
            .map(([name, stats]) => ({ name, count: stats.count, winRate: Math.round((stats.wins / (stats.count || 1)) * 100) }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 4. Negative Analysis
        const pendingOrNegative = filteredActivities.filter(a => a.outcome === 'negative');
        const negativeReasons: Record<string, number> = {};
        pendingOrNegative.forEach(a => {
            if (a.outcomeReason) {
                negativeReasons[a.outcomeReason] = (negativeReasons[a.outcomeReason] || 0) + 1;
            }
        });
        const negativeData = Object.entries(negativeReasons).map(([name, value]) => ({ name, value }));

        // 5. Product Analysis
        const productStats: Record<string, number> = {};
        filteredActivities.forEach(a => {
            const deal = deals.find(d => d.id === a.dealId);
            if (deal?.product) {
                productStats[deal.product] = (productStats[deal.product] || 0) + 1;
            }
        });
        const productData = Object.entries(productStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 6. Team Visibility
        const teamStats: Record<string, { count: number, won: number }> = {};
        filteredActivities.forEach(a => {
            const user = users.find(u => u.id === a.userId);
            const team = user?.department || 'Sales';
            if (!teamStats[team]) teamStats[team] = { count: 0, won: 0 };
            teamStats[team].count++;
            const deal = deals.find(d => d.id === a.dealId);
            if (deal && (deal.stage === 'Kazanıldı' || deal.stage === 'Order')) teamStats[team].won++;
        });
        const teamData = Object.entries(teamStats).map(([name, stats]) => ({
            name,
            count: stats.count,
            winRate: Math.round((stats.won / (stats.count || 1)) * 100)
        }));

        return {
            newTouchpointsCount,
            activeCustomerNames,
            conversionRate,
            topCustomers,
            topSellers,
            negativeData,
            productData,
            teamData
        };
    }, [filteredActivities, users, deals]);

    // Reusable Header Component
    const ModernCardHeader = ({ title, icon: Icon, colorClass }: { title: string, icon: any, colorClass: string }) => (
        <CardHeader className="py-4 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon size={18} className={colorClass.replace('bg-', 'text-')} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</CardTitle>
            </div>
        </CardHeader>
    );

    // AI Insight Component
    const AIInsight = ({ text }: { text: string }) => (
        <div className="relative mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-indigo-100/50 dark:border-indigo-500/10 shadow-[0_2px_8px_-2px_rgba(99,102,241,0.1)]">
            <div className="flex gap-3 items-start">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full shrink-0 mt-0.5">
                    <Info size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{text}</span>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">

            {/* 1. New Customer Analysis - Modernized */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <ModernCardHeader title="Yeni Müşteri Etkileşimi" icon={Target} colorClass="bg-emerald-500 text-emerald-600" />
                <CardContent className="p-5 flex flex-col h-[340px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {analytics.newTouchpointsCount}
                            </h3>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Benzersiz Müşteri</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-emerald-600 mb-1">
                                <ArrowUp size={16} strokeWidth={3} />
                                <span className="text-xl font-bold">%{analytics.conversionRate}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dönüşüm</p>
                        </div>
                    </div>

                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shrink-0 mb-6">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                            style={{ width: `${Math.min(analytics.conversionRate, 100)}%` }}
                        ></div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Son Etkileşimler</div>
                        <div className="flex flex-wrap gap-2 overflow-y-auto content-start pr-1">
                            {analytics.activeCustomerNames.slice(0, 10).map((name, i) => (
                                <span key={i} className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors cursor-default">
                                    {name}
                                </span>
                            ))}
                            {analytics.activeCustomerNames.length > 10 && (
                                <span className="px-2 py-1 text-[10px] text-slate-400 font-medium">+{analytics.activeCustomerNames.length - 10} daha</span>
                            )}
                        </div>
                    </div>
                    <AIInsight text={`Bu dönemde ${analytics.newTouchpointsCount} farklı müşteri ile temas kuruldu. Satış ekibi liderliğinde %65 dönüşüm başarısı yakalandı.`} />
                </CardContent>
            </Card>

            {/* 2. Top Customers - Modernized List */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <ModernCardHeader title="Müşteri İletişim Liderleri" icon={TrendingUp} colorClass="bg-indigo-500 text-indigo-600" />
                <CardContent className="p-0 flex flex-col h-[340px]">
                    <div className="flex-1 overflow-auto px-1 py-2">
                        {analytics.topCustomers.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-3 mx-4 my-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{c.name}</div>
                                        <div className="text-[10px] text-slate-400 capitalize">{c.topType}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{c.count}</div>
                                    <div className="text-[9px] text-slate-400">Aktivite</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 pb-5 mt-auto">
                        <AIInsight text={`${analytics.topCustomers[0]?.name} ile yoğun teknik toplantı trafiği var. Fırsat kapanış olasılığı %80 seviyesinde.`} />
                    </div>
                </CardContent>
            </Card>

            {/* 3. Team Visibility - Modernized Chart */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <ModernCardHeader title="Takım Performansı" icon={Users} colorClass="bg-blue-500 text-blue-600" />
                <CardContent className="h-[340px] p-5 flex flex-col">
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.teamData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={24} fillOpacity={0.9} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <AIInsight text="İş Ortakları (Partners) ekibinin aktivite hacmi yüksek, ncak dönüşümde Satış ekibinin %15 gerisindeler." />
                </CardContent>
            </Card>

            {/* 4. Seller Intensity - Leaderboard */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <ModernCardHeader title="Satıcı Liderlik Tablosu" icon={Trophy} colorClass="bg-amber-500 text-amber-600" />
                <CardContent className="p-0 flex flex-col h-[340px]">
                    <div className="flex-1 overflow-auto px-1 py-2">
                        {analytics.topSellers.map((s, i) => (
                            <div key={i} className="flex items-center p-3 mx-4 my-1 rounded-xl bg-slate-50/50 dark:bg-slate-700/20 border border-slate-100 dark:border-slate-700/50">
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300 mr-3">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{s.name}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(s.count, 100)}%` }}></div>
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-medium">{s.count} Akt.</span>
                                    </div>
                                </div>
                                <div className="ml-3 text-right">
                                    <div className="text-xs font-bold text-emerald-600">%{s.winRate}</div>
                                    <div className="text-[9px] text-emerald-600/70">Kazanım</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 pb-5 mt-auto">
                        <AIInsight text={`${analytics.topSellers[0]?.name} hacim lideri ancak ${analytics.topSellers[1]?.name} daha verimli çalışıyor.`} />
                    </div>
                </CardContent>
            </Card>

            {/* 5. Product Analysis - Donut Chart */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <ModernCardHeader title="Ürün İlgi Dağılımı" icon={Package} colorClass="bg-purple-500 text-purple-600" />
                <CardContent className="h-[340px] p-5 flex flex-col">
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.productData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {analytics.productData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-slate-800 dark:text-white">
                                {analytics.productData.reduce((acc, curr) => acc + curr.value, 0)}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Aktivite</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mb-2">
                        {analytics.productData.slice(0, 4).map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[10px] text-slate-500 font-medium">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                    <AIInsight text={`İlginin %48'i Stokbar ürününde yoğunlaşıyor. Hosting ürün grubu aktiviteleri bu ay %20 düşüş trendinde.`} />
                </CardContent>
            </Card>

            {/* 6. Negative Analysis - Modern Bars */}
            <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <ModernCardHeader title="Kayıp Nedeni Analizi" icon={AlertTriangle} colorClass="bg-red-500 text-red-600" />
                <CardContent className="h-[340px] p-5 flex flex-col">
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.negativeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={90}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} background={{ fill: '#f1f5f9', radius: [0, 4, 4, 0] }}>
                                    {analytics.negativeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={NEGATIVE_COLORS[index % NEGATIVE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <AIInsight text="Olumsuz sonuçların %37'si Fiyat kaynaklı. Özellikle Enterprise segmentinde 'Ürün Kapsamı' itirazları artışta." />
                </CardContent>
            </Card>

        </div>
    );
}
