import type { Deal, Activity, User, ProductGroup, DealSource, DealStage, Contract, ContractType, ContractStatus, BillingStatus } from '../types/crm';

export const PRODUCTS: ProductGroup[] = ['EnRoute', 'Quest', 'Stokbar', 'ServiceCore', 'Varuna', 'Hosting'];
export const SOURCES: DealSource[] = [
    'Univera Satış', 'Univera İş Ortakları',
    'Univera EnRoute PY', 'Univera Stokbar PY', 'Univera Quest PY', 'Univera ServiceCore PY', 'Univera Varuna PY',
    'Pazarlama (Web)', 'Pazarlama (LinkedIn)', 'Pazarlama (Etkinlik)',
    'Mevcut Müşteri (Upsell)', 'Referans', 'Diğer'
];
export const STAGES: DealStage[] = ['Teklif', 'Sözleşme', 'Konumlama', 'Demo', 'Kazanıldı', 'Kaybedildi', 'Lead', 'Qualified', 'Proposal', 'Negotiation'];

export const CORPORATE_CUSTOMERS = [
    'Koç Holding', 'Sabancı Sanayi', 'Türkiye İş Bankası', 'Garanti BBVA', 'Akbank',
    'Türk Telekom', 'Turkcell', 'Pegasus Hava Yolları', 'Şişecam', 'Eczacıbaşı Grup',
    'Migros Ticaret', 'Anadolu Efes', 'Arçelik Global', 'Vestel Elektronik', 'Ford Otosan',
    'Tofaş', 'Türk Hava Yolları', 'Coca-Cola İçecek', 'Ülker Bisküvi', 'Eti Gıda',
    'Hayat Kimya', 'LC Waikiki', 'Boyner Grup', 'Enerjisa', 'Socar Türkiye',
    'BAT - British American Tobacco', 'JTI - Japan Tobacco Intl', 'Philip Morris',
    'Unilever TR', 'P&G Türkiye', 'Nestle Waters', 'Danone Hayat', 'Mey Diageo',
    'Borusan Lojistik', 'Kibar Holding', 'Tekfen İnşaat', 'Enka İnşaat',
    'Yıldız Holding', 'Doğuş Grubu', 'Eczacıbaşı İlaç', 'Abdi İbrahim',
    'Aselsan', 'Havelsan', 'Roketsan', 'TUSAŞ', 'STM Savunma',
    'Getir', 'Yemeksepeti', 'Trendyol', 'Hepsiburada', 'N11',
    'Sahibinden', 'Obilet', 'Martı İleri Teknoloji', 'Insider', 'Peak Games',
    'Logo Yazılım', 'Karel Elektronik', 'Netaş', 'Kron Teknoloji', 'Smartiks',
    'BİM Birleşik Mağazalar', 'A101', 'Şok Marketler', 'CarrefourSA', 'Macrocenter',
    'Mavi Giyim', 'DeFacto', 'Koton', 'Vakko', 'Beymen',
    'Petrol Ofisi', 'Opet', 'Shell Türkiye', 'BP Türkiye', 'Aytemiz',
    'Medical Park', 'Acıbadem Grubu', 'Memorial Sağlık', 'Medipol', 'Dünya Göz'
];

const PROJECT_TOPICS: Record<string, string[]> = {
    'EnRoute': ['Saha Satış Otomasyonu', 'Mobil Sipariş Sistemi', 'Route Optimizasyonu', 'Bayi Yönetim Sistemi'],
    'Quest': ['Merch Takip Sistemi', 'Anket & Denetim Projesi', 'Saha Analitiği', 'Mükemmel Mağaza (Perfect Store)'],
    'Stokbar': ['Depo Yönetim Sistemi', 'WMS Entegrasyonu', 'Radyo Frekanslı Takip', 'Envanter Optimizasyonu'],
    'ServiceCore': ['Müşteri Deneyimi Portalı', 'Omnichannel Destek', 'Call Center Modernizasyonu', 'B2B Destek Hattı'],
    'Varuna': ['ERP Geçiş Projesi', 'Finansal Raporlama Modülü', 'Üretim Planlama', 'IK Portalı'],
    'Hosting': ['Cloud Migration', 'Azure Altyapı Kurulumu', 'Disaster Recovery Planı', 'Server Modernizasyonu']
};

