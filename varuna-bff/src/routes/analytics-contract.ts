import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Contract Analytics - Recurring Revenue Fact Table
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // 1. Total Active Contracts
        const totalActiveContracts = (db.prepare(`
            SELECT COUNT(*) as n FROM Contract WHERE ContractStatus = 1
        `).get() as { n: number }).n || 0;

        // 2. Total Contract Revenue (Local Currency)
        const contractRevenue = (db.prepare(`
            SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as n FROM Contract WHERE ContractStatus = 1
        `).get() as { n: number }).n || 0;

        // 3. ARR (Annual Recurring Revenue)
        const arrResult = db.prepare(`
            SELECT 
                COALESCE(SUM(TotalAmountLocalCurrency_Amount / 
                    MAX(1, ((julianday(FinishDate) - julianday(StartDate)) / 30))
                ) * 12, 0) as ARR
            FROM Contract
            WHERE ContractStatus = 1
        `).get() as { ARR: number };

        // 4. Remaining Revenue (Balance)
        const remainingRevenue = (db.prepare(`
            SELECT COALESCE(SUM(RemainingBalance_Amount), 0) as n FROM Contract WHERE ContractStatus = 1
        `).get() as { n: number }).n || 0;

        // 5. Global Collection Ratio
        const collectionRatioRow = db.prepare(`
            SELECT 
                COUNT(Id) as TotalPayments,
                SUM(CASE WHEN HasBeenCollected = 1 THEN 1 ELSE 0 END) as PaymentsCollected
            FROM ContractPaymentPlans
        `).get() as { TotalPayments: number, PaymentsCollected: number };

        let collectionRatio = 0;
        if (collectionRatioRow && collectionRatioRow.TotalPayments > 0) {
            collectionRatio = collectionRatioRow.PaymentsCollected / collectionRatioRow.TotalPayments;
        }

        // 6. Upcoming Renewals (Next 60 Days)
        const upcomingRenewals = db.prepare(`
            SELECT 
                c.Id, c.ContractName, c.AccountId, c.SalesRepresentativeId, p.PersonNameSurname as RepName,
                c.TotalAmountLocalCurrency_Amount as RenewalValue,
                c.RenewalDate, c.FinishDate, c.IsAutoExtending
            FROM Contract c
            LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
            WHERE c.ContractStatus = 1 
            AND c.RenewalDate IS NOT NULL 
            AND julianday(c.RenewalDate) <= julianday('now', '+60 days')
            ORDER BY c.RenewalDate ASC
        `).all();

        // 7. Auto-Renewal Risk Count
        const autoRenewalRiskCount = (db.prepare(`
            SELECT COUNT(*) as n 
            FROM Contract 
            WHERE ContractStatus = 1 
            AND IsAutoExtending = 0 
            AND julianday(FinishDate) <= julianday('now', '+90 days')
        `).get() as { n: number }).n || 0;

        // 8. Average Contract Duration (Months)
        const durationRow = db.prepare(`
            SELECT COALESCE(AVG((julianday(FinishDate) - julianday(StartDate)) / 30), 0) as AvgDurationMonths
            FROM Contract
            WHERE ContractStatus = 1 AND StartDate IS NOT NULL AND FinishDate IS NOT NULL
        `).get() as { AvgDurationMonths: number };

        // 9. Late Interest Exposure Value
        const lateInterestExposure = (db.prepare(`
            SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as n 
            FROM Contract 
            WHERE ContractStatus = 1 AND IsLateInterestApply = 1
        `).get() as { n: number }).n || 0;

        // 10. Rep Contract Portfolio
        const repPortfolio = db.prepare(`
            SELECT 
                c.SalesRepresentativeId,
                p.PersonNameSurname as RepName,
                COUNT(c.Id) as ActiveContracts,
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as PortfolioValue,
                COALESCE(SUM(c.RemainingBalance_Amount), 0) as TotalRemainingBalance,
                COALESCE(AVG((julianday(c.FinishDate) - julianday(c.StartDate)) / 30), 0) as AvgContractLengthMonths
            FROM Contract c
            LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
            WHERE c.ContractStatus = 1
            GROUP BY c.SalesRepresentativeId, p.PersonNameSurname
            ORDER BY PortfolioValue DESC
        `).all();

        res.json({
            metrics: {
                totalActiveContracts,
                contractRevenue,
                arr: arrResult.ARR,
                remainingRevenue,
                collectionRatio,
                autoRenewalRiskCount,
                avgDurationMonths: durationRow.AvgDurationMonths,
                lateInterestExposure
            },
            analytics: {
                upcomingRenewals,
                repPortfolio
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
