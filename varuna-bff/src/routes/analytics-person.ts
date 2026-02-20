import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

// ============================================================================
// Person Analytics - Headcount & Demographics
// ============================================================================
router.get('/headcount', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        const activeCount = (db.prepare(`SELECT COUNT(*) as n FROM Person WHERE Status = 1`).get() as { n: number }).n;
        const inactiveCount = (db.prepare(`SELECT COUNT(*) as n FROM Person WHERE Status = 2`).get() as { n: number }).n;

        const byRole = db.prepare(`SELECT RoleId, COUNT(*) as count FROM Person WHERE Status = 1 AND RoleId IS NOT NULL GROUP BY RoleId`).all();
        const byDealer = db.prepare(`SELECT DealerId, COUNT(*) as count FROM Person WHERE Status = 1 AND DealerId IS NOT NULL GROUP BY DealerId`).all();
        const byCompany = db.prepare(`SELECT CompanyId, COUNT(*) as count FROM Person WHERE Status = 1 AND CompanyId IS NOT NULL GROUP BY CompanyId`).all();

        const avgAge = db.prepare(`SELECT AVG((julianday('now') - julianday(BirthDate)) / 365.25) as a FROM Person WHERE BirthDate IS NOT NULL AND Status = 1`).get() as { a: number };

        // Employment duration (Active only)
        const avgDuration = db.prepare(`SELECT AVG((julianday('now') - julianday(EmploymentDate)) / 365.25) as a FROM Person WHERE EmploymentDate IS NOT NULL AND Status = 1`).get() as { a: number };

        res.json({
            activePersonnelCount: activeCount,
            inactivePersonnelCount: inactiveCount,
            headcountByRole: byRole,
            headcountByDealer: byDealer,
            headcountByCompany: byCompany,
            averageAgeYears: avgAge.a ? Number(avgAge.a.toFixed(1)) : 0,
            averageEmploymentDurationYears: avgDuration.a ? Number(avgDuration.a.toFixed(1)) : 0
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Person Analytics - Manager Distribution
// ============================================================================
router.get('/managers', (_req: Request, res: Response) => {
    try {
        const db = getDb();
        const distribution = db.prepare(`SELECT ManagerType, COUNT(*) as count FROM Person WHERE Status = 1 AND ManagerType IS NOT NULL GROUP BY ManagerType`).all();
        res.json({ distribution });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// Person Analytics - Time Intelligence (Hiring & Attrition)
// ============================================================================
router.get('/trends', (_req: Request, res: Response) => {
    try {
        const db = getDb();

        const hiring = db.prepare(`
            SELECT strftime('%Y-%m', EmploymentDate) as month, COUNT(*) as count 
            FROM Person 
            WHERE EmploymentDate IS NOT NULL 
            GROUP BY month 
            ORDER BY month DESC 
            LIMIT 12
        `).all();

        const attrition = db.prepare(`
            SELECT strftime('%Y-%m', EndOfEmploymentDate) as month, COUNT(*) as count 
            FROM Person 
            WHERE EndOfEmploymentDate IS NOT NULL 
            GROUP BY month 
            ORDER BY month DESC 
            LIMIT 12
        `).all();

        res.json({
            hiringTrend: hiring,
            attritionTrend: attrition
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
