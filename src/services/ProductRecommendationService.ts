import type { Deal, ProductGroup } from '../types/crm';

export type RecommendationType = 'Cross-sell' | 'Upsell' | 'Gap' | 'Benchmark' | 'Reactivation';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface Recommendation {
    id: string;
    productName: ProductGroup;
    type: RecommendationType;
    reason: string;
    detailedReason: string;
    confidence: ConfidenceLevel;
    impact: string;
}

const PRODUCT_RELATIONS: Record<ProductGroup, ProductGroup[]> = {
    'EnRoute': ['Quest', 'Stokbar'],
    'Quest': ['EnRoute'],
    'Stokbar': ['EnRoute'],
    'ServiceCore': ['Hosting'],
    'Varuna': ['Hosting', 'Stokbar'],
    'Hosting': ['Varuna'],
    'Unidox': ['EnRoute', 'ServiceCore']
};

export const getRecommendationsForDeal = (deal: Deal): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // 1. Cross-sell (Pattern-Based)
    const complementary = PRODUCT_RELATIONS[deal.product as ProductGroup] || [];
    complementary.forEach((prod, index) => {
        recommendations.push({
            id: `rec-cross-${index}`,
            productName: prod,
            type: 'Cross-sell',
            reason: `${deal.product} kullanan müşterilerin %68'i ${prod} çözümünü de tercih ediyor.`,
            detailedReason: `${deal.product} ile ${prod} tam entegre çalışarak veri tutarlılığını sağlar. Bu müşteri segmentinde operasyonel verimliliği %40 artıran tamamlayıcı bir çözümdür.`,
            confidence: 'High',
            impact: 'Operational Efficiency'
        });
    });

    // 2. Gap-Based (Benchmark)
    if (deal.value > 1000000 && deal.product !== 'Varuna') {
        recommendations.push({
            id: 'rec-gap-1',
            productName: 'Varuna',
            type: 'Benchmark',
            reason: `Sektördeki benzer ölçekteki rakipleri stratejik raporlama için Varuna kullanıyor.`,
            detailedReason: `Enterprise segmentindeki müşterilerimiz, yüksek hacimli işlemleri yönetmek için ana CRM/ERP katmanı olarak Varuna'yı konumlandırıyor. Müşterinin mevcut gap analizi bu ihtiyacı gösteriyor.`,
            confidence: 'Medium',
            impact: 'Strategic Insights'
        });
    }

    // 3. Hosting (Upsell / Standard)
    if (deal.product !== 'Hosting') {
        recommendations.push({
            id: 'rec-hosting-1',
            productName: 'Hosting',
            type: 'Upsell',
            reason: `Cloud Migration paketi ile altyapı maliyetlerini %25 düşürme fırsatı.`,
            detailedReason: `Uygulama katmanının yanında altyapı hizmeti sunmak, tek noktadan destek ve daha yüksek SLA garantisi sağlar. Azure altyapı geçişiyle toplam sahip olma maliyeti düşer.`,
            confidence: 'High',
            impact: 'Cost Reduction'
        });
    }

    // 4. Reactivation (If aging is high)
    if (deal.aging > 60) {
        recommendations.push({
            id: 'rec-reactivate-1',
            productName: 'ServiceCore',
            type: 'Reactivation',
            reason: `Müşterinin geçmişte ilgilendiği ServiceCore modülü için yeni bir kampanya mevcut.`,
            detailedReason: `Bu müşteri 6 ay önce ServiceCore ile ilgilenmiş ancak bütçe nedeniyle ertelemişti. Yeni "Hızlı Başlangıç" paketi ile bu ürün tekrar gündeme alınabilir.`,
            confidence: 'Low',
            impact: 'Customer Experience'
        });
    }

    // Sort by confidence (High first) and pick top 5
    const confidenceOrder: Record<ConfidenceLevel, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

    return recommendations
        .sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence])
        .slice(0, 5);
};
