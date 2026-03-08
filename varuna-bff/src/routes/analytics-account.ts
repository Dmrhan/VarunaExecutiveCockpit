import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Account Analytics - Dashboard KPIs
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const activeStateCond = 'State = 1'; // 1 = Active

        // 1. Total Active Accounts
        const totalActive = (db.queryOne(`SELECT COUNT(*) as n FROM Account WHERE ${activeStateCond}`) as { n: number }).n;

        // 2. Accounts by Sector
        const bySector = db.query(`SELECT Sector, COUNT(*) as count FROM Account WHERE Sector IS NOT NULL AND ${activeStateCond} GROUP BY Sector`);

        // 3. Accounts by Owner
        const byOwner = db.query(`SELECT OwnerId, COUNT(*) as count FROM Account WHERE ${activeStateCond} GROUP BY OwnerId`);

        // 4. Accounts by Dealer
        const byDealer = db.query(`SELECT DealerId, COUNT(*) as count FROM Account WHERE DealerId IS NOT NULL AND ${activeStateCond} GROUP BY DealerId`);

        // 5. Credit Risk Exposure
        const totalRiskExposure = (db.queryOne(`SELECT SUM(RiskLimit_Amount) as total FROM Account WHERE ${activeStateCond}`) as { total: number }).total || 0;

        // 6. Total Credit Limit
        const totalCreditLimit = (db.queryOne(`SELECT SUM(CreditLimit_Amount) as total FROM Account WHERE ${activeStateCond}`) as { total: number }).total || 0;

        // 7. Invoice Generated Rate
        const invoiceGeneratedCount = (db.queryOne(`SELECT COUNT(*) as n FROM Account WHERE IsInvoiceGenerated IS NOT NULL AND ${activeStateCond}`) as { n: number }).n;

        // 8. Training Coverage
        const trainingCoverageCount = (db.queryOne(`SELECT COUNT(*) as n FROM Account WHERE IsTrainingProvided IS NOT NULL AND ${activeStateCond}`) as { n: number }).n;

        // 9. Contract Coverage
        const contractCoverageCount = (db.queryOne(`SELECT COUNT(*) as n FROM Account WHERE IsContractReceived IS NOT NULL AND ${activeStateCond}`) as { n: number }).n;

        // 10. Last Touch Aging (Top 10 oldest untouched accounts)
        const agingExpr = db.driver === 'mssql' ? 'DATEDIFF(day, LastTouchDate, GETUTCDATE())' : "(julianday('now') - julianday(LastTouchDate))";
        const agingAccounts = db.query(`
            SELECT Id, Name, OwnerId, ${agingExpr} as agingDays 
            FROM Account 
            WHERE LastTouchDate IS NOT NULL AND ${activeStateCond} 
            ORDER BY agingDays DESC 
            ${db.driver === 'mssql' ? 'OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY' : 'LIMIT 10'}
        `);

        res.json({
            totalActive,
            bySector,
            byOwner,
            byDealer,
            totalRiskExposure,
            totalCreditLimit,
            invoiceGeneratedCount,
            trainingCoverageCount,
            contractCoverageCount,
            agingAccounts
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 11. List all accounts for filters (ID, Name, Title) with pagination
router.get('/list', (req: Request, res: Response) => {
    try {
        const db = getDb();
        const top = parseInt(req.query.$top as string) || 100;
        const skip = parseInt(req.query.$skip as string) || 0;
        const activeStateCond = 'State = 1';

        let querySql = `
            SELECT Id, Name, Title 
            FROM Account 
            WHERE ${activeStateCond} 
            ORDER BY COALESCE(Title, Name) ASC
        `;

        if (db.driver === 'mssql') {
            querySql += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
        } else {
            querySql += ` LIMIT @limit OFFSET @offset`;
        }

        const accounts = db.query(querySql, { limit: top, offset: skip });
        res.json(accounts);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