export const PRODUCT_COLORS: Record<ProductGroup, string> = {
    'EnRoute': '#DC2626', // Red-600
    'Stokbar': '#1D4ED8', // Blue-700
    'Quest': '#15803D',   // Green-700
    'ServiceCore': '#7E22CE', // Purple-700
    'Varuna': '#CA8A04',  // Yellow-600
    'Hosting': '#475569', // Slate-600
    'Unidox': '#0284C7'   // Sky-600
};

export const USERS: User[] = [
    // ─── Univera Satış ─────────────────────────────────────────────────────────
    { id: 'u1', name: 'Ali Yılmaz', avatar: 'https://i.pravatar.cc/150?u=u1', role: 'manager', department: 'Univera Satış' },
    { id: 'u4', name: 'Zeynep Çelik', avatar: 'https://i.pravatar.cc/150?u=u4', role: 'manager', department: 'Univera Satış' },
    { id: 'u5', name: 'Mülkiye Akoğaner', avatar: 'https://i.pravatar.cc/150?u=u5', role: 'sales_rep', department: 'Univera Satış' },
    { id: 'u6', name: 'Begüm Hayta', avatar: 'https://i.pravatar.cc/150?u=u6', role: 'sales_rep', department: 'Univera Satış' },
    { id: 'u7', name: 'Semih Balaban', avatar: 'https://i.pravatar.cc/150?u=u7', role: 'sales_rep', department: 'Univera Satış' },
    { id: 'u8', name: 'Nigar Uygun', avatar: 'https://i.pravatar.cc/150?u=u8', role: 'sales_rep', department: 'Univera Satış' },
    // ─── EnRoute PY ────────────────────────────────────────────────────────────
    { id: 'u2', name: 'Ayşe Demir', avatar: 'https://i.pravatar.cc/150?u=u2', role: 'sales_rep', department: 'EnRoute PY' },
    { id: 'u11', name: 'Kemal Aydın', avatar: 'https://i.pravatar.cc/150?u=u11', role: 'sales_rep', department: 'EnRoute PY' },
    // ─── Quest PY ──────────────────────────────────────────────────────────────
    { id: 'u10', name: 'Eren Oral', avatar: 'https://i.pravatar.cc/150?u=u10', role: 'sales_rep', department: 'Quest PY' },
    { id: 'u12', name: 'Deniz Korkmaz', avatar: 'https://i.pravatar.cc/150?u=u12', role: 'sales_rep', department: 'Quest PY' },
    // ─── Stokbar PY ────────────────────────────────────────────────────────────
    { id: 'u9', name: 'Gülçin Erçebi', avatar: 'https://i.pravatar.cc/150?u=u9', role: 'sales_rep', department: 'Stokbar PY' },
    { id: 'u13', name: 'Hasan Polat', avatar: 'https://i.pravatar.cc/150?u=u13', role: 'sales_rep', department: 'Stokbar PY' },
    // ─── İş Ortakları ──────────────────────────────────────────────────────────
    { id: 'u3', name: 'Mehmet Kaya', avatar: 'https://i.pravatar.cc/150?u=u3', role: 'sales_rep', department: 'İş Ortakları' },
    { id: 'u14', name: 'Selin Arslan', avatar: 'https://i.pravatar.cc/150?u=u14', role: 'sales_rep', department: 'İş Ortakları' },
];


const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

