export type ProductGroup = 'EnRoute' | 'Quest' | 'Stokbar' | 'Calldesk' | 'Varuna' | 'Unidox';

export type DealStage = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Order' | 'Lost' |
    'Teklif' | 'Sözleşme' | 'Konumlama' | 'Demo' | 'Kazanıldı' | 'Kaybedildi';

export type DealSource = 'Univera Satış' | 'Univera İş Ortakları' | 'Univera EnRoute PY' | 'Univera Stokbar PY' | 'Univera Quest PY' | 'Diğer';

export interface User {
    id: string;
    name: string;
    avatar: string;
    role: 'sales_rep' | 'manager' | 'executive';
}

export interface Activity {
    id: string;
    type: 'call' | 'meeting' | 'email' | 'demo';
    date: string; // ISO date
    dealId: string;
    userId: string;
    notes?: string;
    outcome?: 'positive' | 'neutral' | 'negative';
}

export interface Deal {
    id: string;
    title: string;
    customerName: string;
    product: ProductGroup;
    value: number;
    stage: DealStage;
    probability: number;
    ownerId: string;
    source: DealSource;
    topic: string;
    createdAt: string;
    expectedCloseDate: string;
    lastActivityDate: string;

    // Computed fields (for analytics)
    aging: number; // days in current stage
    velocity: number; // average days per stage
    healthScore: number; // 0-100
}

export interface DashboardMetrics {
    totalPipelineValue: number;
    executionConfidenceScore: number; // 0-100
    stalledDealsCount: number;
    leakageByStage: Record<DealStage, number>;
    topPerformers: { userId: string; score: number }[];
}
