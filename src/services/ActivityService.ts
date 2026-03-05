import type { Activity } from '../types/crm';

const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const ActivityService = {
    getAll: async (): Promise<Activity[]> => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/activities`);
            if (!response.ok) throw new Error('Failed to fetch activities');
            return await response.json();
        } catch (error) {
            console.warn('API Error, falling back to empty activities:', error);
            return [];
        }
    }
};
