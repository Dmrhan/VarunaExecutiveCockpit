import type { Contract, CollectionAnalysisResult } from '../types/crm';

export const analyzeCollectionRisk = async (contract: Contract): Promise<CollectionAnalysisResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple deterministic logic for "AI" insights based on mock data
    const overdueCount = contract.paymentPlan?.filter((p: any) => p.status === 'Overdue').length || 0;
    const pendingAmount = contract.paymentPlan?.filter((p: any) => p.status === 'Pending').reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    let riskScore = 85; // Base high score
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (overdueCount > 0) {
        riskScore -= (overdueCount * 15);
        riskLevel = riskScore < 50 ? 'High' : 'Medium';
        insights.push(`${overdueCount} payment installment(s) are currently overdue.`);
        recommendations.push(`Initiate immediate follow-up for overdue invoice(s).`);
    } else {
        insights.push("Payment history is clean with no delays.");
        recommendations.push("Offer early payment discount for next renewal.");
    }

    if (contract.daysToRenewal < 60) {
        insights.push(`Contract renewal is approaching in ${contract.daysToRenewal} days.`);
        recommendations.push("Schedule QBR to discuss value delivery prior to renewal.");
    }

    // Currency risk
    if (contract.currency !== 'TRY') {
        riskScore -= 5;
        insights.push(`Exposure to ${contract.currency} currency fluctuations.`);
        recommendations.push("Consider hedging or fixing exchange rate for next term.");
    }

    if (riskScore < 0) riskScore = 0;
    if (riskScore > 100) riskScore = 100;

    return {
        riskScore,
        riskLevel,
        insights,
        recommendations
    };
};
