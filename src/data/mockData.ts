import type { Deal, DealStage, ProductGroup, Activity, User, DealSource } from '../types/crm';

export const PRODUCTS: ProductGroup[] = ['EnRoute', 'Quest', 'Stokbar', 'Calldesk', 'Varuna', 'Unidox'];
const SOURCES: DealSource[] = ['Univera Satış', 'Univera İş Ortakları', 'Univera EnRoute PY', 'Univera Stokbar PY', 'Univera Quest PY', 'Diğer'];
const EXTENDED_STAGES: DealStage[] = ['Teklif', 'Sözleşme', 'Konumlama', 'Demo', 'Kazanıldı', 'Kaybedildi', 'Lead', 'Qualified', 'Proposal', 'Negotiation'];
const TOPICS = ['BAT Enroute P...', 'Natura Gıda - ...', 'Dardanel - St...', 'HARIBO 2025 ...', 'JTI HOSTING ...', 'Mondelez - St...', 'JTI IRAN MAI...'];

export const USERS: User[] = [
    { id: 'u1', name: 'Ali Yılmaz', avatar: 'https://i.pravatar.cc/150?u=1', role: 'sales_rep' },
    { id: 'u2', name: 'Ayşe Demir', avatar: 'https://i.pravatar.cc/150?u=2', role: 'sales_rep' },
    { id: 'u3', name: 'Mehmet Kaya', avatar: 'https://i.pravatar.cc/150?u=3', role: 'sales_rep' },
    { id: 'u4', name: 'Zeynep Çelik', avatar: 'https://i.pravatar.cc/150?u=4', role: 'manager' },
];

const generateRandomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

export const generateMockData = (count: number = 451): { deals: Deal[], activities: Activity[] } => {
    const deals: Deal[] = [];
    const activities: Activity[] = [];

    for (let i = 0; i < count; i++) {
        const createdAt = generateRandomDate(new Date('2023-01-01'), new Date());
        const stage = EXTENDED_STAGES[Math.floor(Math.random() * EXTENDED_STAGES.length)];
        const owner = USERS[Math.floor(Math.random() * USERS.length)];
        const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
        const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

        // Calculate simulated aging
        const createdDate = new Date(createdAt);
        const now = new Date();
        const ageDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));

        const deal: Deal = {
            id: `d${i}`,
            title: `Opportunity ${i + 1}`,
            customerName: `Customer ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${i}`,
            product: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
            value: Math.floor(Math.random() * 5000000) + 50000,
            stage,
            probability: stage === 'Kazanıldı' ? 100 : stage === 'Kaybedildi' ? 0 : Math.random() * 80 + 10,
            ownerId: owner.id,
            source,
            topic,
            createdAt,
            expectedCloseDate: generateRandomDate(new Date(), new Date('2024-12-31')),
            lastActivityDate: generateRandomDate(new Date(createdAt), new Date()),
            aging: ageDays,
            velocity: Math.floor(Math.random() * 15),
            healthScore: Math.floor(Math.random() * 100),
        };

        deals.push(deal);

        // Generate some activities for this deal
        const activityCount = Math.floor(Math.random() * 5);
        for (let j = 0; j < activityCount; j++) {
            activities.push({
                id: `a${i}-${j}`,
                dealId: deal.id,
                userId: owner.id,
                type: ['call', 'meeting', 'email', 'demo'][Math.floor(Math.random() * 4)] as any,
                date: generateRandomDate(new Date(createdAt), new Date()),
                notes: 'Simulated activity note...',
                outcome: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
            });
        }
    }

    return { deals, activities };
};

export const { deals: mockDeals, activities: mockActivities } = generateMockData(451);

// Simple mock performance data
export const mockPerformance = [
    { userId: 'u1', userName: 'Ali Yılmaz', quotaAttainment: 120000, dealsClosed: 12 },
    { userId: 'u2', userName: 'Ayşe Demir', quotaAttainment: 98000, dealsClosed: 9 },
    { userId: 'u3', userName: 'Mehmet Kaya', quotaAttainment: 85000, dealsClosed: 7 },
];
