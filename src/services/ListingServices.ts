const API_BASE = (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const ContractService = {
    getAll: async () => {
        try {
            const res = await fetch(`${API_BASE}/contracts`);
            if (!res.ok) throw new Error('Failed to fetch contracts');
            const json = await res.json();
            return json.value || [];
        } catch (error) {
            console.warn('Contract API error, returning empty', error);
            return [];
        }
    },
    getById: async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/contracts/${id}`);
            if (!res.ok) throw new Error('Failed to fetch contract');
            return await res.json();
        } catch (error) {
            console.error('Contract Detail API error', error);
            throw error;
        }
    }
};

export const QuoteService = {
    getAll: async () => {
        try {
            const res = await fetch(`${API_BASE}/quotes`);
            if (!res.ok) throw new Error('Failed to fetch quotes');
            const json = await res.json();
            return json.value || [];
        } catch (error) {
            console.warn('Quote API error, returning empty', error);
            return [];
        }
    }
};

export const OrderService = {
    getAll: async () => {
        try {
            const res = await fetch(`${API_BASE}/orders`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const json = await res.json();
            return json.value || [];
        } catch (error) {
            console.warn('Order API error, returning empty', error);
            return [];
        }
    }
};
