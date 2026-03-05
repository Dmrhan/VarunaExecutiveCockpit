import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// CrmOrder Analytics - Revenue Dashboard APIs
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const activeOrderCond = 'Status != 5 AND IsDeletedFromBackend = 0'; // Assuming 5 is Cancelled

        // 1. Total Revenue (Local Currency)
        const totalRevenue = (db.queryOne(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 2. Revenue by Month (from CreateOrderDate)
        const monthExpr = db.driver === 'mssql' ? 'LEFT(CreateOrderDate, 7)' : 'substr(CreateOrderDate, 1, 7)';
        const revenueByMonth = db.query(`SELECT ${monthExpr} as Month, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND CreateOrderDate IS NOT NULL GROUP BY ${monthExpr} ORDER BY Month ASC`);

        // 3. Revenue by Invoice Month
        const invMonthExpr = db.driver === 'mssql' ? 'LEFT(InvoiceDate, 7)' : 'substr(InvoiceDate, 1, 7)';
        const revenueByInvoiceMonth = db.query(`SELECT ${invMonthExpr} as InvoiceMonth, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate IS NOT NULL GROUP BY ${invMonthExpr} ORDER BY InvoiceMonth ASC`);

        // 4. Revenue by Account
        const revenueByAccount = db.query(`
            SELECT 
                o.AccountId, 
                COALESCE(a.Title, a.Name, o.AccountId) as AccountName, 
                SUM(o.TotalNetAmountLocalCurrency_Amount) as Revenue 
            FROM CrmOrder o
            LEFT JOIN Account a ON o.AccountId = a.Id
            WHERE o.${activeOrderCond} AND o.AccountId IS NOT NULL 
            GROUP BY o.AccountId, a.Title, a.Name
        `);

        // 5. Revenue by Sales Owner
        const revenueByOwner = db.query(`SELECT ProposalOwnerId, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND ProposalOwnerId IS NOT NULL GROUP BY ProposalOwnerId`);

        // 6. Revenue by Team
        const revenueByTeam = db.query(`SELECT TeamId, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND TeamId IS NOT NULL GROUP BY TeamId`);

        // 7. Profit KPI
        const totalProfit = (db.queryOne(`SELECT SUM(TotalProfitAmount_Amount) as sum FROM CrmOrder WHERE ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 8. Average Discount
        const avgDiscount = (db.queryOne(`SELECT AVG(TotalDiscountRate) as avg FROM CrmOrder WHERE ${activeOrderCond} AND TotalDiscountRate IS NOT NULL`) as { avg: number }).avg || 0;

        // 9. Open Order Backlog (Assuming 1 is Open)
        const backlogRevenue = (db.queryOne(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE Status = 1 AND IsDeletedFromBackend = 0`) as { sum: number }).sum || 0;

        // 10. VAT Exempt Revenue
        const vatExemptRevenue = (db.queryOne(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE IsVATExempt = 1 AND ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 11. SAP Eligible Revenue
        const sapEligibleRevenue = (db.queryOne(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE IsEligibleForSapIntegration = 1 AND ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 12. Netsis Eligible Revenue
        const netsisEligibleRevenue = (db.queryOne(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE IsEligibleForNetsisIntegration = 1 AND ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 13. Cancelled Order Rate
        const totalCount = (db.queryOne(`SELECT COUNT(*) as n FROM CrmOrder WHERE IsDeletedFromBackend = 0`) as { n: number }).n || 0;
        let cancelledRate = 0;
        if (totalCount > 0) {
            const cancelledCount = (db.queryOne(`SELECT COUNT(*) as n FROM CrmOrder WHERE Status = 5 AND IsDeletedFromBackend = 0`) as { n: number }).n || 0;
            cancelledRate = cancelledCount / totalCount;
        }

        res.json({
            totalRevenue,
            revenueByMonth,
            revenueByInvoiceMonth,
            revenueByAccount,
            revenueByOwner,
            revenueByTeam,
            totalProfit,
            avgDiscount,
            backlogRevenue,
            vatExemptRevenue,
            sapEligibleRevenue,
            netsisEligibleRevenue,
            cancelledRate
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
