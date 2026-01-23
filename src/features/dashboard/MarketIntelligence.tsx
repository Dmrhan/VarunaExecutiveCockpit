import { Newspaper, Globe, TrendingUp, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { cn } from '../../lib/utils';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    date: string;
    category: 'FMCG' | 'CPG' | 'Retail';
    isGlobal: boolean;
}

const NEWS_DATA: NewsItem[] = [
    {
        id: '1',
        title: 'Haribo Türkiye Kapasitesini %20 Artırıyor',
        summary: 'Jelibon devi Haribo, Türkiye fabrikasındaki üretim hatlarını modernize ederek ihracat hedeflerini büyütüyor.',
        source: 'Fortune Turkey',
        date: 'Bugün',
        category: 'FMCG',
        isGlobal: false
    },
    {
        id: '2',
        title: 'Mondelez International 2025 Sürdürülebilirlik Raporu Yayınlandı',
        summary: 'Küresel atıştırmalık lideri, karbon ayak izini azaltma ve ham madde tedariğinde yeni standartlar belirledi.',
        source: 'Reuters',
        date: '3 saat önce',
        category: 'CPG',
        isGlobal: true
    },
    {
        id: '3',
        title: 'Dardanel, Avrupa Pazarında Yeni Akvizisyonlara Hazırlanıyor',
        summary: 'Konserve balık sektörünün lideri Dardanel, Balkanlar ve Batı Avrupa pazarında yeni marka alımları yapacağını duyurdu.',
        source: 'Dünya Gazetesi',
        date: 'Dün',
        category: 'Retail',
        isGlobal: false
    },
    {
        id: '4',
        title: 'BAT Globalden Yeni Nesil Ürün Kategorisine Yatırım Kararı',
        summary: 'British American Tobacco, Ar-Ge bütçesinin büyük kısmını dumansız ürün teknolojilerine ayırıyor.',
        source: 'Financial Times',
        date: 'Dün',
        category: 'CPG',
        isGlobal: true
    },
    {
        id: '5',
        title: 'FMCG Sektöründe E-Ticaret Payı Yeniden Yükselişe Geçti',
        summary: 'Verilere göre 2026 ilk çeyreğinde hızlı tüketim mallarının online satışı %15 büyüme kaydetti.',
        source: 'Bloomberg',
        date: '2 gün önce',
        category: 'FMCG',
        isGlobal: true
    },
    {
        id: '6',
        title: 'JTI, Türkiye Operasyonlarında Dijital Dönüşümü Hızlandırıyor',
        summary: 'Saha operasyonlarında Univera çözümleriyle sağlanan verimlilik artışı global merkeze raporlandı.',
        source: 'Bilişim Dergisi',
        date: '2 gün önce',
        category: 'FMCG',
        isGlobal: false
    }
];

const CUSTOMERS = ['Haribo', 'Mondelez', 'Dardanel', 'BAT', 'JTI', 'Univera'];

export function MarketIntelligence() {
    const highlightCustomer = (text: string) => {
        const parts = text.split(new RegExp(`(${CUSTOMERS.join('|')})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    CUSTOMERS.some(c => c.toLowerCase() === part.toLowerCase()) ? (
                        <span key={i} className="text-indigo-400 dark:text-indigo-400 font-bold underline decoration-indigo-500/30 underline-offset-4">
                            {part}
                        </span>
                    ) : part
                )}
            </>
        );
    };

    const isCustomerMention = (item: NewsItem) => {
        const content = (item.title + item.summary).toLowerCase();
        return CUSTOMERS.some(c => content.includes(c.toLowerCase()));
    };

    return (
        <Card className="h-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Newspaper size={18} className="text-indigo-500" />
                    <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
                        Piyasa İstihbaratı (FMCG / CPG)
                    </CardTitle>
                </div>
                <div className="flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                    <TrendingUp size={10} /> Canlı
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {NEWS_DATA.map((item) => {
                        const hasCustomer = isCustomerMention(item);
                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group relative",
                                    hasCustomer && "bg-indigo-50/30 dark:bg-indigo-500/5"
                                )}
                            >
                                {hasCustomer && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1 text-[9px] font-bold text-indigo-500 uppercase tracking-tight">
                                        <Star size={10} fill="currentColor" /> Müşterimiz
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium">
                                        {item.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        {item.isGlobal ? <Globe size={10} /> : <span className="w-2 h-2 rounded-full bg-emerald-500/50" />}
                                        {item.source} • {item.date}
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {highlightCustomer(item.title)}
                                </h3>

                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                    {item.summary}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center">
                <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline decoration-2">
                    Tüm Sektör Haberlerini Gör
                </button>
            </div>
        </Card>
    );
}
