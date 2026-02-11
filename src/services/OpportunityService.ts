
import type { Deal } from '../types/crm';

const API_URL = 'http://localhost:3000/api/opportunities';

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
    healthScore: data.health_score
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
    notes: deal.notes
});

export const OpportunityService = {

    getAll: async (): Promise<Deal[]> => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch opportunities');
            const data = await response.json();
            return data.map(mapToDeal);
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    },

    getById: async (id: string): Promise<Deal | undefined> => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) return undefined;
            const data = await response.json();
            return mapToDeal(data);
        } catch (error) {
            console.error('API Error:', error);
            return undefined;
        }
    },

    create: async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'aging' | 'velocity' | 'healthScore'>): Promise<Deal> => {
        const payload = mapToPayload(dealData);

        const response = await fetch(API_URL, {
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

        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to update opportunity');
        const data = await response.json();
        return mapToDeal(data);
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete opportunity');
    }
};
