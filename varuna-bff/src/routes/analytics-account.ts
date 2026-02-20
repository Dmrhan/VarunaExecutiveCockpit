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
        const totalActive = (db.prepare(`SELECT COUNT(*) as n FROM Account WHERE ${activeStateCond}`).get() as { n: number }).n;

        // 2. Accounts by Sector
        const bySector = db.prepare(`SELECT Sector, COUNT(*) as count FROM Account WHERE Sector IS NOT NULL AND ${activeStateCond} GROUP BY Sector`).all();

        // 3. Accounts by Owner
        const byOwner = db.prepare(`SELECT OwnerId, COUNT(*) as count FROM Account WHERE ${activeStateCond} GROUP BY OwnerId`).all();

        // 4. Accounts by Dealer
        const byDealer = db.prepare(`SELECT DealerId, COUNT(*) as count FROM Account WHERE DealerId IS NOT NULL AND ${activeStateCond} GROUP BY DealerId`).all();

        // 5. Credit Risk Exposure
        const totalRiskExposure = (db.prepare(`SELECT SUM(RiskLimit_Amount) as total FROM Account WHERE ${activeStateCond}`).get() as { total: number }).total || 0;

        // 6. Total Credit Limit
        const totalCreditLimit = (db.prepare(`SELECT SUM(CreditLimit_Amount) as total FROM Account WHERE ${activeStateCond}`).get() as { total: number }).total || 0;

        // 7. Invoice Generated Rate
        const invoiceGeneratedCount = (db.prepare(`SELECT COUNT(*) as n FROM Account WHERE IsInvoiceGenerated IS NOT NULL AND ${activeStateCond}`).get() as { n: number }).n;

        // 8. Training Coverage
        const trainingCoverageCount = (db.prepare(`SELECT COUNT(*) as n FROM Account WHERE IsTrainingProvided IS NOT NULL AND ${activeStateCond}`).get() as { n: number }).n;

        // 9. Contract Coverage
        const contractCoverageCount = (db.prepare(`SELECT COUNT(*) as n FROM Account WHERE IsContractReceived IS NOT NULL AND ${activeStateCond}`).get() as { n: number }).n;

        // 10. Last Touch Aging (Top 10 oldest untouched accounts)
        const agingAccounts = db.prepare(`
            SELECT Id, Name, OwnerId, (julianday('now') - julianday(LastTouchDate)) as agingDays 
            FROM Account 
            WHERE LastTouchDate IS NOT NULL AND ${activeStateCond} 
            ORDER BY agingDays DESC 
            LIMIT 10
        `).all();

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

export default router;
