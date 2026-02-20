import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// InventoryAccountProduct Analytics - Installed Base / Asset KPIs
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // Active Assets Rule: Status = 1 (Assuming 1 is Active)
        const activeCond = 'Status = 1';

        // 1. Installed Base Count
        const installedBaseCount = (db.prepare(`SELECT COUNT(*) as n FROM InventoryAccountProduct WHERE ${activeCond}`).get() as { n: number }).n || 0;

        // 2. Installed Base by Product
        const installedBaseByProduct = db.prepare(`SELECT StockId, COUNT(*) as Count FROM InventoryAccountProduct WHERE ${activeCond} GROUP BY StockId ORDER BY Count DESC`).all();

        // 3. Installed Base by Customer
        const installedBaseByCustomer = db.prepare(`SELECT AccountId, COUNT(*) as Count FROM InventoryAccountProduct WHERE ${activeCond} GROUP BY AccountId ORDER BY Count DESC`).all();

        // 4. Active PF Coverage Rate
        let pfCoverageRate = 0;
        if (installedBaseCount > 0) {
            const pfActiveCount = (db.prepare(`SELECT COUNT(*) as n FROM InventoryAccountProduct WHERE ${activeCond} AND IsPFActive = 1`).get() as { n: number }).n || 0;
            pfCoverageRate = pfActiveCount / installedBaseCount;
        }

        // 5. Installed Revenue Base
        const installedRevenueBase = (db.prepare(`SELECT SUM(TotalPackagePrice_Amount) as sum FROM InventoryAccountProduct WHERE ${activeCond}`).get() as { sum: number }).sum || 0;

        // 6. Average Product Price
        const averageProductPrice = (db.prepare(`SELECT AVG(Price_Amount) as avg FROM InventoryAccountProduct WHERE ${activeCond} AND Price_Amount IS NOT NULL`).get() as { avg: number }).avg || 0;

        // 7. Renewal Candidates (FinishDate <= CURRENT_DATE + 90 days)
        const renewalCandidates = db.prepare(`
            SELECT Id, AccountId, StockId, FinishDate, TotalPackagePrice_Amount, TotalPackagePrice_Currency 
            FROM InventoryAccountProduct 
            WHERE ${activeCond} AND FinishDate IS NOT NULL AND date(FinishDate) <= date('now', '+90 days') 
            ORDER BY FinishDate ASC
        `).all();

        // 8. Out of Warehouse Risk
        const outOfWarehouseRisk = db.prepare(`
            SELECT Id, AccountId, StockId, InvPurchaseDate 
            FROM InventoryAccountProduct 
            WHERE ${activeCond} AND InvOutOfWarehouseSerial = 1
        `).all();

        // 9. Installed by Domain
        const installedByDomain = db.prepare(`SELECT Domain, COUNT(*) as Count FROM InventoryAccountProduct WHERE ${activeCond} AND Domain IS NOT NULL GROUP BY Domain ORDER BY Count DESC`).all();

        // 10. Installation Trend
        const installationTrend = db.prepare(`
            SELECT substr(InvInstalledDate, 1, 7) as Month, COUNT(*) as Count 
            FROM InventoryAccountProduct 
            WHERE ${activeCond} AND InvInstalledDate IS NOT NULL 
            GROUP BY substr(InvInstalledDate, 1, 7) 
            ORDER BY Month ASC
        `).all();

        // Lifecycle Intelligence (Asset Age avg in years)
        const avgAssetAgeYears = (db.prepare(`
            SELECT AVG(julianday('now') - julianday(InvPurchaseDate)) / 365.25 as avgYears 
            FROM InventoryAccountProduct 
            WHERE ${activeCond} AND InvPurchaseDate IS NOT NULL
        `).get() as { avgYears: number }).avgYears || 0;

        res.json({
            installedBaseCount,
            installedBaseByProduct,
            installedBaseByCustomer,
            pfCoverageRate,
            installedRevenueBase,
            averageProductPrice,
            renewalCandidates,
            outOfWarehouseRisk,
            installedByDomain,
            installationTrend,
            lifecycle: {
                avgAssetAgeYears
            }
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
