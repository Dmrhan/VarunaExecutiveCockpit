
import type { Deal, Contact, OpportunityNote } from '../types/crm';
import { generateMockData } from '../data/mockData';

const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const getOpportunityUrl = () => `${getApiBaseUrl()}/opportunities`;

// Helper to map API response (snake_case) to Frontend Model (camelCase)
const mapToDeal = (data: any): Deal => ({
    id: data.id,
    title: data.title,
    customerName: data.customer_name,
    product: data.product,
    value: data.value,
    stage: data.stage,
    probability: data.probability,
    ownerId: data.owner_id,
    ownerName: data.owner_name,
    source: data.source,
    topic: data.topic,
    createdAt: data.created_at,
    expectedCloseDate: data.expected_close_date,
    lastActivityDate: data.last_activity_date || new Date().toISOString(),
    updatedAt: data.updated_at,
    notes: data.notes,
    currency: data.currency,
    weightedValue: data.weighted_value,
    aging: data.aging,
    velocity: data.velocity,
    healthScore: data.health_score,
    dealType: data.deal_type || data.dealType || null
});

// Helper to map Frontend Model to API Payload
const mapToPayload = (deal: Partial<Deal>) => ({
    title: deal.title,
    customer_name: deal.customerName,
    product: deal.product,
    value: deal.value,
    stage: deal.stage,
    probability: deal.probability,
    owner_id: deal.ownerId,
    source: deal.source,
    topic: deal.topic,
    expected_close_date: deal.expectedCloseDate,
    currency: deal.currency,
    deal_type: deal.dealType,
    notes: deal.notes
});

// ODATA Query Parameters
export interface ODataParams {
    $top?: number;
    $skip?: number;
    $filter?: string;
    $select?: string;
    $orderby?: string;
    $count?: boolean;
}

export interface ODataResponse<T> {
    '@odata.count'?: number;
    value: T[];
}

// Helper to map Contact
const mapToContact = (data: any): Contact => ({
    id: data.id,
    opportunityId: data.opportunity_id,
    name: data.name,
    role: data.role,
    email: data.email,
    phone: data.phone
});

// Helper to map Note
const mapToNote = (data: any): OpportunityNote => ({
    id: data.id,
    opportunityId: data.opportunity_id,
    content: data.content,
    createdAt: data.created_at,
    createdBy: data.created_by
});

