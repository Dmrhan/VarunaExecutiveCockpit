import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Deal, Activity, User, DashboardMetrics, DealStage, Quote, Order, Contract } from '../types/crm';
import { generateMockData, generateActivitiesForDeals, generateAuxiliaryDataForDeals, USERS } from '../data/mockData';
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

            // Generate activities linked to fetched deals
            const newActivities = generateActivitiesForDeals(fetchedDeals);
            setActivities(newActivities);

            // Generate other auxiliary data (Quotes, Orders, Contracts)
            // Note: For now, we generate them independently, but ideally they should also be linked.
            // However, the main issue was Activities showing "Unknown".
            const auxMock = generateMockData(850);
            const auxData = generateAuxiliaryDataForDeals(fetchedDeals);
            setQuotes(auxData.quotes);
            setOrders(auxData.orders);
            setContracts(auxMock.contracts);

        } catch (error) {
            console.error("Failed to fetch data, falling back to mock data", error);
            const mock = generateMockData(850);
            const auxData = generateAuxiliaryDataForDeals(mock.deals);
            setDeals(mock.deals);
            setActivities(mock.activities);
            setQuotes(auxData.quotes);
            setOrders(auxData.orders);
            setContracts(mock.contracts);
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
