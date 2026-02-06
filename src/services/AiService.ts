import type { Deal, User } from '../types/crm';

export const AiService = {
    analyzeRisk: async (deal: Deal): Promise<{ riskLevel: 'Low' | 'Medium' | 'High', analysis: string, advice: string }> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock Logic based on deal data
        let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
        if (deal.probability < 40) riskLevel = 'High';
        else if (deal.probability < 70) riskLevel = 'Medium';

        const analyses = [
            `Analiz edilen ${deal.customerName} fırsatı, ${deal.stage} aşamasında ve ${deal.probability}% olasılıkla ilerliyor. Fiyat hassasiyeti ve rakip baskısı temel risk faktörleri olarak görünüyor.`,
            `Müşteri geçmiş alım verileri ve mevcut ekonomik göstergeler ışığında, bu fırsatın kapanma olasılığı ${riskLevel === 'High' ? 'düşük' : 'makul'} seviyede. Karar vericiye erişim konusunda eksiklikler tespit edildi.`,
            `${deal.product} ürünü için ${deal.value} tutarındaki bu teklif, pazar ortalamasının üzerinde. Bu durum, onay sürecini uzatabilir ve risk oluşturabilir.`
        ];

        const advices = [
            "Karar verici ile yüz yüze bir toplantı ayarlayarak değer önerisini tekrar vurgulayın. ROI hesaplamasını içeren bir ek rapor sunmak faydalı olabilir.",
            "Rakip analizini güncelleyin ve ürünümüzün benzersiz avantajlarına (USP) odaklanan bir vaka çalışması paylaşın. İndirim yerine ek hizmetler teklif etmeyi düşünün.",
            "Satış döngüsünü hızlandırmak için sınırlı süreli bir teşvik sunun veya teknik ekibi devreye sokarak bir POC (Proof of Concept) önerin."
        ];

        return {
            riskLevel,
            analysis: analyses[Math.floor(Math.random() * analyses.length)],
            advice: advices[Math.floor(Math.random() * advices.length)]
        };
    },

    generateEmailDraft: async (deal: Deal, user: User): Promise<{ subject: string, body: string }> => {
        await new Promise(resolve => setTimeout(resolve, 1200));

        return {
            subject: `Fırsat Değerlendirmesi: ${deal.topic} - ${deal.product}`,
            body: `Sayın ${deal.customerName} Yetkilisi,

${deal.product} çözümümüzle ilgili olarak ${new Date(deal.createdAt).toLocaleDateString()} tarihinde başlattığımız görüşmelerde geldiğimiz noktayı değerlendirmek istedim.

Şu an "${deal.stage}" aşamasındayız ve sizin için oluşturduğumuz değer önerisinin iş hedeflerinize doğrudan katkı sağlayacağına inanıyorum. Özellikle operasyonel verimlilik konusundaki beklentilerinizi karşılamak adına teknik ekibimizle hazırladığımız ek raporu dikkatinize sunarım.

Bir sonraki adımı netleştirmek adına bu hafta kısa bir görüşme yapabilir miyiz?

Saygılarımla,
${user.name}
${user.role === 'sales_rep' ? 'Satış Temsilcisi' : 'Yönetici'}
Univera`
        };
    }
};
