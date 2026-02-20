import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Stock Analytics - Dashboard KPIs
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const activeStateCond = 'State = 1'; // 1 = Active

        // 1. Active Product Count
        const activeProductCount = (db.prepare(`SELECT COUNT(*) as n FROM Stock WHERE ${activeStateCond}`).get() as { n: number }).n;

        // 2. Product Count by Brand
        const countByBrand = db.prepare(`SELECT BrandId, COUNT(*) as count FROM Stock WHERE BrandId IS NOT NULL AND ${activeStateCond} GROUP BY BrandId`).all();

        // 3. Product Count by ProductGroup
        const countByGroup = db.prepare(`SELECT ProductGroupId, COUNT(*) as count FROM Stock WHERE ProductGroupId IS NOT NULL AND ${activeStateCond} GROUP BY ProductGroupId`).all();

        // 4. Low Stock Risk (Identifying items with MinStockLevel defined)
        const lowStockRiskItems = db.prepare(`SELECT Id, Name, Code, MinStockLevel FROM Stock WHERE MinStockLevel IS NOT NULL AND ${activeStateCond}`).all();

        // 5. Reorder Candidates
        const reorderCandidates = db.prepare(`SELECT Id, Name, Code, OrderLevel FROM Stock WHERE OrderLevel IS NOT NULL AND ${activeStateCond}`).all();

        // 6. Warranty Tracked Products
        const warrantyTrackedCount = (db.prepare(`SELECT COUNT(*) as n FROM Stock WHERE InvWillWarrantyBeFollowed = 1 AND ${activeStateCond}`).get() as { n: number }).n;

        // 7. VAT Distribution
        const vatDistribution = db.prepare(`SELECT SalesVatValue, COUNT(*) as count FROM Stock WHERE ${activeStateCond} GROUP BY SalesVatValue`).all();

        res.json({
            activeProductCount,
            countByBrand,
            countByGroup,
            lowStockRiskItems,
            reorderCandidates,
            warrantyTrackedCount,
            vatDistribution
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
