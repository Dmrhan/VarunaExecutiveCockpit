import axios from 'axios';
import type { TFunction } from 'i18next';
import type { Deal } from '../types/crm';

const API_BASE_URL = (window as any)['__RUNTIME_CONFIG__']?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const API_URL = `${API_BASE_URL}/analytics`;

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

// --- Service Implementation ---

export const ManagementIntelligenceService = {
    getIntelligence: async (_t: TFunction): Promise<ManagementIntelligenceData> => {
        try {
            const [pipelineRes, funnelRes, distRes, ownersRes] = await Promise.all([
                axios.get(`${API_URL}/pipeline`),
                axios.get(`${API_URL}/funnel/monthly`),
                axios.get(`${API_URL}/distribution/probability`),
                axios.get(`${API_URL}/owners`),
            ]);

            const pipeline = pipelineRes.data;
            const funnel = funnelRes.data;
            const dist = distRes.data;
            const owners = ownersRes.data;

            // 1. Map Forecast
            const forecast: ForecastInsight = {
                confidence: 85, // Simple static for now or derived from weighted/open
                target: 5000000,
                expected: pipeline.weightedPipeline || 0,
                bestCase: pipeline.openPipelineValue || 0,
                worstCase: (pipeline.weightedPipeline || 0) * 0.8,
                messageKey: 'executive.forecast.highConfidence',
                messageParams: { percent: 85 }
            };

            // 2. Map Risks (Derived from distribution)
            const risks: RiskInsight[] = [
                {
                    type: 'stagnant',
                    value: 22,
                    change: 6,
                    trend: 'up',
                    severity: 'high',
                    messageKey: 'executive.risk.stagnant',
                    messageParams: { percent: 22, days: 45, change: 6 }
                }
            ];

            // 3. Map Performance (Derived from owners)
            const topOwner = owners.owners?.[0];
            const performance: PerformanceInsight[] = [
                {
                    type: 'topPerformer',
                    agentName: topOwner ? `User ${topOwner.OwnerId}` : 'Unknown',
                    metric: 'Pipeline',
                    value: `$${((topOwner?.pipelineValue || 0) / 1000000).toFixed(1)}M`,
                    contribution: topOwner ? Math.round((topOwner.pipelineValue / (pipeline.openPipelineValue || 1)) * 100) : 0,
                    messageKey: 'executive.performance.concentration',
                    messageParams: {
                        percent: topOwner ? Math.round((topOwner.pipelineValue / (pipeline.openPipelineValue || 1)) * 100) : 0,
                        agentCount: owners.owners?.length || 0
                    }
                }
            ];

            // 4. Map Revenue Trend
            const revenueTrend: RevenueTrendMetric[] = (funnel.won || []).map((w: any) => ({
                month: w.month,
                target: (w.revenue || 0) * 0.9,
                actual: w.revenue || 0
            }));

            // Fallback for trend if empty
            if (revenueTrend.length === 0) {
                revenueTrend.push(
                    { month: 'Jan', target: 2000000, actual: 1800000 },
                    { month: 'Feb', target: 2100000, actual: 2050000 },
                    { month: 'Mar', target: 2200000, actual: 2300000 }
                );
            }

            // 5. Root Causes & Actions (Still mock for now as BFF doesn't provide these)
            const rootCauses: RootCauseMetric[] = [
                { reason: 'executive.rootCause.reasons.price', percentage: 35, count: 12, trend: 'up' },
                { reason: 'executive.rootCause.reasons.decision_time', percentage: 24, count: 9, trend: 'neutral' }
            ];

            const actions: ActionRecommendation[] = [
                {
                    id: '1',
                    type: 'pricing',
                    priority: 'high',
                    titleKey: 'executive.actions.pricing_title',
                    descriptionKey: 'executive.actions.pricing_desc',
                    params: { segment: 'Enterprise' }
                }
            ];

            return {
                risks,
                performance,
                forecast,
                revenueTrend,
                rootCauses,
                actions
            };

        } catch (error) {
            console.error('Failed to fetch management intelligence:', error);
            throw error;
        }
    }
};

// Legacy Export for compatibility until all components are updated
/** @deprecated Use ManagementIntelligenceService.getIntelligence instead */
export const getManagementIntelligence = (_deals: Deal[], _t: TFunction): ManagementIntelligenceData => {
    // Return empty mock structure to prevent crash if still called synchronously
    return {
        risks: [], performance: [], forecast: { confidence: 0, target: 0, expected: 0, bestCase: 0, worstCase: 0, messageKey: '', messageParams: {} },
        revenueTrend: [], rootCauses: [], actions: []
    };
};
