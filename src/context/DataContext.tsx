import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Deal, Activity, User, DashboardMetrics, DealStage, Quote, Order, Contract } from '../types/crm';
import { generateMockData, USERS } from '../data/mockData';
import { OpportunityService } from '../services/OpportunityService';

interface DataContextType {
    deals: Deal[];
    users: User[];
    activities: Activity[];
    quotes: Quote[];
    orders: Order[];
    contracts: Contract[];
    metrics: DashboardMetrics;
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Fetch persistent deals from Service
            const fetchedDeals = await OpportunityService.getAll();
            setDeals(fetchedDeals);

            // Keep other data mock for now (or move to services if needed later)
            const { activities: newActivities, quotes: newQuotes, orders: newOrders, contracts: newContracts } = generateMockData(0); // 0 because we only want aux data
            // actually generateMockData generates everything tightly coupled. 
            // Let's just generate aux data separately or accept that we might desync slightly for this demo.
            // BETTER: generateMockData gives us everything. Let's just Initialize OpportunityService WITH that data if empty.
            // OpportunityService.getAll() internally calls initDatabase() which calls generateMockData(451).

            // So we just need to get the REST of the data (Activities, etc) consistent with those deals?
            // The current generateMockData(451) creates deals AND activities linked to them.
            // If we split them, we might lose the link.
            // PROPOSAL: Let DataProvider rely on OpportunityService for deals, and use a separate simpler mock for others for now, 
            // OR just accept that for this "Opportunity Management" task, the focus is on Deals.

            // Let's rely on the fact that existing generateMockData is deterministic-ish or we just generate new aux data.
            // For now, I will just call generateMockData(451) inside the service to init, and then here I need aux data.
            // Actually, if I call generateMockData in Service, I can't easily get the activities out.

            // REVISION: I will update refreshData to:
            // 1. Get Deals from OpportunityService.
            // 2. Generate other mock data independently for now (it's visual noise mostly).

            setActivities(generateMockData(50).activities); // Temporary fix to get some activities
            setQuotes(generateMockData(20).quotes);
            setOrders(generateMockData(20).orders);
            setContracts(generateMockData(20).contracts);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const metrics = useMemo<DashboardMetrics>(() => {
        const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);

        // Calculate stalled deals (mock logic: aging > 30 days in non-closed stage)
        const stalledDealsCount = deals.filter(d =>
            !['Order', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage) && d.aging > 30
        ).length;

        // leakage by stage (mock logic)
        const leakageByStage = deals.reduce((acc, deal) => {
            acc[deal.stage] = (acc[deal.stage] || 0) + (['Lost', 'Kaybedildi'].includes(deal.stage) ? 1 : 0);
            return acc;
        }, {} as Record<DealStage, number>);

        // Execution Confidence Score (mock: % of open deals with activity in last 14 days)
        const openDeals = deals.filter(d => !['Order', 'Lost', 'Kazanıldı', 'Kaybedildi'].includes(d.stage));
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
        <DataContext.Provider value={{ deals, activities, quotes, orders, contracts, users: USERS, metrics, isLoading, refreshData }}>
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
