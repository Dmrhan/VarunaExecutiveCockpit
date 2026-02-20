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
        const totalRevenue = (db.prepare(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE ${activeOrderCond}`).get() as { sum: number }).sum || 0;

        // 2. Revenue by Month (from CreateOrderDate)
        const revenueByMonth = db.prepare(`SELECT substr(CreateOrderDate, 1, 7) as Month, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND CreateOrderDate IS NOT NULL GROUP BY substr(CreateOrderDate, 1, 7) ORDER BY Month ASC`).all();

        // 3. Revenue by Invoice Month
        const revenueByInvoiceMonth = db.prepare(`SELECT substr(InvoiceDate, 1, 7) as InvoiceMonth, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND InvoiceDate IS NOT NULL GROUP BY substr(InvoiceDate, 1, 7) ORDER BY InvoiceMonth ASC`).all();

        // 4. Revenue by Account
        const revenueByAccount = db.prepare(`SELECT AccountId, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND AccountId IS NOT NULL GROUP BY AccountId`).all();

        // 5. Revenue by Sales Owner
        const revenueByOwner = db.prepare(`SELECT ProposalOwnerId, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND ProposalOwnerId IS NOT NULL GROUP BY ProposalOwnerId`).all();

        // 6. Revenue by Team
        const revenueByTeam = db.prepare(`SELECT TeamId, SUM(TotalNetAmountLocalCurrency_Amount) as Revenue FROM CrmOrder WHERE ${activeOrderCond} AND TeamId IS NOT NULL GROUP BY TeamId`).all();

        // 7. Profit KPI
        const totalProfit = (db.prepare(`SELECT SUM(TotalProfitAmount_Amount) as sum FROM CrmOrder WHERE ${activeOrderCond}`).get() as { sum: number }).sum || 0;

        // 8. Average Discount
        const avgDiscount = (db.prepare(`SELECT AVG(TotalDiscountRate) as avg FROM CrmOrder WHERE ${activeOrderCond} AND TotalDiscountRate IS NOT NULL`).get() as { avg: number }).avg || 0;

        // 9. Open Order Backlog (Assuming 1 is Open)
        const backlogRevenue = (db.prepare(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE Status = 1 AND IsDeletedFromBackend = 0`).get() as { sum: number }).sum || 0;

        // 10. VAT Exempt Revenue
        const vatExemptRevenue = (db.prepare(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE IsVATExempt = 1 AND ${activeOrderCond}`).get() as { sum: number }).sum || 0;

        // 11. SAP Eligible Revenue
        const sapEligibleRevenue = (db.prepare(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE IsEligibleForSapIntegration = 1 AND ${activeOrderCond}`).get() as { sum: number }).sum || 0;

        // 12. Netsis Eligible Revenue
        const netsisEligibleRevenue = (db.prepare(`SELECT SUM(TotalNetAmountLocalCurrency_Amount) as sum FROM CrmOrder WHERE IsEligibleForNetsisIntegration = 1 AND ${activeOrderCond}`).get() as { sum: number }).sum || 0;

        // 13. Cancelled Order Rate
        const totalCount = (db.prepare(`SELECT COUNT(*) as n FROM CrmOrder WHERE IsDeletedFromBackend = 0`).get() as { n: number }).n || 0;
        let cancelledRate = 0;
        if (totalCount > 0) {
            const cancelledCount = (db.prepare(`SELECT COUNT(*) as n FROM CrmOrder WHERE Status = 5 AND IsDeletedFromBackend = 0`).get() as { n: number }).n || 0;
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
