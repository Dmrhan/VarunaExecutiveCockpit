import { useMemo, useState, useEffect } from 'react';
import {
    Sparkles, TrendingUp, TrendingDown, AlertTriangle,
    Trophy, Package, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import type { Order } from '../../types/crm';
import { cn } from '../../lib/utils';

interface OrdersAIInsightPanelProps {
    currentOrders: Order[];
    allOrders: Order[];
    dateFilter: string;
    customRange: { start: Date | null; end: Date | null };
    className?: string;
}

interface InsightCard {
    id: string;
    icon: React.ReactNode;
    label: string;
    title: string;
    value: string;
    sub?: string;
    accent: string;
    borderAccent: string;
}

const formatCurrency = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M₺`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k₺`;
    return `${v}₺`;
};

export function OrdersAIInsightPanel({ currentOrders, allOrders, dateFilter, customRange, className }: OrdersAIInsightPanelProps) {
    const { users } = useData();
    const [page, setPage] = useState(0);
    const VISIBLE = 2;

    const cards: InsightCard[] = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        // ── 1. Sipariş Momentumu ──────────────────────────────────────────────
        // Kapalı siparişlerde InvoiceDate, diğerlerinde CreatedAt referans tarih
        const getRefDate = (o: Order) => (o.status === 'Closed' && o.invoiceDate) ? o.invoiceDate : o.createdAt;

        let prevOrders: Order[] = [];
        if (dateFilter === 'today') {
            const yesterday = today - 86400000;
            prevOrders = allOrders.filter(o => {
                const dt = new Date(getRefDate(o)).getTime();
                return dt >= yesterday && dt < today;
            });
        } else if (dateFilter === 'month' || dateFilter === 'mtd') {
            const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            prevOrders = allOrders.filter(o => {
                const dt = new Date(getRefDate(o));
                return dt.getMonth() === lm && dt.getFullYear() === ly;
            });
        } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
            const duration = customRange.end.getTime() - customRange.start.getTime();
            const prevEnd = customRange.start.getTime();
            const prevStart = prevEnd - duration;
            prevOrders = allOrders.filter(o => {
                const dt = new Date(getRefDate(o)).getTime();
                return dt >= prevStart && dt < prevEnd;
            });
        } else {
            prevOrders = allOrders
                .filter(o => new Date(getRefDate(o)).getTime() < today)
                .slice(-Math.max(1, Math.floor(currentOrders.length * 0.9)));
        }

        const currentRev = currentOrders.reduce((s, o) => s + o.amount, 0);
        const prevRev = prevOrders.length > 0 ? prevOrders.reduce((s, o) => s + o.amount, 0) : 0;
        const revChange = prevRev === 0 ? (currentRev > 0 ? 100 : 0) : ((currentRev - prevRev) / prevRev) * 100;

        const topProductMap = currentOrders.reduce((acc, o) => {
            const key = o.parentGroupName || o.product || 'Diğer';
            acc[key] = (acc[key] || 0) + o.amount;
            return acc;
        }, {} as Record<string, number>);
        const bestProduct = Object.entries(topProductMap).sort((a, b) => b[1] - a[1])[0];

        const momentumCard: InsightCard = {
            id: 'momentum',
            icon: revChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
            label: 'Sipariş Momentumu',
            title: revChange >= 0
                ? `Hacim %${Math.abs(revChange).toFixed(0)} arttı`
                : `Hacim %${Math.abs(revChange).toFixed(0)} azaldı`,
            value: revChange >= 0 ? `+%${Math.abs(revChange).toFixed(1)}` : `-%${Math.abs(revChange).toFixed(1)}`,
            sub: bestProduct ? `Lider ürün: ${bestProduct[0]}` : undefined,
            accent: revChange >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300',
            borderAccent: revChange >= 0 ? 'border-emerald-500/20' : 'border-rose-500/20',
        };

        // ── 2. Teslim Riski ───────────────────────────────────────────────────
        const sevenDaysFromNow = today + 7 * 86400000;
        const atRiskOrders = currentOrders.filter(o => {
            if (o.status === 'Closed') return false;
            const delivery = o.deliveryDate ? new Date(o.deliveryDate).getTime() : null;
            return delivery !== null && delivery <= sevenDaysFromNow;
        });
        const atRiskVal = atRiskOrders.reduce((s, o) => s + o.amount, 0);
        const overdueCount = atRiskOrders.filter(o => {
            const delivery = new Date(o.deliveryDate).getTime();
            return delivery < today;
        }).length;

        const deliveryRiskCard: InsightCard = {
            id: 'delivery-risk',
            icon: <AlertTriangle size={16} />,
            label: 'Teslim Riski',
            title: atRiskOrders.length > 0
                ? `${atRiskOrders.length} siparişin teslim tarihi yaklaşıyor`
                : 'Acil teslim riski tespit edilmedi',
            value: atRiskOrders.length > 0 ? formatCurrency(atRiskVal) : '—',
            sub: overdueCount > 0 ? `${overdueCount} sipariş zaten gecikmiş` : atRiskOrders.length > 0 ? '7 gün içinde teslim edilmeli' : undefined,
            accent: atRiskOrders.length > 0 ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-500/20 text-slate-400',
            borderAccent: atRiskOrders.length > 0 ? 'border-orange-500/20' : 'border-slate-500/20',
        };

        // ── 3. İptal Radari ───────────────────────────────────────────────────
        const canceledOrders = currentOrders.filter(o => o.status === 'Canceled');
        const canceledVal = canceledOrders.reduce((s, o) => s + o.amount, 0);
        const cancelRate = currentOrders.length > 0
            ? Math.round((canceledOrders.length / currentOrders.length) * 100)
            : 0;

        const prevCanceled = prevOrders.filter(o => o.status === 'Canceled');
        const prevCancelRate = prevOrders.length > 0
            ? Math.round((prevCanceled.length / prevOrders.length) * 100)
            : 0;
        const cancelRateDiff = cancelRate - prevCancelRate;

        const cancelCard: InsightCard = {
            id: 'cancellation',
            icon: <AlertTriangle size={16} />,
            label: 'İptal Radari',
            title: canceledOrders.length > 0
                ? `${canceledOrders.length} sipariş iptal edildi`
                : 'Bu dönem iptal yok',
            value: canceledOrders.length > 0 ? formatCurrency(canceledVal) : '—',
            sub: canceledOrders.length > 0
                ? `İptal oranı %${cancelRate}${cancelRateDiff !== 0 ? ` (${cancelRateDiff > 0 ? '+' : ''}${cancelRateDiff}% önceki döneme göre)` : ''}`
                : undefined,
            accent: canceledOrders.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-400',
            borderAccent: canceledOrders.length > 0 ? 'border-rose-500/20' : 'border-slate-500/20',
        };

        // ── 4. Dönemin Şampiyonu ──────────────────────────────────────────────
        const closedBySalesRep = currentOrders
            .filter(o => o.status === 'Closed')
            .reduce((acc, o) => {
                acc[o.salesRepId] = (acc[o.salesRepId] || 0) + o.amount;
                return acc;
            }, {} as Record<string, number>);
        const topSalesRep = Object.entries(closedBySalesRep).sort((a, b) => b[1] - a[1])[0];
        const topSalesRepName = topSalesRep
            ? (users.find(u => u.id === topSalesRep[0])?.name || topSalesRep[0])
            : null;
        const topSalesRepCount = topSalesRep
            ? currentOrders.filter(o => o.status === 'Closed' && o.salesRepId === topSalesRep[0]).length
            : 0;

        const champCard: InsightCard = {
            id: 'champion',
            icon: <Trophy size={16} />,
            label: 'Dönemin Şampiyonu',
            title: topSalesRepName || 'Henüz kapalı sipariş yok',
            value: topSalesRep ? formatCurrency(topSalesRep[1]) : '—',
            sub: topSalesRep ? `${topSalesRepCount} sipariş kapatıldı` : undefined,
            accent: 'bg-amber-500/20 text-amber-300',
            borderAccent: 'border-amber-500/20',
        };

        // ── 5. En Büyük Alıcı ────────────────────────────────────────────────
        const byCustomer = currentOrders.reduce((acc, o) => {
            acc[o.customerName] = (acc[o.customerName] || 0) + o.amount;
            return acc;
        }, {} as Record<string, number>);
        const topCustomer = Object.entries(byCustomer).sort((a, b) => b[1] - a[1])[0];
        const topCustomerShare = topCustomer && currentRev > 0
            ? Math.round((topCustomer[1] / currentRev) * 100)
            : 0;

        const topBuyerCard: InsightCard = {
            id: 'top-buyer',
            icon: <Package size={16} />,
            label: 'En Büyük Alıcı',
            title: topCustomer ? topCustomer[0] : 'Veri yok',
            value: topCustomer ? formatCurrency(topCustomer[1]) : '—',
            sub: topCustomer ? `Toplam hacmin %${topCustomerShare}'i` : undefined,
            accent: 'bg-sky-500/20 text-sky-300',
            borderAccent: 'border-sky-500/20',
        };

        return [momentumCard, deliveryRiskCard, cancelCard, champCard, topBuyerCard];
    }, [currentOrders, allOrders, dateFilter, customRange, users]);

    const totalPages = Math.ceil(cards.length / VISIBLE);
    const visibleCards = cards.slice(page * VISIBLE, page * VISIBLE + VISIBLE);

    // Auto-advance every 10s
    useEffect(() => {
        const timer = setInterval(() => {
            setPage(p => (p + 1) % totalPages);
        }, 10000);
        return () => clearInterval(timer);
    }, [totalPages]);

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
                    onClick={() => setPage(p => (p - 1 + totalPages) % totalPages)}
                    className="flex-shrink-0 p-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
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
                    onClick={() => setPage(p => (p + 1) % totalPages)}
                    className="flex-shrink-0 p-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
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
