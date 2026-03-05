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
        const installedBaseCount = (db.queryOne(`SELECT COUNT(*) as n FROM InventoryAccountProduct WHERE ${activeCond}`) as { n: number }).n || 0;

        // 2. Installed Base by Product
        const installedBaseByProduct = db.query(`SELECT StockId, COUNT(*) as Count FROM InventoryAccountProduct WHERE ${activeCond} GROUP BY StockId ORDER BY Count DESC`);

        // 3. Installed Base by Customer
        const installedBaseByCustomer = db.query(`
            SELECT 
                i.AccountId, 
                COALESCE(a.Title, a.Name, i.AccountId) as AccountName,
                COUNT(*) as Count 
            FROM InventoryAccountProduct i
            LEFT JOIN Account a ON i.AccountId = a.Id
            WHERE i.${activeCond} 
            GROUP BY i.AccountId, a.Title, a.Name 
            ORDER BY Count DESC
        `);

        // 4. Active PF Coverage Rate
        let pfCoverageRate = 0;
        if (installedBaseCount > 0) {
            const pfActiveCount = (db.queryOne(`SELECT COUNT(*) as n FROM InventoryAccountProduct WHERE ${activeCond} AND IsPFActive = 1`) as { n: number }).n || 0;
            pfCoverageRate = pfActiveCount / installedBaseCount;
        }

        // 5. Installed Revenue Base
        const installedRevenueBase = (db.queryOne(`SELECT SUM(TotalPackagePrice_Amount) as sum FROM InventoryAccountProduct WHERE ${activeCond}`) as { sum: number }).sum || 0;

        // 6. Average Product Price
        const averageProductPrice = (db.queryOne(`SELECT AVG(Price_Amount) as avg FROM InventoryAccountProduct WHERE ${activeCond} AND Price_Amount IS NOT NULL`) as { avg: number }).avg || 0;

        // 7. Renewal Candidates (FinishDate <= CURRENT_DATE + 90 days)
        const dateLimit = db.driver === 'mssql' ? 'DATEADD(day, 90, GETUTCDATE())' : "date('now', '+90 days')";
        const renewalCandidates = db.query(`
            SELECT 
                i.Id, i.AccountId, COALESCE(a.Title, a.Name, i.AccountId) as AccountName,
                i.StockId, i.FinishDate, i.TotalPackagePrice_Amount, i.TotalPackagePrice_Currency 
            FROM InventoryAccountProduct i
            LEFT JOIN Account a ON i.AccountId = a.Id
            WHERE i.${activeCond} AND i.FinishDate IS NOT NULL AND i.FinishDate <= ${dateLimit} 
            ORDER BY i.FinishDate ASC
        `);

        // 8. Out of Warehouse Risk
        const outOfWarehouseRisk = db.query(`
            SELECT 
                i.Id, i.AccountId, COALESCE(a.Title, a.Name, i.AccountId) as AccountName,
                i.StockId, i.InvPurchaseDate 
            FROM InventoryAccountProduct i
            LEFT JOIN Account a ON i.AccountId = a.Id
            WHERE i.${activeCond} AND i.InvOutOfWarehouseSerial = 1
        `);

        // 9. Installed by Domain
        const installedByDomain = db.query(`SELECT Domain, COUNT(*) as Count FROM InventoryAccountProduct WHERE ${activeCond} AND Domain IS NOT NULL GROUP BY Domain ORDER BY Count DESC`);

        // 10. Installation Trend
        const trendExpr = db.driver === 'mssql' ? 'LEFT(InvInstalledDate, 7)' : 'substr(InvInstalledDate, 1, 7)';
        const installationTrend = db.query(`
            SELECT ${trendExpr} as Month, COUNT(*) as Count 
            FROM InventoryAccountProduct 
            WHERE ${activeCond} AND InvInstalledDate IS NOT NULL 
            GROUP BY ${trendExpr} 
            ORDER BY Month ASC
        `);

        // Lifecycle Intelligence (Asset Age avg in years)
        const ageExpr = db.driver === 'mssql'
            ? 'DATEDIFF(day, InvPurchaseDate, GETUTCDATE())'
            : "(julianday('now') - julianday(InvPurchaseDate))";
        const avgAssetAgeYears = (db.queryOne(`
            SELECT AVG(CAST(${ageExpr} AS FLOAT)) / 365.25 as avgYears 
            FROM InventoryAccountProduct 
            WHERE ${activeCond} AND InvPurchaseDate IS NOT NULL
        `) as { avgYears: number }).avgYears || 0;

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
