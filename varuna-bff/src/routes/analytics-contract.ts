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

// ============================================================================
// Enhanced Dashboard Analytics for GM Cockpit
// ============================================================================
router.post('/dashboard', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const {
            asOfDate = new Date().toISOString().split('T')[0],
            companyId,
            salesRepId,
            accountId,
            statuses // array of numbers
        } = req.body;

        // Base filter parts
        const filters: string[] = ["c.StartDate <= ?"];
        const params: any[] = [asOfDate];

        if (companyId) {
            filters.push("c.CompanyId = ?");
            params.push(companyId);
        }
        if (salesRepId) {
            filters.push("c.SalesRepresentativeId = ?");
            params.push(salesRepId);
        }
        if (accountId) {
            filters.push("c.AccountId = ?");
            params.push(accountId);
        }
        if (statuses && Array.isArray(statuses) && statuses.length > 0) {
            filters.push(`c.ContractStatus IN (${statuses.map(() => '?').join(',')})`);
            params.push(...statuses);
        }

        const whereClause = filters.length > 0 ? "WHERE " + filters.join(" AND ") : "";

        // Status mapping as requested
        const statusCase = `
            CASE c.ContractStatus
                WHEN 0 THEN 'Hazırlık Aşamasında'
                WHEN 1 THEN 'Satışta - Bilgi Bekliyor'
                WHEN 2 THEN 'Fiyat Müzakerede'
                WHEN 3 THEN 'Metin Müzakerede'
                WHEN 4 THEN 'Univera İmzasında'
                WHEN 5 THEN 'Müşteri İmzasında'
                WHEN 6 THEN 'Süresi Dolmadı'
                WHEN 7 THEN 'Bakıma Devir Olmadı'
                WHEN 8 THEN 'Arşivlendi'
                WHEN 9 THEN 'Fesih / İptal'
                WHEN 10 THEN 'Yenilendi / Süresi Doldu'
                ELSE 'Bilinmiyor'
            END
        `;

        // 1. KPI Cards (Current AsOfDate)
        const kpisQuery = `
            SELECT
                COUNT(*) as totalCount,
                COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as totalAmount,
                SUM(CASE WHEN c.StartDate <= ? AND c.FinishDate >= ? THEN 1 ELSE 0 END) as activeCount,
                COALESCE(SUM(CASE WHEN c.StartDate <= ? AND c.FinishDate >= ? THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as activeAmount,
                SUM(CASE WHEN c.ContractStatus IN (1,2,3,4,5) THEN 1 ELSE 0 END) as riskCount,
                COALESCE(SUM(CASE WHEN c.ContractStatus IN (1,2,3,4,5) THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as riskAmount,
                SUM(CASE WHEN c.ContractStatus IN (8,9) THEN 1 ELSE 0 END) as archiveCount,
                COALESCE(SUM(CASE WHEN c.ContractStatus IN (8,9) THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as archiveAmount,
                SUM(CASE WHEN c.ContractStatus = 10 THEN 1 ELSE 0 END) as expiredCount,
                COALESCE(SUM(CASE WHEN c.ContractStatus = 10 THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as expiredAmount
            FROM Contract c
            ${whereClause}
        `;
        const kpis = db.prepare(kpisQuery).get(asOfDate, asOfDate, asOfDate, asOfDate, ...params);

        // 2. Delta KPI Cards (D-1)
        const yesterday = new Date(new Date(asOfDate).getTime() - 86400000).toISOString().split('T')[0];
        const deltaParams = [yesterday, yesterday, yesterday, yesterday, yesterday, ...params.slice(1)];
        const deltaKpis = db.prepare(kpisQuery).get(...deltaParams);

        // 3. Status Breakdown
        const statusBreakdown = db.prepare(`
            SELECT
                ${statusCase} as statusLabel,
                c.ContractStatus as statusCode,
                COUNT(*) as count,
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as amount
            FROM Contract c
            ${whereClause}
            GROUP BY c.ContractStatus
            ORDER BY amount DESC
        `).all(...params);

        // 4. Müşteri Breakdown (Top 10)
        const accountBreakdown = db.prepare(`
            SELECT
                COALESCE(a.Name, c.AccountId) as accountName,
                c.AccountId as accountId,
                COUNT(c.Id) as count,
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as amount,
                COALESCE(AVG(c.TotalAmountLocalCurrency_Amount), 0) as avgAmount,
                SUM(CASE WHEN c.StartDate <= ? AND c.FinishDate >= ? THEN 1 ELSE 0 END) as activeCount,
                COALESCE(SUM(CASE WHEN c.StartDate <= ? AND c.FinishDate >= ? THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as activeAmount
            FROM Contract c
            LEFT JOIN Account a ON c.AccountId = a.Id
            ${whereClause}
            GROUP BY c.AccountId, a.Name
            ORDER BY amount DESC
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY' : 'LIMIT 10'}
        `).all(asOfDate, asOfDate, asOfDate, asOfDate, ...params);

        // 5. Satıcı Breakdown
        const repBreakdown = db.prepare(`
            SELECT
                COALESCE(p.PersonNameSurname, p.Name || ' ' || p.SurName, c.SalesRepresentativeId) as repName,
                c.SalesRepresentativeId as repId,
                COUNT(c.Id) as count,
                COALESCE(SUM(c.TotalAmountLocalCurrency_Amount), 0) as amount,
                SUM(CASE WHEN c.StartDate <= ? AND c.FinishDate >= ? THEN 1 ELSE 0 END) as activeCount,
                COALESCE(SUM(CASE WHEN c.StartDate <= ? AND c.FinishDate >= ? THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as activeAmount,
                SUM(CASE WHEN c.ContractStatus IN (1,2,3,4,5) THEN 1 ELSE 0 END) as riskCount,
                COALESCE(SUM(CASE WHEN c.ContractStatus IN (1,2,3,4,5) THEN TotalAmountLocalCurrency_Amount ELSE 0 END), 0) as riskAmount
            FROM Contract c
            LEFT JOIN Person p ON c.SalesRepresentativeId = p.Id
            ${whereClause}
            GROUP BY c.SalesRepresentativeId, p.PersonNameSurname, p.Name, p.SurName
            ORDER BY amount DESC
        `).all(asOfDate, asOfDate, asOfDate, asOfDate, ...params);

        // 6. Trend Data (Monthly for last 12 months from asOfDate)
        const trendData = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(asOfDate);
            date.setMonth(date.getMonth() - i);
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const startOfMonth = new Date(year, date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(year, date.getMonth() + 1, 0).toISOString().split('T')[0];

            const monthlyKpis = db.prepare(`
                SELECT
                    COUNT(*) as count,
                    COALESCE(SUM(TotalAmountLocalCurrency_Amount), 0) as amount
                FROM Contract c
                ${whereClause} AND c.StartDate <= ?
            `).get(endOfMonth, ...params);

            trendData.push({
                name: `${monthLabel} ${year}`,
                count: (monthlyKpis as any).count,
                amount: (monthlyKpis as any).amount
            });
        }

        res.json({
            kpis,
            deltaKpis,
            statusBreakdown,
            accountBreakdown,
            repBreakdown,
            trendData
        });

    } catch (e: any) {
        console.error("Dashboard error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
