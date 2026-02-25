import axios from 'axios';

const API_BASE_URL = `${window.__RUNTIME_CONFIG__?.VITE_API_BASE_URL || 'http://localhost:3001/api'}/performance`;

export interface PerformanceDailyMetrics {
    WeeklyContractCount: number;
    WeeklyContractAmount: number;
    MonthlyContractCount: number;
    MonthlyContractAmount: number;
    OpenContractCount: number;
    OpenContractPotentialAmount: number;
    TodayInvoiceCount: number;
    TodayInvoiceAmount: number;
    WeeklyInvoiceCount: number;
    WeeklyInvoiceAmount: number;
    MonthlyInvoiceCount: number;
    MonthlyInvoiceAmount: number;
    YTDInvoiceAmount: number;
    TodayDueReceivable: number;
    TodayCollectedAmount: number;
    OpenReceivableRisk: number;

    MonthlyContractTarget: number;
    MonthlyInvoiceTarget: number;
    YearlyInvoiceTarget: number;

    MonthlyContractAchievementRate: number;
    PipelineImpactMonthlyRate: number;
    PipelineImpactYearlyRate: number;

    RevenueGap: number;
    MonthlyAchievementRate: number;
    YearlyAchievementRate: number;

    CollectionRatio: number;

    Deltas?: {
        TodayInvoiceAmount: number;
        YTDInvoiceAmount: number;
        TodayCollectedAmount: number;
        TodayDueReceivable: number;
        WeeklyContractAmount: number;
        MonthlyContractAmount: number;
        WeeklyInvoiceAmount: number;
        MonthlyInvoiceAmount: number;
    };
}

export interface BurnupDataPoint {
    date: string;
    cumulativeContract: number;
    cumulativeInvoice: number;
    cumulativeCollection: number;
}

export interface BurnupResponse {
    burnup: BurnupDataPoint[];
}

export interface TrendDataPoint {
    PeriodKey: string;
    ContractAmount: number;
    InvoiceAmount: number;
    CollectionAmount: number;
    TargetAmount?: number;
}

export interface PerformanceTrendResponse {
    trends: TrendDataPoint[];
}

export const PerformanceService = {
    getDailyMetrics: async (params?: { companyId?: string, ownerId?: string, monthlyTarget?: number, yearlyTarget?: number, asOfDate?: string }): Promise<PerformanceDailyMetrics> => {
        const response = await axios.get(`${API_BASE_URL}/daily`, { params });
        return response.data;
    },

    getBurnupData: async (params?: { companyId?: string, ownerId?: string, asOfDate?: string }): Promise<BurnupResponse> => {
        const response = await axios.get(`${API_BASE_URL}/burnup`, { params });
        return response.data;
    },

    getTrends: async (
        period: 'weekly' | 'monthly' | 'quarterly',
        params?: { companyId?: string, ownerId?: string }
    ): Promise<PerformanceTrendResponse> => {
        const response = await axios.get(`${API_BASE_URL}/${period}`, { params });
        return response.data;
    }
};
