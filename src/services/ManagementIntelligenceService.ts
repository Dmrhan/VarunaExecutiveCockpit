
import type { TFunction } from 'i18next';
import type { Deal } from '../types/crm';

// --- Types ---

export interface RiskInsight {
    type: 'stagnant' | 'pastDue' | 'winRateDrop' | 'highConcentration';
    value: number; // e.g., 22 (for 22%)
    change: number; // e.g., 6 (for +6%)
    trend: 'up' | 'down' | 'neutral';
    messageKey: string; // Key for translation, e.g., 'executive.risk.stagnant'
    messageParams: Record<string, any>;
    severity: 'high' | 'medium' | 'low';
}

export interface PerformanceInsight {
    type: 'topPerformer' | 'lowPerformer' | 'concentration';
    agentName?: string;
    metric: string; // 'Revenue', 'Win Rate'
    value: string;
    contribution?: number; // % contribution to total
    messageKey: string;
    messageParams: Record<string, any>;
}

export interface ForecastInsight {
    confidence: number; // 0-100
    target: number;
    expected: number;
    bestCase: number;
    worstCase: number;
    messageKey: string;
    messageParams: Record<string, any>;
}

export interface RootCauseMetric {
    reason: string;
    percentage: number;
    count: number;
    trend: 'up' | 'down' | 'neutral';
}

export interface ActionRecommendation {
    id: string;
    type: 'pricing' | 'training' | 'process' | 'resource';
    titleKey: string;
    descriptionKey: string;
    priority: 'high' | 'medium';
    params?: Record<string, any>;
}

export interface RevenueTrendMetric {
    month: string;
    target: number;
    actual: number;
}

export interface ManagementIntelligenceData {
    risks: RiskInsight[];
    performance: PerformanceInsight[];
    forecast: ForecastInsight;
    revenueTrend: RevenueTrendMetric[]; // New field
    rootCauses: RootCauseMetric[];
    actions: ActionRecommendation[];
}

// --- Mock Generation Logic ---

export const getManagementIntelligence = (_deals: Deal[], _t: TFunction): ManagementIntelligenceData => {

    // 1. Risk Analysis Mocks
    const risks: RiskInsight[] = [
        {
            type: 'stagnant',
            value: 22,
            change: 6,
            trend: 'up',
            severity: 'high',
            messageKey: 'executive.risk.stagnant',
            messageParams: { percent: 22, days: 45, change: 6 }
        },
        {
            type: 'pastDue',
            value: 15,
            change: -2,
            trend: 'down',
            severity: 'medium',
            messageKey: 'executive.risk.pastDue',
            messageParams: { count: 8, value: '$1.2M' }
        }
    ];

    // 2. Performance Mocks
    const performance: PerformanceInsight[] = [
        {
            type: 'topPerformer',
            agentName: 'Ahmet Yılmaz',
            metric: 'Revenue',
            value: '$2.4M',
            contribution: 40,
            messageKey: 'executive.performance.concentration',
            messageParams: { percent: 40, agentCount: 18 } // "Total revenue 40% comes from 18% of sales team"
        }
    ];

    // 3. Forecast Mocks
    const forecast: ForecastInsight = {
        confidence: 91,
        target: 5000000,
        expected: 4800000,
        bestCase: 5200000,
        worstCase: 3900000,
        messageKey: 'executive.forecast.highConfidence',
        messageParams: { percent: 91 }
    };

    // 4. Root Cause Mocks
    const rootCauses: RootCauseMetric[] = [
        { reason: 'executive.rootCause.reasons.price', percentage: 35, count: 12, trend: 'up' },
        { reason: 'executive.rootCause.reasons.decision_time', percentage: 24, count: 9, trend: 'neutral' },
        { reason: 'executive.rootCause.reasons.product_gap', percentage: 15, count: 5, trend: 'down' },
        { reason: 'executive.rootCause.reasons.competitor', percentage: 12, count: 4, trend: 'up' }
    ];

    // 5. Action Mocks
    const actions: ActionRecommendation[] = [
        {
            id: '1',
            type: 'pricing',
            priority: 'high',
            titleKey: 'executive.actions.pricing_title',
            descriptionKey: 'executive.actions.pricing_desc',
            params: { segment: 'Enterprise' }
        },
        {
            id: '2',
            type: 'resource',
            priority: 'high',
            titleKey: 'executive.actions.load_balance_title',
            descriptionKey: 'executive.actions.load_balance_desc',
            params: { percent: 18 }
        },
        {
            id: '3',
            type: 'process',
            priority: 'medium',
            titleKey: 'executive.actions.training_title',
            descriptionKey: 'executive.actions.training_desc',
            params: {}
        }
    ];

    // 6. Revenue Trend Mocks (Last 6 Months)
    const revenueTrend: RevenueTrendMetric[] = [
        { month: 'Jan', target: 2000000, actual: 1800000 },
        { month: 'Feb', target: 2100000, actual: 2050000 },
        { month: 'Mar', target: 2200000, actual: 2300000 }, // Over target
        { month: 'Apr', target: 2400000, actual: 2350000 },
        { month: 'May', target: 2500000, actual: 2600000 }, // Strong month
        { month: 'Jun', target: 2800000, actual: 2750000 }
    ];

    return {
        risks,
        performance,
        forecast,
        revenueTrend,
        rootCauses,
        actions
    };
};
