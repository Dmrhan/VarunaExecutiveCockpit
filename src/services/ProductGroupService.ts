import type { IProductGroup } from '../types/crm';

const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

let cachedProductGroups: IProductGroup[] | null = null;

export const ProductGroupService = {
    getAll: async (): Promise<IProductGroup[]> => {
        if (cachedProductGroups) return cachedProductGroups;

        try {
            const response = await fetch(`${getApiBaseUrl()}/product-groups`);
            if (!response.ok) throw new Error('Failed to fetch product groups');
            const data = await response.json();

            // Map snake_case from DB to camelCase for frontend
            cachedProductGroups = data.map((item: any) => ({
                id: item.Id,
                code: item.Code,
                name: item.Name,
                shortName: item.ShortName,
                status: item.Status,
                parentGroupId: item.ParentGroupId,
                level: item.Level
            }));

            return cachedProductGroups || [];
        } catch (error) {
            console.error('[Service:ProductGroup] Error fetching product groups:', error);
            // Fallback to static data if API fails
            return [
                { id: 'PG-ENR', code: 'PG-ENR', name: 'EnRoute', shortName: 'EnRoute', status: 1, level: 0 },
                { id: 'PG-QST', code: 'PG-QST', name: 'Quest', shortName: 'Quest', status: 1, level: 0 },
                { id: 'PG-STB', code: 'PG-STB', name: 'Stokbar', shortName: 'Stokbar', status: 1, level: 0 },
                { id: 'PG-SVC', code: 'PG-SVC', name: 'ServiceCore', shortName: 'ServiceCore', status: 1, level: 0 },
                { id: 'PG-VRN', code: 'PG-VRN', name: 'Varuna', shortName: 'Varuna', status: 1, level: 0 },
                { id: 'PG-HST', code: 'PG-HST', name: 'Hosting', shortName: 'Hosting', status: 1, level: 0 },
                { id: 'PG-UDX', code: 'PG-UDX', name: 'Unidox', shortName: 'Unidox', status: 1, level: 0 },
            ];
        }
    },

    clearCache: () => {
        cachedProductGroups = null;
    }
};
