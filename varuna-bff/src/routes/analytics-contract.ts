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
        const totalActiveContracts = (db.queryOne(`
            SELECT COUNT(*) as n FROM Contract WHERE ContractStatus = 1
        `) as { n: number }).n || 0;

        // 2. Total Contract Revenue (Local Currency)
        const contractRevenue = (db.queryOne(`
            SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as n FROM Contract WHERE ContractStatus = 1
        `) as { n: number }).n || 0;

        // 3. ARR (Annual Recurring Revenue)
        const daysExpr = db.driver === 'mssql'
            ? 'DATEDIFF(day, StartDate, FinishDate)'
            : '(julianday(FinishDate) - julianday(StartDate))';

        const arrResult = db.queryOne(`
            SELECT 
                COALESCE(SUM(TotalAmountLocalCurrency_Amount / 
                    MAX(1, (${daysExpr} / 30))
                ) * 12, 0) as ARR
            FROM Contract
            WHERE ContractStatus = 1
        `) as { ARR: number };

        // 4. Remaining Revenue (Balance)
        const remainingRevenue = (db.queryOne(`
            SELECT COALESCE(SUM(RemainingBalance_Amount), 0) as n FROM Contract WHERE ContractStatus = 1
        `) as { n: number }).n || 0;

        // 5. Global Collection Ratio
        const collectionRatioRow = db.queryOne(`
            SELECT 
                COUNT(Id) as TotalPayments,
                SUM(CASE WHEN HasBeenCollected = 1 THEN 1 ELSE 0 END) as PaymentsCollected
            FROM ContractPaymentPlans
        `) as { TotalPayments: number, PaymentsCollected: number };

        let collectionRatio = 0;
        if (collectionRatioRow && collectionRatioRow.TotalPayments > 0) {
            collectionRatio = collectionRatioRow.PaymentsCollected / collectionRatioRow.TotalPayments;
        }

        // 6. Upcoming Renewals (Next 60 Days)
        const nowPlus60 = db.driver === 'mssql' ? 'DATEADD(day, 60, GETUTCDATE())' : "date('now', '+60 days')";
        const upcomingRenewals = db.query(`
            SELECT 
                c.Id, c.ContractName, c.AccountId, c.SalesRepresentativeId, p.PersonNameSurname as RepName,
                c.TotalAmountLocalCurrency_Amount as RenewalValue,
                c.RenewalDate, c.FinishDate, c.IsAutoExtending
            FROM Contract c
            LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
            WHERE c.ContractStatus = 1 
            AND c.RenewalDate IS NOT NULL 
            AND c.RenewalDate <= ${nowPlus60}
            ORDER BY c.RenewalDate ASC
        `);

        // 7. Auto-Renewal Risk Count
        const nowPlus90 = db.driver === 'mssql' ? 'DATEADD(day, 90, GETUTCDATE())' : "date('now', '+90 days')";
        const autoRenewalRiskCount = (db.queryOne(`
            SELECT COUNT(*) as n 
            FROM Contract 
            WHERE ContractStatus = 1 
            AND IsAutoExtending = 0 
            AND FinishDate <= ${nowPlus90}
        `) as { n: number }).n || 0;

        // 8. Average Contract Duration (Months)
        const durationExpr = db.driver === 'mssql'
            ? 'AVG(CAST(DATEDIFF(day, StartDate, FinishDate) AS FLOAT) / 30)'
            : 'AVG((julianday(FinishDate) - julianday(StartDate)) / 30)';

        const durationRow = db.queryOne(`
            SELECT COALESCE(${durationExpr}, 0) as AvgDurationMonths
            FROM Contract
            WHERE ContractStatus = 1 AND StartDate IS NOT NULL AND FinishDate IS NOT NULL
        `) as { AvgDurationMonths: number };

        // 9. Late Interest Exposure Value
        const lateInterestExposure = (db.queryOne(`
            SELECT COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as n 
            FROM Contract 
            WHERE ContractStatus = 1 AND IsLateInterestApply = 1
        `) as { n: number }).n || 0;

        // 10. Rep Contract Portfolio
        const repPortfolio = db.query(`
            SELECT 
                c.SalesRepresentativeId,
                p.PersonNameSurname as RepName,
                COUNT(c.Id) as ActiveContracts,
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as PortfolioValue,
                COALESCE(SUM(c.RemainingBalance_Amount), 0) as TotalRemainingBalance,
                COALESCE(AVG(CAST(${daysExpr} AS FLOAT) / 30), 0) as AvgContractLengthMonths
            FROM Contract c
            LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
            WHERE c.ContractStatus = 1
            GROUP BY c.SalesRepresentativeId, p.PersonNameSurname
            ORDER BY PortfolioValue DESC
        `);

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
