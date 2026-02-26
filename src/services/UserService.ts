import type { User } from '../types/crm';
import { USERS } from '../data/mockData';

const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const getUserUrl = () => `${getApiBaseUrl()}/users`;

export const UserService = {
    getAll: async (): Promise<User[]> => {
        try {
            const response = await fetch(getUserUrl());
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('API Error, falling back to mock users:', error);
            return USERS;
        }
    }
};
