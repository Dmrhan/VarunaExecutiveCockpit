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
        const totalContactCount = (db.prepare(`SELECT COUNT(*) as n FROM Contacts`).get() as { n: number }).n;

        // 2. Active Contact Count (Assuming AccountStatus 1 = Active)
        const activeContactCount = (db.prepare(`SELECT COUNT(*) as n FROM Contacts WHERE AccountStatus = 1`).get() as { n: number }).n;

        // 3. Blacklisted Contacts (Assuming BlackList 0 = No, anything else = Yes)
        const blacklistedCount = (db.prepare(`SELECT COUNT(*) as n FROM Contacts WHERE BlackList != 0 AND BlackList IS NOT NULL`).get() as { n: number }).n;

        // 4. Contacts by Owner
        const countByOwner = db.prepare(`SELECT ContactOwnerId, COUNT(*) as count FROM Contacts WHERE ContactOwnerId IS NOT NULL GROUP BY ContactOwnerId`).all();

        // 5. Contacts by SDR
        const countBySdr = db.prepare(`SELECT SDROwnerId, COUNT(*) as count FROM Contacts WHERE SDROwnerId IS NOT NULL GROUP BY SDROwnerId`).all();

        // 6. Marketing Permission Distribution
        const marketingPerms = db.prepare(`
            SELECT 
                SUM(CASE WHEN MarketingAuthorizationviaGSM = 1 THEN 1 ELSE 0 END) as gsmAuthorized,
                SUM(CASE WHEN MarketingAuthorizationviaEmail = 1 THEN 1 ELSE 0 END) as emailAuthorized
            FROM Contacts
        `).get();

        // 7. Contact Age Segmentation (derived from BirthDate)
        const ageSegmentation = db.prepare(`
            SELECT BirthDate, (cast(strftime('%Y', 'now') as integer) - cast(strftime('%Y', BirthDate) as integer)) as Age 
            FROM Contacts 
            WHERE BirthDate IS NOT NULL
        `).all();

        // 8. First Touch Funnel
        const firstTouchFunnel = db.prepare(`
            SELECT strftime('%Y-%m', FirstTouchDate) as Month, COUNT(*) as count 
            FROM Contacts 
            WHERE FirstTouchDate IS NOT NULL 
            GROUP BY strftime('%Y-%m', FirstTouchDate)
            ORDER BY Month ASC
        `).all();

        // 9. Importance Distribution
        const importanceDistribution = db.prepare(`SELECT Importance, COUNT(*) as count FROM Contacts WHERE Importance IS NOT NULL GROUP BY Importance`).all();

        // 10. Communication Permission Filter (Assuming CommunicationInfo 1 = AllowCommunication)
        const communicationAllowed = db.prepare(`SELECT Id, FirstName, LastName FROM Contacts WHERE CommunicationInfo = 1`).all();


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