export const OpportunityService = {

    getAll: async (): Promise<Deal[]> => {
        // Legacy support - fetch simplified list
        return OpportunityService.getList({ $top: 5000, $orderby: 'created_at desc' }).then(res => res.value);
    },

    getList: async (params: ODataParams): Promise<ODataResponse<Deal>> => {
        const searchParams = new URLSearchParams();
        if (params.$top) searchParams.append('$top', params.$top.toString());
        if (params.$skip) searchParams.append('$skip', params.$skip.toString());
        if (params.$filter) searchParams.append('$filter', params.$filter);
        if (params.$select) searchParams.append('$select', params.$select);
        if (params.$orderby) searchParams.append('$orderby', params.$orderby);
        if (params.$count) searchParams.append('$count', 'true');

        try {
            const response = await fetch(`${getOpportunityUrl()}?${searchParams.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch opportunities');

            // Handle both array and ODATA wrapper response
            const json = await response.json();
            if (Array.isArray(json)) {
                return { value: json.map(mapToDeal) };
            } else {
                return {
                    '@odata.count': json['@odata.count'],
                    value: (json.value || []).map(mapToDeal)
                };
            }
        } catch (error) {
            console.warn('API Error, falling back to mock data:', error);

            // Sync Mock Generation
            const mockDeals = generateMockData(50).deals;
            let result = [...mockDeals];

            // 1. Filter (Simple simulation for 'contains')
            if (params.$filter) {
                const searchMatch = params.$filter.match(/contains\(([^,]+),\s*'([^']+)'\)/);
                if (searchMatch) {
                    const [_, _field, term] = searchMatch; // e.g. title, 'acme'
                    const lowerTerm = term.toLowerCase().replace(/'/g, '');

                    result = result.filter(d =>
                        d.title.toLowerCase().includes(lowerTerm) ||
                        d.customerName.toLowerCase().includes(lowerTerm)
                    );
                }
            }

            const totalCount = result.length;

            // 2. Sort (Default to createdAt desc)
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // 3. Pagination
            if (params.$skip !== undefined && params.$top !== undefined) {
                result = result.slice(params.$skip, params.$skip + params.$top);
            }

            return {
                '@odata.count': totalCount,
                value: result
            };
        }
    },

    getById: async (id: string): Promise<Deal | undefined> => {
        try {
            const response = await fetch(`${getOpportunityUrl()}/${id}`);
            if (!response.ok) throw new Error('Failed to fetch deal');
            const data = await response.json();
            return mapToDeal(data);
        } catch (error) {
            console.warn('API Error, falling back to mock data for ID:', id);
            const mockDeals = generateMockData(100).deals;
            // First try exact ID match
            const exact = mockDeals.find(d => d.id === id);
            if (exact) return exact;

            // If not found (e.g. ID from different session), just return first one for demo robustness
            return mockDeals[0];
        }
    },

    getContacts: async (id: string): Promise<Contact[]> => {
        try {
            const response = await fetch(`${getOpportunityUrl()}/${id}/contacts`);
            if (!response.ok) throw new Error('Fetch contacts failed');
            const data = await response.json();
            return data.map(mapToContact);
        } catch (error) {
            console.warn('API Error, returning mock contacts');
            return [
                { id: 'c1', opportunityId: id, name: 'Ahmet Yılmaz', role: 'Decision Maker', email: 'ahmet@company.com', phone: '555-0101' },
                { id: 'c2', opportunityId: id, name: 'Ayşe Kaya', role: 'Champion', email: 'ayse@company.com', phone: '555-0102' }
            ];
        }
    },

    getNotes: async (id: string): Promise<OpportunityNote[]> => {
        try {
            const response = await fetch(`${getOpportunityUrl()}/${id}/notes`);
            if (!response.ok) throw new Error('Fetch notes failed');
            const data = await response.json();
            return data.map(mapToNote);
        } catch (error) {
            console.warn('API Error, returning mock notes');
            return [
                { id: 'n1', opportunityId: id, content: 'Initial meeting went well. Customer is interested in Quote modules.', createdAt: new Date().toISOString(), createdBy: 'u1' }
            ];
        }
    },

    create: async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'aging' | 'velocity' | 'healthScore'>): Promise<Deal> => {
        const payload = mapToPayload(dealData);

        const response = await fetch(getOpportunityUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to create opportunity');
        const data = await response.json();
        return mapToDeal(data);
    },

    update: async (id: string, updates: Partial<Deal>): Promise<Deal> => {
        const payload = mapToPayload(updates);

        const response = await fetch(`${getOpportunityUrl()}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to update opportunity');
        const data = await response.json();
        return mapToDeal(data);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${getOpportunityUrl()}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete opportunity');
    },

    getStats: async (startDate?: string, endDate?: string, ownerId?: string[], teamId?: string[], product?: string[]): Promise<any> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (ownerId) ownerId.forEach(id => params.append('ownerId', id));
        if (teamId) teamId.forEach(t => params.append('teamId', t));
        if (product) product.forEach(p => params.append('product', p));

        const response = await fetch(`${getOpportunityUrl()}/stats?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch opportunity stats');
        return await response.json();
    },

    getLostReasons: async (from?: string, to?: string, ownerId?: string[], teamId?: string[], mode: 'revenue' | 'count' = 'revenue'): Promise<any> => {
        const params = new URLSearchParams();
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (ownerId && ownerId.length) ownerId.forEach(id => params.append('ownerId', id));
        if (teamId && teamId.length) teamId.forEach(t => params.append('teamId', t));
        params.append('mode', mode);

        try {
            const response = await fetch(`${getOpportunityUrl()}/reports/lost-reasons?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch closed lost reasons');
            return await response.json();
        } catch (error) {
            console.warn('API Error in getLostReasons:', error);
            // Default empty state response
            return { items: [], other: null, mode, totals: { count: 0, amount: 0 } };
        }
    }
};