export const generateActivitiesForDeals = (deals: Deal[]): Activity[] => {
    const activities: Activity[] = [];
    const subjects = [
        'Proje kapsamı değerlendirmesi', 'Fiyat teklifi revizyonu', 'Sözleşme taslağı incelemesi',
        'Teknik demosunun yapılması', 'Rakip analizi ve karşılaştırma', 'Yıllık bütçe planlaması',
        'Stok entegrasyon süreçleri', 'Mobil uygulama gereksinimleri', 'Bulut geçiş stratejisi',
        'Lisans yenileme görüşmesi'
    ];

    deals.forEach((deal, _i) => {
        // Generate some activities for this deal
        const activityCount = Math.floor(Math.random() * 8) + 1; // 1-8 activities per deal
        for (let j = 0; j < activityCount; j++) {
            // Determine activity status logic
            const isActivityFuture = Math.random() > 0.8; // 20% future activities
            const isOverdue = !isActivityFuture && Math.random() > 0.9; // Of past, 10% are overdue

            let status: 'completed' | 'pending' | 'overdue' = 'completed';
            let activityDate = generateRandomDate(new Date(deal.createdAt), new Date());

            if (isActivityFuture) {
                status = 'pending';
                activityDate = generateRandomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Next 30 days
            } else if (isOverdue) {
                status = 'overdue';
                // Date remains in past, but status is overdue
            } else {
                status = 'completed';
            }

            const outcome = status === 'completed' ? ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any : undefined;
            const outcomeReason = outcome === 'negative'
                ? ['price', 'product_gap', 'timing', 'competitor', 'other'][Math.floor(Math.random() * 5)]
                : undefined;

            const type = ['outbound_call', 'outbound_email', 'meeting', 'inbound_call', 'sales', 'inbound_email', 'account_mgmt', 'other', 'contract', 'proposal', 'support', 'renewal', 'proposal_followup', 'vacancy', 'training', 'linkedin', 'demo', 'satisfaction', 'field_sales', 'proposal_verbal', 'retention'][Math.floor(Math.random() * 21)] as any;

            // Dynamic Subject/Note
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            const note = `${deal.customerName} ile ${subject.toLowerCase()} hakkında ${type.replace('_', ' ')} işlemi.`;

            activities.push({
                id: `a${deal.id}-${j}`,
                dealId: deal.id,
                userId: deal.ownerId,
                type: type,
                date: activityDate,
                dueDate: isActivityFuture || isOverdue ? activityDate : undefined,
                completedAt: status === 'completed' ? activityDate : undefined,
                subject: subject,
                notes: note,
                outcome: outcome as any,
                outcomeReason: outcomeReason as any,
                status: status
            });
        }
    });

    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateMockData = (count: number = 451): { deals: Deal[], activities: Activity[], quotes: any[], orders: any[], contracts: Contract[] } => {
    const deals: Deal[] = [];
    const quotes: any[] = [];
    const orders: any[] = [];

    const QUOTE_STATUSES = ['Draft', 'Review', 'Approved', 'Rejected', 'Sent', 'Accepted', 'Denied'];
    const ORDER_STATUSES = ['Open', 'Closed', 'Canceled'];

    for (let i = 0; i < count; i++) {
        const createdAt = generateRandomDate(new Date('2023-01-01'), new Date());
        const stage = STAGES[Math.floor(Math.random() * STAGES.length)];
        const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];

        // Assign 70% of deals to 'Univera Satış'
        const univeraSatisUsers = USERS.filter(u => u.department === 'Univera Satış');
        const otherUsers = USERS.filter(u => u.department !== 'Univera Satış');
        let owner = USERS[0]; // fallback
        if (Math.random() <= 0.7 && univeraSatisUsers.length > 0) {
            owner = univeraSatisUsers[Math.floor(Math.random() * univeraSatisUsers.length)];
        } else if (otherUsers.length > 0) {
            owner = otherUsers[Math.floor(Math.random() * otherUsers.length)];
        }

        // Calculate simulated aging
        const createdDate = new Date(createdAt);
        const now = new Date();
        const ageDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));

        const customerName = CORPORATE_CUSTOMERS[Math.floor(Math.random() * CORPORATE_CUSTOMERS.length)];
        const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const topics = PROJECT_TOPICS[product] || ['Sistem Geliştirme'];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        const value = Math.floor(Math.random() * 5000000) + 50000;
        const probability = stage === 'Kazanıldı' || stage === 'Sözleşme' ? 100 : stage === 'Kaybedildi' ? 0 : Math.floor(Math.random() * 80 + 10);

        const deal: Deal = {
            id: `d${i}`,
            title: `${customerName} - ${randomTopic}`,
            customerName,
            product,
            value,
            stage,
            probability,
            ownerId: owner.id,
            source,
            topic: `${product} ${randomTopic}`,
            createdAt,
            expectedCloseDate: generateRandomDate(new Date(), new Date('2026-12-31')),
            lastActivityDate: generateRandomDate(new Date(createdAt), new Date()),
            currency: 'TRY',
            weightedValue: Math.round(value * (probability / 100)),
            notes: 'Generated mock deal.',
            updatedAt: new Date().toISOString(),
            aging: ageDays,
            velocity: Math.floor(Math.random() * 15),
            healthScore: Math.floor(Math.random() * 100),
        };

        deals.push(deal);

        // Generate Quotes (approx 80% of deals have quotes to create a reasonable funnel)
        if (Math.random() > 0.2) {
            // Quote status distribution favoring funnel
            const quoteStatusRand = Math.random();
            let quoteStatus = 'Sent';
            if (quoteStatusRand > 0.6) quoteStatus = 'Accepted';
            else if (quoteStatusRand > 0.85) quoteStatus = 'Rejected';
            else if (quoteStatusRand > 0.95) quoteStatus = 'Draft';

            // Quote amount <= Deal amount (User rule: Teklif gönderilen ciro, fırsat cirosundan büyük olamaz)
            const quoteAmount = Math.round(deal.value * (0.7 + Math.random() * 0.3)); // 70-100% of opportunity

            // Quote date is logically after or same as deal creation
            const quoteCreatedAt = generateRandomDate(new Date(createdAt), new Date());

            const quote = {
                id: `q${i}`,
                dealId: deal.id,
                customerName: deal.customerName,
                product: deal.product,
                title: `${deal.title} Teklifi`,
                amount: quoteAmount,
                status: quoteStatus,
                createdAt: quoteCreatedAt,
                validUntil: generateRandomDate(new Date(), new Date('2025-12-31')),
                items: [{ product: deal.product, quantity: 1, price: quoteAmount }],
                salesRepId: owner.id,
                salesRepName: owner.name,
                discount: Math.floor(Math.random() * 30),
                lastActivityDate: generateRandomDate(new Date(quoteCreatedAt), new Date()),
                hasCompetitor: Math.random() > 0.7
            };
            quotes.push(quote);

            // Generate Orders from Accepted/Approved Quotes
            // The user wants: "Kabul edilen teklif cirosu, teklif gönderilen cirodan büyük olamaz" (guaranteed by quote subset logic)
            // The user wants: "Faturalanan ciro, kabul edilen teklif cirosundan büyük olamaz"
            if (quoteStatus === 'Accepted' || quoteStatus === 'Approved') {
                // Order amount <= Accepted Quote amount
                const orderAmount = Math.round(quote.amount * (0.6 + Math.random() * 0.4)); // 60-100% of accepted quote
                const isClosed = Math.random() > 0.3; // 70% invoiced (Closed), 30% open

                // Order date after quote date
                const orderCreatedAt = generateRandomDate(new Date(quoteCreatedAt), new Date());

                orders.push({
                    id: `o${i}`,
                    quoteId: quote.id,
                    customerName: deal.customerName,
                    product: deal.product,
                    title: `${deal.title} Siparişi`,
                    amount: orderAmount,
                    status: isClosed ? 'Closed' : 'Open',
                    createdAt: orderCreatedAt,
                    deliveryDate: generateRandomDate(new Date(orderCreatedAt), new Date('2025-12-31')),
                    salesRepId: deal.ownerId
                });
            }
        }
    }

    // --- Generate Contracts ---
    const contracts: Contract[] = [];
    const CONTRACT_TYPES: ContractType[] = ['Initialization', 'Renewal', 'Maintenance', 'Rental', 'License'];

    const BILLING_STATUSES: BillingStatus[] = ['Invoiced', 'Pending', 'Cancelled'];

    // Generate ~120 contracts for richness
    for (let i = 0; i < 120; i++) {
        const owner = USERS[Math.floor(Math.random() * USERS.length)];
        const customerName = CORPORATE_CUSTOMERS[Math.floor(Math.random() * CORPORATE_CUSTOMERS.length)];
        const productGroup = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const type = CONTRACT_TYPES[Math.floor(Math.random() * CONTRACT_TYPES.length)];

        // Weighted status (mostly Active)
        let status: ContractStatus = 'Active';
        const randStatus = Math.random();
        if (randStatus > 0.8) status = 'Negotiation';
        else if (randStatus > 0.9) status = 'Draft';
        else if (randStatus > 0.95) status = 'Terminated';

        const totalValue = Math.floor(Math.random() * 2000000) + 100000;
        const currency = Math.random() > 0.7 ? (Math.random() > 0.5 ? 'USD' : 'EUR') : 'TRY';
        const exchangeRate = currency === 'USD' ? 32 : (currency === 'EUR' ? 35 : 1);

        // Dates
        // Start date in last 2 years
        const startDate = generateRandomDate(new Date('2022-01-01'), new Date());
        const startObj = new Date(startDate);
        const billingCadence = ['Monthly', 'Quarterly', 'Yearly', 'One-Time'][Math.floor(Math.random() * 4)] as any;
        const durationMonths = [12, 24, 36][Math.floor(Math.random() * 3)];
        const formEndDate = new Date(startObj);
        formEndDate.setMonth(formEndDate.getMonth() + durationMonths);
        const endDate = formEndDate.toISOString();

        // Renewal Date is End Date
        const renewalDate = endDate;

        const now = new Date();
        const daysToRenewal = Math.ceil((new Date(renewalDate).getTime() - now.getTime()) / (1000 * 3600 * 24));

        // Risk Logic
        let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
        const riskFactors: string[] = [];
        let healthScore = 80 + Math.floor(Math.random() * 20); // Default healthy

        if (daysToRenewal < 90 && daysToRenewal > 0) {
            // Approaching renewal
            if (Math.random() > 0.7) {
                riskLevel = 'Medium';
                riskFactors.push('Approaching renewal (no activity)');
                healthScore -= 20;
            }
        }

        if (daysToRenewal < 30 && daysToRenewal > 0) {
            riskLevel = 'High';
            riskFactors.push('Imminent renewal');
            healthScore -= 30;
        }

        if (Math.random() > 0.9) {
            riskLevel = 'High';
            riskFactors.push('Payment delays detected');
            healthScore -= 40;
        }

        if (currency !== 'TRY' && Math.random() > 0.8) {
            riskFactors.push('Currency fluctuation exposure');
        }

        const paymentPlan = generatePaymentPlan(startDate, totalValue, currency as any, exchangeRate, billingCadence);

        // --- Mock Control Tower Extensions ---
        // 1. Contract Owner (Accountable person)
        // Ensure some concentration of risk for specific owners
        // const accountableOwners = ['Zeynep Çelik', 'Nigar Uygun', 'Caner Erkin', 'Merve Aydın', 'Ozan Tufan'];
        const ownerName = ['Zeynep Çelik', 'Nigar Uygun', 'Caner Erkin', 'Merve Aydın', 'Ozan Tufan'][Math.floor(Math.random() * 5)];

        // 2. Renewal History
        const renewalHistory = [];
        if (type === 'Renewal' || type === 'Maintenance') {
            renewalHistory.push({
                date: generateRandomDate(new Date('2022-01-01'), new Date('2023-12-31')),
                action: Math.random() > 0.3 ? 'Renewed' : 'Auto-Renewed',
                priceChangePercentage: Math.floor(Math.random() * 20) + 5
            } as any);
        }

        // 3. Payment Discipline
        // Correlate with risk level
        let avgDelay = 0;
        let consistency = 95;
        let trend = 'Stable';

        if (riskLevel === 'High') {
            avgDelay = Math.floor(Math.random() * 45) + 15; // 15-60 days
            consistency = Math.floor(Math.random() * 40) + 30; // 30-70%
            trend = 'Declining';
        } else if (riskLevel === 'Medium') {
            avgDelay = Math.floor(Math.random() * 15) + 5; // 5-20 days
            consistency = Math.floor(Math.random() * 20) + 60; // 60-80%
            trend = Math.random() > 0.5 ? 'Stable' : 'Declining';
        } else {
            avgDelay = Math.floor(Math.random() * 5); // 0-5 days
            consistency = Math.floor(Math.random() * 10) + 90; // 90-100%
            trend = Math.random() > 0.7 ? 'Improving' : 'Stable';
        }

        const paymentDiscipline = {
            averageDelayDays: avgDelay,
            consistencyScore: consistency,
            trend
        };

        contracts.push({
            id: `cnt-${i}`,
            title: `${type} Agreement - ${customerName}`,
            customerName,
            salesOwnerId: owner.id,
            ownerName,
            productGroup,
            type,
            status,
            totalValue,
            currency,
            totalValueTL: totalValue * exchangeRate,
            startDate,
            endDate,
            signatureDate: generateRandomDate(new Date(startDate), new Date(startDate)),
            renewalDate,
            billingStatus: BILLING_STATUSES[Math.floor(Math.random() * BILLING_STATUSES.length)],
            billingCadence: billingCadence,
            nextInvoiceDate: generateRandomDate(new Date(), new Date('2025-12-31')),
            daysToRenewal,
            autoRenewal: Math.random() > 0.7,
            riskLevel,
            riskFactors,
            healthScore: Math.max(0, healthScore),
            actionsRequired: healthScore < 70 || daysToRenewal < 60,
            paymentPlan,
            renewalHistory,
            paymentDiscipline: paymentDiscipline as any
        });

    }

    // --- Generate "Story" Deals for Forecast Demo ---
    // Ensure we have data in specific future months
    const storyDeals: Deal[] = [];
    const today = new Date();

    // 1. Next Month "Big Deal"
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    storyDeals.push({
        id: 'story-deal-1',
        title: 'Koç Holding - Dijital Dönüşüm Ana Fazı',
        customerName: 'Koç Holding',
        product: 'Varuna',
        value: 8500000,
        stage: 'Negotiation',
        probability: 90,
        ownerId: 'u1',
        source: 'Univera Satış',
        topic: 'Varuna Dijital Dönüşüm Ana Fazı',
        createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 15).toISOString(),
        expectedCloseDate: nextMonth.toISOString(),
        lastActivityDate: new Date().toISOString(),
        currency: 'TRY',
        weightedValue: 4500000 * 0.75,
        notes: 'Strategic partnership for AI transformation.',
        updatedAt: new Date().toISOString(),
        aging: 15,
        velocity: 12,
        healthScore: 95
    });

    // 2. 3 Months out "Risk" Deal
    const threeMonths = new Date(today);
    threeMonths.setMonth(today.getMonth() + 3);
    storyDeals.push({
        id: 'story-deal-2',
        title: 'Migros - Lojistik Optimizasyonu',
        customerName: 'Migros Ticaret',
        product: 'Stokbar',
        value: 12000000,
        stage: 'Proposal',
        probability: 60,
        ownerId: 'u4',
        source: 'Univera Stokbar PY',
        topic: 'Stokbar Lojistik Optimizasyonu',
        createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 10).toISOString(),
        expectedCloseDate: threeMonths.toISOString(),
        lastActivityDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(), // Old activity
        currency: 'TRY',
        weightedValue: 12000000 * 0.60,
        notes: 'Warehouse automation project.',
        updatedAt: new Date().toISOString(),
        aging: 45,
        velocity: 20,
        healthScore: 40 // Low health
    });

    // 3. 6 Months out "Pipeline Builder"
    const sixMonths = new Date(today);
    sixMonths.setMonth(today.getMonth() + 6);
    storyDeals.push({
        id: 'story-deal-3',
        title: 'THY - Global Lisans Genişletme',
        customerName: 'Türk Hava Yolları',
        product: 'EnRoute',
        value: 25000000,
        stage: 'Qualified',
        probability: 40,
        ownerId: 'u2',
        source: 'Univera EnRoute PY',
        topic: 'EnRoute Global Lisans Genişletme',
        createdAt: new Date().toISOString(),
        expectedCloseDate: sixMonths.toISOString(),
        lastActivityDate: new Date().toISOString(),
        currency: 'TRY',
        weightedValue: 850000 * 0.90,
        notes: 'Field sales optimization.',
        updatedAt: new Date().toISOString(),
        aging: 5,
        velocity: 5,
        healthScore: 85
    });

    deals.push(...storyDeals);

    // Apply the extracted activity generation
    const activities = generateActivitiesForDeals(deals);

    // Add contracts (keeping existing story contracts logic if needed, but return deals mainly)
    const storyContracts: Contract[] = [
        {
            id: 'cnt-story-1',
            title: 'Global Lisans Yenileme - Koç Holding',
            customerName: 'Koç Holding',
            salesOwnerId: 'u1',
            ownerName: 'Ali Yılmaz',
            productGroup: 'EnRoute',
            type: 'Renewal',
            status: 'Negotiation',
            totalValue: 4500000,
            currency: 'USD',
            totalValueTL: 4500000 * 32,
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2026-01-01T00:00:00.000Z',
            signatureDate: '2023-01-15T00:00:00.000Z',
            renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days left
            billingStatus: 'Invoiced',
            billingCadence: 'Yearly',
            nextInvoiceDate: '2026-01-01T00:00:00.000Z',
            daysToRenewal: 15,
            autoRenewal: false,
            riskLevel: 'High',
            riskFactors: ['Competitor meeting scheduled', 'Budget cuts announced', 'Key champion left'],
            healthScore: 45,
            actionsRequired: true,
            paymentPlan: [],
            renewalHistory: [
                { date: '2023-01-01', action: 'Renewed', priceChangePercentage: 10 },
                { date: '2020-01-01', action: 'Renewed', priceChangePercentage: 5 }
            ] as any,
            paymentDiscipline: { averageDelayDays: 45, consistencyScore: 60, trend: 'Declining' } as any
        },
        {
            id: 'cnt-story-2',
            title: 'WMS Genişletme Projesi - Migros',
            customerName: 'Migros Ticaret',
            salesOwnerId: 'u4',
            ownerName: 'Zeynep Çelik',
            productGroup: 'Stokbar',
            type: 'License',
            status: 'Active',
            totalValue: 850000,
            currency: 'EUR',
            totalValueTL: 850000 * 35,
            startDate: '2024-03-01T00:00:00.000Z',
            endDate: '2027-03-01T00:00:00.000Z',
            signatureDate: '2024-03-01T00:00:00.000Z',
            renewalDate: '2027-03-01T00:00:00.000Z',
            billingStatus: 'Invoiced',
            billingCadence: 'Yearly',
            nextInvoiceDate: '2025-03-01T00:00:00.000Z',
            daysToRenewal: 365,
            autoRenewal: true,
            riskLevel: 'Low',
            riskFactors: [],
            healthScore: 98,
            actionsRequired: false,
            paymentPlan: [],
            renewalHistory: [],
            paymentDiscipline: { averageDelayDays: 2, consistencyScore: 99, trend: 'Improving' } as any
        }
    ];

    contracts.push(...storyContracts);

    return { deals, activities, quotes, orders, contracts };
};

