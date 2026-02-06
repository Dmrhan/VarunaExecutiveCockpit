import type { Deal } from '../types/crm';
import type { TFunction } from 'i18next';

export interface KPIMetric {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    tooltip: string;
}

export interface NarrativeParams {
    status: string;
    trend: string;
    lossStatus: string;
    pipelineStrength: string;
    topProduct: string;
}

export interface ExecutiveBriefData {
    narrativeParams: NarrativeParams;
    kpis: KPIMetric[];
}

export const generateExecutiveBrief = (deals: Deal[], t: TFunction): ExecutiveBriefData => {
    // Calculate current period metrics
    const totalDeals = deals.length;
    const wonDeals = deals.filter(d => d.stage === 'Kazanıldı' || d.stage === 'Order').length;
    const lostDeals = deals.filter(d => d.stage === 'Kaybedildi').length;
    const conversionRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100) : 0;

    const wonValue = deals
        .filter(d => d.stage === 'Kazanıldı' || d.stage === 'Order')
        .reduce((sum, d) => sum + d.value, 0);

    const lostValue = deals
        .filter(d => d.stage === 'Kaybedildi')
        .reduce((sum, d) => sum + d.value, 0);

    const pipelineValue = deals
        .filter(d => d.stage !== 'Kazanıldı' && d.stage !== 'Kaybedildi' && d.stage !== 'Order')
        .reduce((sum, d) => sum + d.value, 0);

    // Generate narrative params
    const narrativeParams = generateNarrativeParams(deals, {
        totalDeals,
        lostDeals,
        conversionRate,
        pipelineValue
    });

    // Generate KPIs with mock trend data (in production, compare with previous period)
    const kpis: KPIMetric[] = [
        {
            label: t('executiveBrief.kpis.totalDeals'),
            value: totalDeals.toString(),
            trend: 'up',
            trendValue: '+12%',
            tooltip: t('executiveBrief.kpis.tooltips.totalDeals')
        },
        {
            label: t('executiveBrief.kpis.conversionRate'),
            value: `${conversionRate.toFixed(1)}%`,
            trend: conversionRate > 25 ? 'up' : 'down',
            trendValue: '+3.2pp',
            tooltip: t('executiveBrief.kpis.tooltips.conversionRate')
        },
        {
            label: t('executiveBrief.kpis.wonDeals'),
            value: `${wonDeals} ($${(wonValue / 1000000).toFixed(1)}M)`,
            trend: 'up',
            trendValue: '+18%',
            tooltip: t('executiveBrief.kpis.tooltips.wonDetails', { count: wonDeals, value: `$${wonValue.toLocaleString()}` })
        },
        {
            label: t('executiveBrief.kpis.lostDeals'),
            value: `${lostDeals} ($${(lostValue / 1000000).toFixed(1)}M)`,
            trend: lostDeals < 50 ? 'down' : 'up',
            trendValue: lostDeals < 50 ? '-5%' : '+5%',
            tooltip: `${t('executiveBrief.kpis.riskAnalysis')}: ${lostDeals > 50 ? t('executiveBrief.kpis.needsAttention') : t('executiveBrief.kpis.acceptable')}`
        },
        {
            label: t('executiveBrief.kpis.pipelineRevenue'),
            value: `$${(pipelineValue / 1000000).toFixed(1)}M`,
            trend: 'up',
            trendValue: '+24%',
            tooltip: t('executiveBrief.kpis.tooltips.pipelineStrength')
        }
    ];

    return { narrativeParams, kpis };
};

const generateNarrativeParams = (
    deals: Deal[],
    metrics: { totalDeals: number; lostDeals: number; conversionRate: number; pipelineValue: number }
): NarrativeParams => {
    const { totalDeals, lostDeals, conversionRate, pipelineValue } = metrics;

    // Analyze trends
    const pipelineStrength = pipelineValue > 50000000 ? 'strong' : pipelineValue > 20000000 ? 'stable' : 'weak';
    const conversionTrend = conversionRate > 25 ? 'increasing' : conversionRate > 15 ? 'stable' : 'decreasing';
    const status = totalDeals > 400 ? 'high' : 'stable';
    const lossStatus = lostDeals > 50 ? 'needsAttention' : 'underControl';

    // Find top performing product
    const productCounts = deals.reduce((acc, deal) => {
        acc[deal.product] = (acc[deal.product] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topProduct = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'EnRoute';

    return {
        status,
        trend: conversionTrend,
        lossStatus,
        pipelineStrength,
        topProduct
    };
};

