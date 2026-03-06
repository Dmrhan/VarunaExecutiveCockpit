import axios from 'axios';

const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface KpiOpportunity {
    totalCount: number;
    totalAmount: number;
    openCount: number;
    openAmount: number;
    wonCount: number;
    wonAmount: number;
    lostCount: number;
    lostAmount: number;
    weightedPipeline: number;
}

export interface KpiQuote {
    totalCount: number;
    totalNet: number;
    sentCount: number;
    sentNet: number;
    wonCount: number;
    wonNet: number;
    wonVat: number;
    lostCount: number;
    lostNet: number;
    openCount: number;
    openNet: number;
    draftCount: number;
    proposalConversionRate: number;
    wonQuoteRateByRevenue: number;
    wonQuoteRateByCount: number;
    quoteToOppRate: number;
}

export interface KpiOrder {
    totalCount: number;
    totalNet: number;
    totalVat: number;
    openCount: number;
    openVat: number;
    invoicedCount: number;
    invoicedNet: number;
}

export interface KpiContract {
    totalCount: number;
    totalAmount: number;
    activeCount: number;
    activeAmount: number;
}

export interface KpiCollection {
    collectedCount: number;
    collectedAmount: number;
    pendingCount: number;
    pendingAmount: number;
}

export interface FunnelItem {
    label: string;
    labelEn: string;
    amount: number;
    count: number;
    type: 'opportunity' | 'quote_sent' | 'quote_won' | 'order_open' | 'invoiced';
    conversionRate?: number;
    conversionRateCount?: number;
}

export interface AnalyticsKpis {
    opportunities: KpiOpportunity;
    quotes: KpiQuote;
    orders: KpiOrder;
    contracts: KpiContract;
    collections: KpiCollection;
    funnel: FunnelItem[];
}

export interface AnalyticsFilter {
    ownerId?: string;
    accountId?: string;
    teamId?: string;
    from?: string;
    to?: string;
}

export const AnalyticsService = {
    getKpis: async (filter?: AnalyticsFilter): Promise<AnalyticsKpis> => {
        const response = await axios.get<AnalyticsKpis>(`${getApiBaseUrl()}/analytics/kpis`, {
            params: filter
        });
        return response.data;
    }
};
