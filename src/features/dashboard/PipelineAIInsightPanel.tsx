import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sparkles, TrendingUp, TrendingDown, Trophy, Zap,
    Snowflake, Target, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import type { Deal } from '../../types/crm';
import { cn } from '../../lib/utils';

interface PipelineAIInsightPanelProps {
    currentDeals: Deal[];
    allDeals: Deal[];
    dateFilter: string;
    customRange: { start: Date | null, end: Date | null };
    className?: string;
}

interface InsightCard {
    id: string;
    icon: React.ReactNode;
    label: string;
    title: string;
    value: string;
    sub?: string;
    accent: string; // Tailwind bg color class for icon area
    borderAccent: string;
}

const formatM = (v: number) => `${(v / 1_000_000).toFixed(1)}M₺`;

export function PipelineAIInsightPanel({ currentDeals, allDeals, dateFilter, customRange, className }: PipelineAIInsightPanelProps) {
    const { t } = useTranslation();
    const [page, setPage] = useState(0);
    const VISIBLE = 2;

    const cards: InsightCard[] = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const isOpen = (d: Deal) => !['Kazanıldı', 'Order', 'Kaybedildi', 'Lost'].includes(d.stage);

        // ── 1. Pipeline Momentumu ─────────────────────────────────────────────
        let prevDeals: Deal[] = [];
        if (dateFilter === 'today') {
            const yesterday = today - 86400000;
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt).getTime();
                return dt >= yesterday && dt < today;
            });
        } else if (dateFilter === 'this_month' || dateFilter === 'mtd') {
            const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt);
                return dt.getMonth() === lm && dt.getFullYear() === ly;
            });
        } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
            const duration = customRange.end.getTime() - customRange.start.getTime();
            const prevEnd = customRange.start.getTime();
            const prevStart = prevEnd - duration;
            prevDeals = allDeals.filter(d => {
                const dt = new Date(d.createdAt).getTime();
                return dt >= prevStart && dt < prevEnd;
            });
        } else {
            prevDeals = allDeals
                .filter(d => new Date(d.createdAt).getTime() < today)
                .slice(-Math.max(1, Math.floor(currentDeals.length * 0.9)));
        }

        const currentRev = currentDeals.reduce((s, d) => s + d.value, 0);
        const prevRev = prevDeals.length > 0 ? prevDeals.reduce((s, d) => s + d.value, 0) : 0;
        const revChange = prevRev === 0 ? (currentRev > 0 ? 100 : 0) : ((currentRev - prevRev) / prevRev) * 100;

        const topProductData = currentDeals.reduce((acc, d) => {
            if (d.product) acc[d.product] = (acc[d.product] || 0) + d.value;
            return acc;
        }, {} as Record<string, number>);
        const bestProduct = Object.entries(topProductData).sort((a, b) => b[1] - a[1])[0];

        const momentumCard: InsightCard = {
            id: 'momentum',
            icon: revChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
            label: 'Pipeline Momentumu',
            title: revChange >= 0
                ? `Pipeline %${Math.abs(revChange).toFixed(0)} büyüdü`
                : `Pipeline %${Math.abs(revChange).toFixed(0)} küçüldü`,
            value: revChange >= 0 ? `+%${Math.abs(revChange).toFixed(1)}` : `-%${Math.abs(revChange).toFixed(1)}`,
            sub: bestProduct ? `Lider ürün: ${bestProduct[0]}` : undefined,
            accent: revChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300',
            borderAccent: revChange >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
        };

        // ── 2. Risk Radari ────────────────────────────────────────────────────
        const stalledList = currentDeals.filter(d => d.aging > 30 && isOpen(d));
        const stalledVal = stalledList.reduce((s, d) => s + d.value, 0);

        const riskCard: InsightCard = {
            id: 'risk',
            icon: <AlertTriangle size={16} />,
            label: 'Risk Radari',
            title: stalledList.length > 0
                ? `${stalledList.length} fırsat 30+ gündür hareket etmiyor`
                : 'Kritik risk tespit edilmedi',
            value: stalledList.length > 0 ? formatM(stalledVal) : '—',
            sub: stalledList.length > 0 ? `${stalledList.length} fırsat müdahale bekliyor` : undefined,
            accent: stalledList.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-400',
            borderAccent: stalledList.length > 0 ? 'border-rose-500/20' : 'border-slate-500/20',
        };

        // ── 3. Bu Dönemin Kazanan Temsilcisi ──────────────────────────────────
        const wonByOwner = currentDeals
            .filter(d => d.stage === 'Kazanıldı' || d.stage === 'Order')
            .reduce((acc, d) => {
                const key = d.ownerName || d.ownerId;
                acc[key] = (acc[key] || 0) + d.value;
                return acc;
            }, {} as Record<string, number>);
        const topOwner = Object.entries(wonByOwner).sort((a, b) => b[1] - a[1])[0];
        const wonCountByOwner = currentDeals.filter(d =>
            (d.stage === 'Kazanıldı' || d.stage === 'Order') &&
            (d.ownerName || d.ownerId) === topOwner?.[0]
        ).length;

        const champCard: InsightCard = {
            id: 'champion',
            icon: <Trophy size={16} />,
            label: 'Dönemin Şampiyonu',
            title: topOwner ? topOwner[0] : 'Henüz kazanılan fırsat yok',
            value: topOwner ? formatM(topOwner[1]) : '—',
            sub: topOwner ? `${wonCountByOwner} kazanılan fırsat` : undefined,
            accent: 'bg-amber-500/20 text-amber-300',
            borderAccent: 'border-amber-500/20',
        };

        // ── 4. Kapanmaya Hazır ────────────────────────────────────────────────
        const thirtyDaysFromNow = today + 30 * 86400000;
        const closingDeals = currentDeals.filter(d => {
            if (!isOpen(d)) return false;
            const closeDate = d.expectedCloseDate ? new Date(d.expectedCloseDate).getTime() : null;
            const prob = d.probability ?? 0;
            return prob >= 70 && closeDate && closeDate <= thirtyDaysFromNow;
        });
        const closingVal = closingDeals.reduce((s, d) => s + d.value, 0);

        const closingCard: InsightCard = {
            id: 'closing',
            icon: <Zap size={16} />,
            label: 'Kapanmaya Hazır',
            title: closingDeals.length > 0
                ? `${closingDeals.length} fırsat bu ay kapanabilir`
                : 'Yakın kapanış beklentisi yok',
            value: closingDeals.length > 0 ? formatM(closingVal) : '—',
            sub: closingDeals.length > 0 ? `%70+ olasılık, 30 gün içinde` : undefined,
            accent: 'bg-sky-500/20 text-sky-300',
            borderAccent: 'border-sky-500/20',
        };

        // ── 5. En Uzun Bekleyen ───────────────────────────────────────────────
        const openSorted = currentDeals
            .filter(isOpen)
            .sort((a, b) => (b.aging ?? 0) - (a.aging ?? 0));
        const oldest = openSorted[0];

        const oldestCard: InsightCard = {
            id: 'oldest',
            icon: <Snowflake size={16} />,
            label: 'En Uzun Bekleyen',
            title: oldest
                ? oldest.customerName || 'Bilinmeyen Müşteri'
                : 'Donmuş fırsat yok',
            value: oldest ? `${oldest.aging} Gün` : '—',
            sub: oldest ? oldest.topic?.substring(0, 40) : undefined,
            accent: 'bg-cyan-500/20 text-cyan-300',
            borderAccent: 'border-cyan-500/20',
        };

        // ── 6. Kaybetme Eğilimi ───────────────────────────────────────────────
        const lostByStage = currentDeals
            .filter(d => d.stage === 'Kaybedildi' || d.stage === 'Lost')
            .reduce((acc, d) => {
                const prev = d.stage; // In real scenario we'd have previous stage; use DealType as proxy
                const key = d.source || 'Bilinmiyor';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        const topLostSource = Object.entries(lostByStage).sort((a, b) => b[1] - a[1])[0];
        const totalLost = Object.values(lostByStage).reduce((s, n) => s + n, 0);
        const lostRatio = totalLost > 0 && topLostSource
            ? Math.round((topLostSource[1] / totalLost) * 100)
            : 0;

        const lostTrendCard: InsightCard = {
            id: 'lost-trend',
            icon: <Target size={16} />,
            label: 'Kaybetme Eğilimi',
            title: topLostSource
                ? `Kayıpların %${lostRatio}'i "${topLostSource[0]}" kaynağından`
                : 'Kayıp verisi yetersiz',
            value: totalLost > 0 ? `${totalLost} Kayıp` : '—',
            sub: topLostSource ? `En riskli kaynak: ${topLostSource[0]}` : undefined,
            accent: 'bg-fuchsia-500/20 text-fuchsia-300',
            borderAccent: 'border-fuchsia-500/20',
        };

        return [momentumCard, riskCard, champCard, closingCard, oldestCard, lostTrendCard];
    }, [currentDeals, allDeals, dateFilter, customRange]);

    const totalPages = Math.ceil(cards.length / VISIBLE);
    const visibleCards = cards.slice(page * VISIBLE, page * VISIBLE + VISIBLE);

    return (
        <Card className={cn(
            "bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 dark:from-indigo-600 dark:via-purple-700 dark:to-indigo-800 text-white border-0 shadow-xl relative overflow-hidden",
            className
        )}>
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <CardContent className="relative z-10 px-5 py-4 flex items-center gap-3">

                {/* Header label */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Sparkles size={12} className="text-yellow-300" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-200 whitespace-nowrap">
                        AI Öneriler
                    </span>
                </div>

                {/* Left Arrow */}
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex-shrink-0 p-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Önceki"
                >
                    <ChevronLeft size={14} />
                </button>

                {/* Cards */}
                <div className="flex-1 grid grid-cols-2 gap-3 min-w-0 overflow-hidden">
                    {visibleCards.map(card => (
                        <div
                            key={card.id}
                            className={cn(
                                "flex items-center gap-3 bg-white/10 px-3 py-2.5 rounded-xl border backdrop-blur-md",
                                card.borderAccent
                            )}
                        >
                            <div className={cn("flex-shrink-0 p-1.5 rounded-lg", card.accent)}>
                                {card.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[8px] uppercase font-bold text-white/40 tracking-wider mb-0.5 leading-none">{card.label}</p>
                                <p className="text-xs font-semibold text-white leading-snug line-clamp-1">{card.title}</p>
                                {card.sub && (
                                    <p className="text-[9px] text-white/50 mt-0.5 line-clamp-1">{card.sub}</p>
                                )}
                            </div>
                            <span className="flex-shrink-0 text-sm font-bold text-white/80 whitespace-nowrap">{card.value}</span>
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex-shrink-0 p-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Sonraki"
                >
                    <ChevronRight size={14} />
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all",
                                i === page ? "bg-white w-3" : "bg-white/30"
                            )}
                            aria-label={`Sayfa ${i + 1}`}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
