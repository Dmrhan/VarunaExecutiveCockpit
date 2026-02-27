const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface ScorecardResponse {
    kpis: {
        openOpportunity: { amount: number; count: number };
        quoteSent: { amount: number; count: number };
        quoteWon: { amount: number; count: number };
        quoteWinRate: number;
        openOrder: { amount: number; count: number };
        contract: { amount: number; count: number };
        ytdInvoice: { amount: number; count: number };
        ytdCollection: { amount: number; count: number; collectedAmount: number; pendingAmount: number };
    };
    funnel: {
        id: string;
        label: string;
        amount: number;
        count: number;
    }[];
    trend: {
        name: string;
        contractRevenue: number;
        invoiceRevenue: number;
        collectionRevenue: number;
        target: number;
    }[];
    contractsByAccount: {
        accountId: string;
        accountName: string;
        contractCount: number;
        contractAmount: number;
    }[];
    contractsByStatus: {
        statusCode: number;
        statusLabel: string;
        count: number;
        amount: number;
    }[];
    lastEvents: {
        id: string;
        subject: string;
        typeId: number;
        accountName: string;
        date: string;
    }[];
    teamRank: {
        rank: number;
        totalMembers: number;
        teamId: string | null;
        metric: string;
        differenceToTop?: number;
    };
    opportunitiesByCloseMonth: {
        name: string;
        monthKey: string;
        expectedRevenue: number;
        count: number;
    }[];
    openOpportunitiesList: {
        id: string;
        name: string;
        accountName: string | null;
        expectedRevenue: number;
        monthKey: string;
        expectedCloseDate: string | null;
        dealStatus: number;
        stageName?: string | null;
    }[];
}

export const fetchPersonScorecard = async (
    personId: string,
    filters?: { companyId?: string; from?: string; to?: string; asOf?: string; }
): Promise<ScorecardResponse> => {
    let url = `${getApiBaseUrl()}/analytics/person-scorecard?personId=${personId}`;

    if (filters?.companyId) url += `&companyId=${filters.companyId}`;
    if (filters?.from) url += `&from=${filters.from}`;
    if (filters?.to) url += `&to=${filters.to}`;
    if (filters?.asOf) url += `&asOf=${filters.asOf}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        throw new Error('Failed to fetch person scorecard data');
    }

    return res.json();
};