// Helper to generate payment plan
const generatePaymentPlan = (startDate: string, totalValue: number, currency: 'TRY' | 'USD' | 'EUR', _exchangeRate: number, cadence: string): any[] => {
    const plan = [];
    const start = new Date(startDate);
    const months = cadence === 'Monthly' ? 1 : cadence === 'Quarterly' ? 3 : 12;
    const installments = cadence === 'One-Time' ? 1 : Math.ceil(12 / months); // Assume 1 year contract normalized
    const amountPerInstallment = totalValue / installments;

    for (let i = 0; i < installments; i++) {
        const date = new Date(start);
        date.setMonth(start.getMonth() + (i * months));

        const now = new Date();
        const isPast = date < now;

        let status = 'Pending';
        if (isPast) {
            status = Math.random() > 0.9 ? 'Overdue' : 'Collected';
        }

        plan.push({
            id: `pay-${Math.random().toString(36).substr(2, 9)}`,
            date: date.toISOString(),
            amount: amountPerInstallment,
            currency,
            status,
            invoiceNumber: status !== 'Pending' ? `INV-${Math.floor(Math.random() * 10000)}` : undefined
        });
    }
    return plan;
};

// Increased default count for richer data
export const { deals: mockDeals, activities: mockActivities, quotes: mockQuotes, orders: mockOrders, contracts: mockContracts } = generateMockData(850);

