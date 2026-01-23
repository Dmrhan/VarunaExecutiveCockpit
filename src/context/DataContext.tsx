import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Deal, Activity, User, DashboardMetrics, DealStage } from '../types/crm';
import { generateMockData, USERS } from '../data/mockData';

interface DataContextType {
    deals: Deal[];
    activities: Activity[];
    users: User[];
    metrics: DashboardMetrics;
    isLoading: boolean;
    refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            const { deals: newDeals, activities: newActivities } = generateMockData(100);
            setDeals(newDeals);
            setActivities(newActivities);
            setIsLoading(false);
        }, 800);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const metrics = useMemo<DashboardMetrics>(() => {
        const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);

        // Calculate stalled deals (mock logic: aging > 30 days in non-closed stage)
        const stalledDealsCount = deals.filter(d =>
            !['Order', 'Lost'].includes(d.stage) && d.aging > 30
        ).length;

        // leakage by stage (mock logic)
        const leakageByStage = deals.reduce((acc, deal) => {
            acc[deal.stage] = (acc[deal.stage] || 0) + (deal.stage === 'Lost' ? 1 : 0);
            return acc;
        }, {} as Record<DealStage, number>);

        // Execution Confidence Score (mock: % of open deals with activity in last 14 days)
        const openDeals = deals.filter(d => !['Order', 'Lost'].includes(d.stage));
        const recentActivityThreshold = new Date();
        recentActivityThreshold.setDate(recentActivityThreshold.getDate() - 14);

        const dealsWithRecentActivity = openDeals.filter(d => {
            const lastAct = new Date(d.lastActivityDate);
            return lastAct >= recentActivityThreshold;
        });

        const executionConfidenceScore = openDeals.length > 0
            ? Math.round((dealsWithRecentActivity.length / openDeals.length) * 100)
            : 0;

        const topPerformers = USERS.map(u => ({ userId: u.id, score: Math.round(Math.random() * 100) })).sort((a, b) => b.score - a.score);

        return {
            totalPipelineValue,
            stalledDealsCount,
            leakageByStage,
            executionConfidenceScore,
            topPerformers
        };
    }, [deals, activities]);

    return (
        <DataContext.Provider value={{ deals, activities, users: USERS, metrics, isLoading, refreshData }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
