import type { Team, TeamMember } from '../types/crm';

const getApiBaseUrl = () => (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const TeamService = {
    getAll: async (): Promise<Team[]> => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/teams`);
            if (!res.ok) throw new Error('Failed to fetch teams');
            const json = await res.json();
            return json.value || [];
        } catch (error) {
            console.warn('Team API error, returning empty', error);
            return [];
        }
    },

    getMembers: async (teamId: string): Promise<TeamMember[]> => {
        try {
            const res = await fetch(`${getApiBaseUrl()}/teams/${teamId}/members`);
            if (!res.ok) throw new Error('Failed to fetch team members');
            const json = await res.json();
            return json.value || [];
        } catch (error) {
            console.error('Team Members API error', error);
            return [];
        }
    }
};