// Simple mock performance data
export const mockPerformance = [
    { userId: 'u1', userName: 'Ali Yılmaz', quotaAttainment: 120000, dealsClosed: 12 },
    { userId: 'u2', userName: 'Ayşe Demir', quotaAttainment: 98000, dealsClosed: 9 },
    { userId: 'u3', userName: 'Mehmet Kaya', quotaAttainment: 85000, dealsClosed: 7 },
    { userId: 'u4', userName: 'Zeynep Çelik', quotaAttainment: 110000, dealsClosed: 10 },
    { userId: 'u6', userName: 'Begüm Hayta', quotaAttainment: 92000, dealsClosed: 8 },
];

// Export an auxiliary data generator to link to real/fetched Deals
export const generateAuxiliaryDataForDeals = (deals: Deal[]): { quotes: any[], orders: any[] } => {
    const quotes: any[] = [];
    const orders: any[] = [];

    deals.forEach((deal, i) => {
        // Generate Quotes (approx 80% of deals have quotes to create a reasonable funnel)
        if (Math.random() > 0.2) {
            // Quote status distribution favoring funnel
            const quoteStatusRand = Math.random();
            let quoteStatus = 'Sent';
            if (quoteStatusRand > 0.6) quoteStatus = 'Accepted';
            else if (quoteStatusRand > 0.85) quoteStatus = 'Rejected';
            else if (quoteStatusRand > 0.95) quoteStatus = 'Draft';

            // Quote amount <= Deal amount (User rule: Teklif gönderilen ciro, fırsat cirosundan büyük olamaz)
            const quoteAmount = Math.round(deal.value * (0.7 + Math.random() * 0.3)); // 70-100% of opportunity

            // Quote date is logically after or same as deal creation
            const quoteCreatedAt = generateRandomDate(new Date(deal.createdAt), new Date());

            const quote = {
                id: `q_linked_${deal.id}_${i}`,
                dealId: deal.id,
                customerName: deal.customerName,
                product: deal.product,
                title: `${deal.title} Teklifi`,
                amount: quoteAmount,
                status: quoteStatus,
                createdAt: quoteCreatedAt,
                validUntil: generateRandomDate(new Date(), new Date('2025-12-31')),
                items: [{ product: deal.product, quantity: 1, price: quoteAmount }],
                salesRepId: deal.ownerId,
                salesRepName: 'SalesRep', // Simplified for mock
                discount: Math.floor(Math.random() * 30),
                lastActivityDate: generateRandomDate(new Date(quoteCreatedAt), new Date()),
                hasCompetitor: Math.random() > 0.7
            };
            quotes.push(quote);

            // Generate Orders from Accepted/Approved Quotes
            if (quoteStatus === 'Accepted' || quoteStatus === 'Approved') {
                // Order amount <= Accepted Quote amount
                const orderAmount = Math.round(quote.amount * (0.6 + Math.random() * 0.4)); // 60-100% of accepted quote
                const isClosed = Math.random() > 0.3; // 70% invoiced (Closed), 30% open

                // Order date after quote date
                const orderCreatedAt = generateRandomDate(new Date(quoteCreatedAt), new Date());

                orders.push({
                    id: `o_linked_${deal.id}_${i}`,
                    quoteId: quote.id,
                    customerName: deal.customerName,
                    product: deal.product,
                    title: `${deal.title} Siparişi`,
                    amount: orderAmount,
                    status: isClosed ? 'Closed' : 'Open',
                    createdAt: orderCreatedAt,
                    deliveryDate: generateRandomDate(new Date(orderCreatedAt), new Date('2025-12-31')),
                    salesRepId: deal.ownerId
                });
            }
        }
    });

    return { quotes, orders };
};

