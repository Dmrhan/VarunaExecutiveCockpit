import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// CrmOrderProducts Analytics - Product / Margin / Discount KPIs
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        // Base join filtering out cancelled or deleted orders
        const activeOrderCond = `
            FROM CrmOrderProducts p
            JOIN CrmOrder o ON p.CrmOrderId = o.Id
            WHERE o.Status != 5 AND o.IsDeletedFromBackend = 0
        `;

        // 1. Product Revenue
        const productRevenue = (db.queryOne(`SELECT SUM(p.NetLineSubTotalLocalCurrency_Amount) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 2. Product Revenue With Tax
        const revenueWithTax = (db.queryOne(`SELECT SUM(p.NetLineTotalWithTaxLocalCurrency_Amount) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 3. Product Profit
        const productProfit = (db.queryOne(`SELECT SUM(p.TotalProfitAmountWithLocalCurrency_Amount) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 4. Profit After Discount
        const profitAfterDiscount = (db.queryOne(`SELECT SUM(p.ProfitAfterSubtotalDiscountLocalCurrency_Amount) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 5. Discount Leakage
        const discountLeakage = (db.queryOne(`SELECT SUM(p.LineDiscountAmount_Amount) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 6. Average Margin
        const averageMargin = (db.queryOne(`SELECT AVG(p.ProfitRate) as avg ${activeOrderCond} AND p.ProfitRate IS NOT NULL`) as { avg: number }).avg || 0;

        // 7. Revenue by Product
        const revenueByProduct = db.query(`SELECT p.StockId, SUM(p.NetLineSubTotalLocalCurrency_Amount) as Revenue ${activeOrderCond} GROUP BY p.StockId`);

        // 8. Revenue by PYP
        const revenueByPyp = db.query(`SELECT p.PYPSapId, SUM(p.NetLineSubTotalLocalCurrency_Amount) as Revenue ${activeOrderCond} AND p.PYPSapId IS NOT NULL GROUP BY p.PYPSapId`);

        // 9. Revenue by Storage Location
        const revenueByStorage = db.query(`SELECT p.StorageLocationSapId, SUM(p.NetLineSubTotalLocalCurrency_Amount) as Revenue ${activeOrderCond} AND p.StorageLocationSapId IS NOT NULL GROUP BY p.StorageLocationSapId`);

        // 10. Revenue by Production Location
        const revenueByProduction = db.query(`SELECT p.ProductionLocationSapId, SUM(p.NetLineSubTotalLocalCurrency_Amount) as Revenue ${activeOrderCond} AND p.ProductionLocationSapId IS NOT NULL GROUP BY p.ProductionLocationSapId`);

        // 11. Commission Exposure
        const commissionExposure = (db.queryOne(`SELECT SUM(p.NetLineSubTotalLocalCurrency_Amount * COALESCE(p.ComissionRate, 0) / 100.0) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        // 12. Tax Impact
        const taxImpact = (db.queryOne(`SELECT SUM(p.NetLineTotalWithTaxLocalCurrency_Amount - p.NetLineSubTotalLocalCurrency_Amount) as sum ${activeOrderCond}`) as { sum: number }).sum || 0;

        res.json({
            productRevenue,
            revenueWithTax,
            productProfit,
            profitAfterDiscount,
            discountLeakage,
            averageMargin,
            revenueByProduct,
            revenueByPyp,
            revenueByStorage,
            revenueByProduction,
            commissionExposure,
            taxImpact
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Profit Waterfall Endpoint
router.get('/waterfall', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const activeOrderCond = `
            FROM CrmOrderProducts p
            JOIN CrmOrder o ON p.CrmOrderId = o.Id
            WHERE o.Status != 5 AND o.IsDeletedFromBackend = 0
        `;

        const waterfallData = db.queryOne(`
            SELECT 
                SUM(p.Quantity * COALESCE(p.UnitPrice_Amount, 0)) as grossPotentialValue,
                SUM(COALESCE(p.LineDiscountAmount_Amount, 0)) as totalLineDiscount,
                SUM(COALESCE(p.NetLineSubTotal_Amount, p.Quantity * COALESCE(p.UnitPrice_Amount, 0) - COALESCE(p.LineDiscountAmount_Amount, 0))) as netSubTotal,
                SUM(p.Quantity * COALESCE(p.PurchasingPrice_Amount, 0)) as totalCOGS,
                SUM(COALESCE(p.ProfitAfterSubtotalDiscountLocalCurrency_Amount, 0)) as profitAfterDiscounts,
                AVG(COALESCE(p.ProfitRate, 0)) as avgProfitMargin
            ${activeOrderCond}
        `);

        res.json(waterfallData || {});
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
