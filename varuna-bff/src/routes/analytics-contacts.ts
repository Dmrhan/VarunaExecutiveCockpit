import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Contacts Analytics - Dashboard KPIs
// ============================================================================
router.get('/', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        // 1. Total Contact Count
        const totalContactCount = (db.queryOne(`SELECT COUNT(*) as n FROM Contacts`) as { n: number }).n;

        // 2. Active Contact Count (Assuming AccountStatus 1 = Active)
        const activeContactCount = (db.queryOne(`SELECT COUNT(*) as n FROM Contacts WHERE AccountStatus = 1`) as { n: number }).n;

        // 3. Blacklisted Contacts (Assuming BlackList 0 = No, anything else = Yes)
        const blacklistedCount = (db.queryOne(`SELECT COUNT(*) as n FROM Contacts WHERE BlackList != 0 AND BlackList IS NOT NULL`) as { n: number }).n;

        // 4. Contacts by Owner
        const countByOwner = db.query(`SELECT ContactOwnerId, COUNT(*) as count FROM Contacts WHERE ContactOwnerId IS NOT NULL GROUP BY ContactOwnerId`);

        // 5. Contacts by SDR
        const countBySdr = db.query(`SELECT SDROwnerId, COUNT(*) as count FROM Contacts WHERE SDROwnerId IS NOT NULL GROUP BY SDROwnerId`);

        // 6. Marketing Permission Distribution
        const marketingPerms = db.queryOne(`
            SELECT 
                SUM(CASE WHEN MarketingAuthorizationviaGSM = 1 THEN 1 ELSE 0 END) as gsmAuthorized,
                SUM(CASE WHEN MarketingAuthorizationviaEmail = 1 THEN 1 ELSE 0 END) as emailAuthorized
            FROM Contacts
        `);

        // 7. Contact Age Segmentation (derived from BirthDate)
        const yearNow = db.driver === 'mssql' ? 'YEAR(GETUTCDATE())' : "cast(strftime('%Y', 'now') as integer)";
        const yearBirth = db.driver === 'mssql' ? 'YEAR(BirthDate)' : "cast(strftime('%Y', BirthDate) as integer)";
        const ageSegmentation = db.query(`
            SELECT BirthDate, (${yearNow} - ${yearBirth}) as Age 
            FROM Contacts 
            WHERE BirthDate IS NOT NULL
        `);

        // 8. First Touch Funnel
        const monthFormat = db.driver === 'mssql' ? "FORMAT(FirstTouchDate, 'yyyy-MM')" : "strftime('%Y-%m', FirstTouchDate)";
        const firstTouchFunnel = db.query(`
            SELECT ${monthFormat} as Month, COUNT(*) as count 
            FROM Contacts 
            WHERE FirstTouchDate IS NOT NULL 
            GROUP BY ${monthFormat}
            ORDER BY Month ASC
        `);

        // 9. Importance Distribution
        const importanceDistribution = db.query(`SELECT Importance, COUNT(*) as count FROM Contacts WHERE Importance IS NOT NULL GROUP BY Importance`);

        // 10. Communication Permission Filter (Assuming CommunicationInfo 1 = AllowCommunication)
        const communicationAllowed = db.query(`SELECT Id, FirstName, LastName FROM Contacts WHERE CommunicationInfo = 1`);


        res.json({
            totalContactCount,
            activeContactCount,
            blacklistedCount,
            countByOwner,
            countBySdr,
            marketingPermissions: {
                gsmAuthorized: (marketingPerms as any)?.gsmAuthorized || 0,
                emailAuthorized: (marketingPerms as any)?.emailAuthorized || 0
            },
            ageSegmentation,
            firstTouchFunnel,
            importanceDistribution,
            communicationAllowed
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
