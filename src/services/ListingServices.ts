const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const ContractService = {
    getAll: async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/contracts`);
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
            const res = await fetch(`${getApiBaseUrl()}/contracts/${id}`);
            if (!res.ok) throw new Error('Failed to fetch contract');
            return await res.json();
        } catch (error) {
            console.error('Contract Detail API error', error);
            throw error;
        }
    },
    getDashboardAnalytics: async (filters: any) => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/analytics/contract/dashboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filters)
            });
            if (!res.ok) throw new Error('Failed to fetch dashboard analytics');
            return await res.json();
        } catch (error) {
            console.error('Dashboard Analytics API error', error);
            return null;
        }
    }
};

export const QuoteService = {
    getAll: async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/quotes`);
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
            const res = await fetch(`${getApiBaseUrl()}/orders`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            const json = await res.json();
            return json.value || [];
        } catch (error) {
            console.warn('Order API error, returning empty', error);
            return [];
        }
    }
};

export const AccountService = {
    getList: async () => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/analytics/account/list`);
            if (!res.ok) throw new Error('Failed to fetch account list');
            return await res.json();
        } catch (error) {
            console.error('Account List API error', error);
            return [];
        }
    }
};
